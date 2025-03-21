// YouTube Looper Extension - Content Script

// Wait for YouTube's player to be fully initialized
let intervalID = setInterval(checkForYouTubePlayer, 1000);

function checkForYouTubePlayer() {
  // Check if the YouTube player exists
  const player = document.querySelector('.html5-video-player');
  const video = document.querySelector('video');
  
  if (player && video) {
    clearInterval(intervalID);
    initializeLooper();
  }
}

function initializeLooper() {
  // Create the looper widget
  createLooperWidget();
  
  // Set up event listeners
  setupEventListeners();
  
  // Restore previously saved settings if available
  restoreSettings();
}

function createLooperWidget() {
  // Create container for the looper widget
  const looperContainer = document.createElement('div');
  looperContainer.id = 'yt-looper-container';
  
  // Create HTML for the looper widget
  looperContainer.innerHTML = `
    <div class="yt-looper-toggle-bar">
      <button id="yt-looper-toggle-button">YouTube Looper ▼</button>
    </div>
    <div class="yt-looper-content hidden">
      <div class="yt-looper-header">
        <h3>YouTube Looper</h3>
        <div class="yt-looper-toggle">
          <input type="checkbox" id="loop-toggle" />
          <label for="loop-toggle">Loop Active</label>
        </div>
      </div>
      <div class="yt-looper-controls">
        <div class="yt-looper-input-group">
          <label for="loop-start">Start:</label>
          <input type="text" id="loop-start" placeholder="0:00" />
          <button id="set-current-start">Set Current</button>
        </div>
        <div class="yt-looper-input-group">
          <label for="loop-end">End:</label>
          <input type="text" id="loop-end" placeholder="End of video" />
          <button id="set-current-end">Set Current</button>
        </div>
      </div>
      <div class="yt-looper-actions">
        <button id="apply-loop">Apply Loop</button>
        <button id="save-loop">Save Loop</button>
      </div>
      <div id="saved-loops"></div>
    </div>
  `;
  
  // Try multiple selectors to find the right place to insert the widget
  // Priority order of insertion attempts:
  let inserted = false;
  
  // 1. Try the typical location below the player
  const belowElement = document.querySelector('#below');
  if (belowElement) {
    belowElement.prepend(looperContainer);
    inserted = true;
    console.log('YouTube Looper: Inserted using #below selector');
  }
  
  // 2. Try inserting after the player
  if (!inserted) {
    const playerContainer = document.querySelector('#player-container');
    if (playerContainer) {
      playerContainer.insertAdjacentElement('afterend', looperContainer);
      inserted = true;
      console.log('YouTube Looper: Inserted after player-container');
    }
  }
  
  // 3. Try inserting after the primary info
  if (!inserted) {
    const primaryInfo = document.querySelector('#primary-inner');
    if (primaryInfo) {
      primaryInfo.prepend(looperContainer);
      inserted = true;
      console.log('YouTube Looper: Inserted at top of primary-inner');
    }
  }
  
  // 4. Last resort: try to add it after the video element
  if (!inserted) {
    const videoElement = document.querySelector('video');
    if (videoElement && videoElement.parentElement) {
      const videoParent = videoElement.closest('#movie_player') || videoElement.closest('.html5-video-container');
      if (videoParent) {
        videoParent.insertAdjacentElement('afterend', looperContainer);
        inserted = true;
        console.log('YouTube Looper: Inserted after video element');
      }
    }
  }
  
  // If still not inserted, add a more aggressive approach with a mutation observer
  if (!inserted) {
    console.log('YouTube Looper: Could not find a suitable location initially. Adding mutation observer.');
    
    // Create a mutation observer to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
      for (let mutation of mutations) {
        if (mutation.addedNodes.length) {
          // If we find a suitable element, insert the looper
          const belowElement = document.querySelector('#below') || 
                               document.querySelector('#player-container') ||
                               document.querySelector('#primary-inner');
          
          if (belowElement && !document.getElementById('yt-looper-container')) {
            belowElement.prepend(looperContainer);
            observer.disconnect();
            console.log('YouTube Looper: Inserted after DOM mutation');
            return;
          }
        }
      }
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Set up toggle button event listener after insertion
  const toggleButton = document.getElementById('yt-looper-toggle-button');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleLooperVisibility);
  }
}

