let selectedEventIndex = null;
let selectedEventVideoIndex = 0;
let events = [];
let folderPath = null;
let videos = [];
const videoPlayer = document.getElementById('video');
const folderLabel = document.getElementById('loaded-folder');

document.getElementById('select-folder').addEventListener('click', async () => {
  folderPath = await window.electronAPI.selectFolder();
  
  if (folderPath) {
    // show spinner
    document.getElementById('spinner').style.display = 'block';
    const videos = await window.electronAPI.getVideoFiles(folderPath);
    document.getElementById('spinner').style.display = 'none';
    displayVideos(videos);
    folderLabel.textContent = folderPath;
  }
});

function displayVideos(events) {
  const videoContainer = document.getElementById('selector-container');
  videoContainer.innerHTML = '';

  // events is an array of events with start_timestamp, end_timestamp, videos, and display_name. 

  // group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.start_timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  for (const [date, events] of Object.entries(groupedEvents)) {
    const dateHeader = document.createElement('h2');
    dateHeader.textContent = date;
    videoContainer.appendChild(dateHeader);

    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';

      const eventLink = document.createElement('a');
      eventLink.href = '#';
      eventLink.textContent = event.display_name;
      eventLink.onclick = () => openEvent(event);

      eventElement.appendChild(eventLink);
      videoContainer.appendChild(eventElement);
    });
  }
}

function openEvent(event) {
  // put a list of videos as links to play with the play video fucntion in the container id video-list
  selectedEvent = event.name
  const videoList = document.getElementById('video-grid');
  videoList.innerHTML = '';
  const heading = document.getElementById('video-list-header');
  heading.textContent = `Video List - ${event.display_name}`;
  // sort videos by start time
  videos = event.videos.sort((a, b) => a.start_timestamp - b.start_timestamp);
  videos.forEach((video, index) => {
    const linkContainer = document.createElement('div');
    const videoLink = document.createElement('a');
    const thumbnail = document.createElement('video');
    const span = document.createElement('span');
    
    thumbnail.src = video.path;
    thumbnail.className = 'thumbnail';
    videoLink.className = 'video-link';
    videoLink.href = '#';
    videoLink.onclick = () => playVideo(index);
    
    span.textContent = video.name;
    
    videoLink.appendChild(thumbnail);
    videoLink.appendChild(span);
    linkContainer.appendChild(videoLink);
    videoList.appendChild(linkContainer);
  });
  playVideo(0, autoPlay = false);
  // find the anchor tag with the same name as the event and add the live class to it
  const eventLinks = document.querySelectorAll('.event-item a');
  eventLinks.forEach(link => {
    if (link.textContent === event.display_name) {
      link.classList.add('live');
    } else {
      link.classList.remove('live');
    }
  });
}

function playVideo(index, autoPlay = true) {
  const path = videos[index].path;
  selectedEventVideoIndex = index;
  // find the anchor tag with the video-link class and add the live class to it
  const videoLinks = document.querySelectorAll('.video-link');
  videoLinks.forEach((link, i) => {
    if (i === index) {
      link.classList.add('live');
    } else {
      link.classList.remove('live');
    }
  });
  videoPlayer.controls = true;
  videoPlayer.src = `file://${path}`;
  videoPlayer.style.width = '100%';
  if (autoPlay) {
    videoPlayer.play();
  }
}

// handle play back controls
document.getElementById('play-pause').addEventListener('click', () => {
  if (videoPlayer.paused) {
    videoPlayer.play();
  } else {
    videoPlayer.pause();
  }
});

// prev and next buttons
document.getElementById('prev').addEventListener('click', () => {
  if (selectedEventVideoIndex > 0) {
    playVideo(selectedEventVideoIndex - 1);
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (selectedEventVideoIndex < videos.length - 1) {
    playVideo(selectedEventVideoIndex + 1);
  }
});

// when player gets to end of file, play the next video if there is one
videoPlayer.addEventListener('ended', () => {
  if (selectedEventVideoIndex < videos.length - 1) {
    playVideo(selectedEventVideoIndex + 1);
  }
});


