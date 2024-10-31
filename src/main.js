const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const ffprobePathModule = require('ffprobe-static-electron');
const ffprobePath = ffprobePathModule.path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffprobePath)

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'frontend/preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'frontend/index.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

ipcMain.handle('get-video-files', async (_, folderPath) => {
  const files = await fs.readdir(folderPath);
  const videoFiles = files.filter(file => file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.avi'));

  const videoObjects = await Promise.all(videoFiles.map(async file => {
    const filePath = path.join(folderPath, file);
    const stats = await fs.stat(filePath);
    // assume duration is 1 min
    const duration = 60000;
    const name = `${new Date(stats.ctimeMs - duration).toLocaleString(["en-gb"],{hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
    return {
      name,
      path: filePath,
      start_timestamp: stats.ctimeMs - duration,
      end_timestamp: stats.ctimeMs
    };
  }));

  // sort by start_timestamp
  videoObjects.sort((a, b) => a.start_timestamp - b.start_timestamp);

  // group into events where the end_timestamp of the previous video is within 10 seconds of the start_timestamp of the next video
  // Each event is an object with a start_timestamp, end_timestamp, and videos array. it also has a display name that is a readable version of the start time of the first video in brackets is teh duration in minutes caluclated from the end time of the last video in the event

  const events = [];

  let currentEvent = {
    start_timestamp: videoObjects[0].start_timestamp,
    end_timestamp: videoObjects[0].end_timestamp,
    videos: [videoObjects[0]]
  };

  for (let i = 1; i < videoObjects.length; i++) {
    const video = videoObjects[i];
    const start = video.start_timestamp;
    const end = currentEvent.end_timestamp;
    const diff = Math.abs(end - start);
    // 1 min
    if (diff < 60000) {
      currentEvent.end_timestamp = video.end_timestamp;
      currentEvent.videos.push(video);
    } else {
      currentEvent.display_name = `${new Date(currentEvent.start_timestamp).toLocaleString()} (${Math.round((currentEvent.end_timestamp - currentEvent.start_timestamp) / 60000)} Minutes)`;
      events.push(currentEvent);
      currentEvent = {
        start_timestamp: video.start_timestamp,
        end_timestamp: video.end_timestamp,
        videos: [video]
      };
    }
  }

  currentEvent.display_name = `${new Date(currentEvent.start_timestamp).toLocaleString()} (${Math.round((currentEvent.end_timestamp - currentEvent.start_timestamp) / 60000)} Minutes)`;
  events.push(currentEvent);

  return events;
});