function toggleLooperVisibility() {
  const content = document.querySelector('.yt-looper-content');
  const toggleButton = document.getElementById('yt-looper-toggle-button');
  
  if (content) {
    // Toggle the visibility
    content.classList.toggle('hidden');
    
    // Update the button text
    if (content.classList.contains('hidden')) {
      toggleButton.textContent = 'YouTube Looper ▼';
    } else {
      toggleButton.textContent = 'YouTube Looper ▲';
    }
    
    // Save the visibility state
    saveSettings();
  }
}

function setupEventListeners() {
  const video = document.querySelector('video');
  if (!video) return;
  
  // Loop toggle functionality
  const loopToggle = document.getElementById('loop-toggle');
  if (loopToggle) {
    loopToggle.addEventListener('change', function() {
      if (this.checked) {
        startLoop();
      } else {
        stopLoop();
      }
    });
  }
  
  // Set current time as start
  const setCurrentStart = document.getElementById('set-current-start');
  if (setCurrentStart) {
    setCurrentStart.addEventListener('click', function() {
      const startInput = document.getElementById('loop-start');
      startInput.value = formatTime(video.currentTime);
    });
  }
  
  // Set current time as end
  const setCurrentEnd = document.getElementById('set-current-end');
  if (setCurrentEnd) {
    setCurrentEnd.addEventListener('click', function() {
      const endInput = document.getElementById('loop-end');
      endInput.value = formatTime(video.currentTime);
    });
  }
  
  // Apply loop button
  const applyLoop = document.getElementById('apply-loop');
  if (applyLoop) {
    applyLoop.addEventListener('click', function() {
      startLoop();
      document.getElementById('loop-toggle').checked = true;
    });
  }
  
  // Save loop button
  const saveLoop = document.getElementById('save-loop');
  if (saveLoop) {
    saveLoop.addEventListener('click', saveCurrentLoop);
  }
  
  // Timeupdate event to manage looping
  video.addEventListener('timeupdate', checkLoopBoundaries);
}

let loopInterval;
let loopStart = 0;
let loopEnd = 0;
let isLooping = false;
let savedLoops = [];
let isExpanded = false; // Track visibility state

function startLoop() {
  const video = document.querySelector('video');
  if (!video) return;
  
  const startInput = document.getElementById('loop-start');
  const endInput = document.getElementById('loop-end');
  
  loopStart = parseTimeString(startInput.value) || 0;
  loopEnd = parseTimeString(endInput.value) || video.duration;
  
  // Validate loop points
  if (loopStart >= loopEnd) {
    alert('Start time must be less than end time');
    return;
  }
  
  if (loopEnd > video.duration) {
    loopEnd = video.duration;
    endInput.value = formatTime(loopEnd);
  }
  
  isLooping = true;
  
  // If video is currently outside the loop range, seek to the start
  if (video.currentTime < loopStart || video.currentTime > loopEnd) {
    video.currentTime = loopStart;
  }
  
  // Save current settings
  saveSettings();
}

function stopLoop() {
  isLooping = false;
}

function checkLoopBoundaries() {
  const video = document.querySelector('video');
  if (!video || !isLooping) return;
  
  if (video.currentTime >= loopEnd) {
    video.currentTime = loopStart;
  }
}

function saveCurrentLoop() {
  const startInput = document.getElementById('loop-start');
  const endInput = document.getElementById('loop-end');
  
  const loopName = prompt('Enter a name for this loop:', 'My Loop');
  if (!loopName) return;
  
  const newLoop = {
    name: loopName,
    start: startInput.value || '0:00',
    end: endInput.value || 'End'
  };
  
  savedLoops.push(newLoop);
  updateSavedLoops();
  saveSettings();
}

function updateSavedLoops() {
  const savedLoopsContainer = document.getElementById('saved-loops');
  if (!savedLoopsContainer) return;
  
  savedLoopsContainer.innerHTML = '<h4>Saved Loops</h4>';
  
  if (savedLoops.length === 0) {
    savedLoopsContainer.innerHTML += '<p>No saved loops yet</p>';
    return;
  }
  
  const loopList = document.createElement('ul');
  savedLoops.forEach((loop, index) => {
    const loopItem = document.createElement('li');
    loopItem.innerHTML = `
      <span>${loop.name} (${loop.start} - ${loop.end})</span>
      <button class="apply-saved" data-index="${index}">Apply</button>
      <button class="delete-saved" data-index="${index}">Delete</button>
    `;
    loopList.appendChild(loopItem);
  });
  
  savedLoopsContainer.appendChild(loopList);
  
  // Add event listeners to the new buttons
  document.querySelectorAll('.apply-saved').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      applySavedLoop(index);
    });
  });
  
  document.querySelectorAll('.delete-saved').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      deleteSavedLoop(index);
    });
  });
}

function applySavedLoop(index) {
  if (index < 0 || index >= savedLoops.length) return;
  
  const loop = savedLoops[index];
  document.getElementById('loop-start').value = loop.start;
  document.getElementById('loop-end').value = loop.end;
  
  // Apply and activate loop
  startLoop();
  document.getElementById('loop-toggle').checked = true;
}

function deleteSavedLoop(index) {
  if (index < 0 || index >= savedLoops.length) return;
  
  if (confirm(`Delete loop "${savedLoops[index].name}"?`)) {
    savedLoops.splice(index, 1);
    updateSavedLoops();
    saveSettings();
  }
}

// Helper Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTimeString(timeStr) {
  if (!timeStr) return 0;
  
  // Handle MM:SS format
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  
  // Try to parse as seconds
  return parseFloat(timeStr) || 0;
}

// Storage functions
function saveSettings() {
  // Get the video ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (!videoId) return;
  
  // Get current expanded state
  const content = document.querySelector('.yt-looper-content');
  if (content) {
    isExpanded = !content.classList.contains('hidden');
  }
  
  const settings = {
    loopStart: document.getElementById('loop-start')?.value || '',
    loopEnd: document.getElementById('loop-end')?.value || '',
    isLooping: isLooping,
    savedLoops: savedLoops,
    isExpanded: isExpanded
  };
  
  localStorage.setItem(`yt-looper-${videoId}`, JSON.stringify(settings));
}

function restoreSettings() {
  // Get the video ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (!videoId) return;
  
  const settingsJson = localStorage.getItem(`yt-looper-${videoId}`);
  if (!settingsJson) return;
  
  try {
    const settings = JSON.parse(settingsJson);
    
    if (document.getElementById('loop-start')) {
      document.getElementById('loop-start').value = settings.loopStart || '';
    }
    
    if (document.getElementById('loop-end')) {
      document.getElementById('loop-end').value = settings.loopEnd || '';
    }
    
    if (settings.savedLoops && Array.isArray(settings.savedLoops)) {
      savedLoops = settings.savedLoops;
      updateSavedLoops();
    }
    
    // Restore expanded state if available
    if (settings.hasOwnProperty('isExpanded')) {
      isExpanded = settings.isExpanded;
      const content = document.querySelector('.yt-looper-content');
      const toggleButton = document.getElementById('yt-looper-toggle-button');
      
      if (content && toggleButton) {
        if (isExpanded) {
          content.classList.remove('hidden');
          toggleButton.textContent = 'YouTube Looper ▲';
        } else {
          content.classList.add('hidden');
          toggleButton.textContent = 'YouTube Looper ▼';
        }
      }
    }
    
    if (settings.isLooping) {
      if (document.getElementById('loop-toggle')) {
        document.getElementById('loop-toggle').checked = true;
      }
      startLoop();
    }
  } catch (e) {
    console.error('Error restoring YouTube Looper settings:', e);
  }
} 