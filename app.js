async function initializeApp() {
  console.log("Initializing app...");
  createSongList(); // Create the song list immediately
  console.log("Song list creation attempted.");

  try {
      await Tone.start();
      console.log("AudioContext started/resumed after user gesture (if initially suspended).");
  } catch (error) {
      console.error("Error starting Tone.js:", error);
      alert("Could not initialize audio. Please ensure your browser supports Web Audio and try again. Interaction with the page might be required.");
  }
}

// Available songs with their stems
const songs = {
  "Stray Dog": {
      stems: {
          vocals: { name: "Vocals", file: "stems/stray_dog/vocals.mp3" },
          bass: { name: "Bass", file: "stems/stray_dog/bass.mp3" },
          drums: { name: "Drums", file: "stems/stray_dog/drums.mp3" },
          music: { name: "Music", file: "stems/stray_dog/music.mp3" }
      }
  }
};

// Audio context and player setup
let currentSong = null;
const stems = {
  vocals: { name: "Vocals", player: new Tone.Player(), volume: new Tone.Volume(0) },
  bass: { name: "Bass", player: new Tone.Player(), volume: new Tone.Volume(0) },
  drums: { name: "Drums", player: new Tone.Player(), volume: new Tone.Volume(0) },
  music: { name: "Music", player: new Tone.Player(), volume: new Tone.Volume(0) }
};

// Connect all stems to the master output
Object.values(stems).forEach(stem => {
  stem.player.chain(stem.volume, Tone.Destination);
});

// UI Elements
const songList = document.getElementById('songList');
const stemControls = document.getElementById('stemControls');
const playPauseBtn = document.getElementById('playPause');
const resetBtn = document.getElementById('reset');

// Create song list UI
function createSongList() {
  if (!songList) {
      console.error("#songList element not found in the DOM.");
      return;
  }
  songList.innerHTML = ''; // Clear existing list items
  Object.keys(songs).forEach(songName => {
      const songItem = document.createElement('button');
      songItem.className = 'list-group-item list-group-item-action bg-dark text-light';
      songItem.textContent = songName;
      songItem.addEventListener('click', () => loadSong(songName));
      songList.appendChild(songItem);
  });
  console.log("Song list populated.");
}

// Load a song and its stems
async function loadSong(songName) {
  // Ensure AudioContext is running before loading song data that might use it.
  // Tone.start() might have already been called, or this click might be the first user gesture.
  if (Tone.context.state !== 'running') {
      try {
          await Tone.start();
          console.log("AudioContext started/resumed on loadSong gesture.");
      } catch (e) {
          console.error("AudioContext could not be started on song load: ", e);
          alert("Audio system could not be started. Please try interacting with the page again.");
          return; // Don't proceed if audio context isn't running
      }
  }

  currentSong = songName;
  console.log(`Loading song: ${currentSong}`);

  stemControls.innerHTML = ''; // Clear previous stem controls

  const songData = songs[songName];
  if (!songData || !songData.stems) {
      console.error(`No stem data found for song: ${songName}`);
      alert(`Could not load stems for ${songName}.`);
      return;
  }

  // Create and add new stem controls based on the selected song's stems
  Object.keys(songData.stems).forEach(stemKey => {
      const stemInfo = songData.stems[stemKey];
      stemControls.appendChild(createStemControl(stemInfo)); 
  });
  console.log("Stem controls created for", songName);

  try {
      playPauseBtn.disabled = true; // Disable while loading
      resetBtn.disabled = true;

      for (const [key, stemInfo] of Object.entries(songData.stems)) {
          if (stems[key] && stems[key].player) {
              console.log(`Loading stem: ${key} from ${stemInfo.file}`);
              const buffer = await Tone.Buffer.fromUrl(stemInfo.file);
              stems[key].player.buffer = buffer;
              stems[key].player.loop = true;
              console.log(`Stem ${key} loaded.`);
          } else {
              console.warn(`Stem player for '${key}' not found in main 'stems' object.`);
          }
      }

      playPauseBtn.disabled = false;
      resetBtn.disabled = false;
      resetStems(); // Apply default states after loading
      console.log(`${songName} loaded successfully`);
  } catch (error) {
      console.error(`Error loading song ${songName}:`, error);
      alert(`Error loading song ${songName}. Please check file paths and try again.`);
      playPauseBtn.disabled = false; // Re-enable on error
      resetBtn.disabled = false;
  }
}

// Create stem control UI (accepts stemInfo: {name: string, file: string})
function createStemControl(stemInfo) {
  const control = document.createElement('div');
  control.className = 'stem-control';
  const stemKey = stemInfo.name.toLowerCase(); // Ensure consistent key for data-stem
  control.innerHTML = `
      <h6>${stemInfo.name}</h6>
      <div class="btn-group">
          <button class="btn btn-outline-light solo-btn" data-stem="${stemKey}">
              <i class="bi bi-headphones"></i> Solo
          </button>
          <button class="btn btn-outline-light mute-btn" data-stem="${stemKey}">
              <i class="bi bi-volume-mute"></i> Mute
          </button>
      </div>
      <input type="range" class="volume-slider" min="-60" max="0" value="0" step="0.1" data-stem="${stemKey}">
  `;
  return control;
}

// Reset all stems to default state
function resetStems() {
  Object.values(stems).forEach(stem => {
      if (stem.player && stem.player.loaded) stem.player.stop(); // only stop if loaded
      if (stem.volume) {
          stem.volume.volume.value = 0;
          stem.volume.mute = false;
      }
  });

  document.querySelectorAll('.solo-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.mute-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.volume-slider').forEach(slider => slider.value = 0);

  if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
  }
  Tone.Transport.seconds = 0; // Reset transport time
  playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
  console.log("Stems reset and transport stopped.");
}

// Event Listeners
playPauseBtn.addEventListener('click', () => {
  if (!currentSong) return;

  if (Tone.context.state !== 'running') {
      Tone.start().then(() => {
          console.log("AudioContext started/resumed on play button gesture.");
          togglePlayback();
      }).catch(e => {
          console.error("AudioContext could not be started on play: ", e);
          alert("Audio system could not be started. Please try interacting with the page again.");
      });
  } else {
      togglePlayback();
  }
});

function togglePlayback() {
  if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
      console.log("Transport paused");
  } else {
      let allPlayersLoaded = true;
      Object.values(stems).forEach(stem => {
          if (songs[currentSong].stems.hasOwnProperty(stem.name.toLowerCase())) { // only start relevant stems for the current song
               if (!stem.player || !stem.player.loaded) {
                  allPlayersLoaded = false;
                  console.warn(`Player for stem '${stem.name}' is not loaded. Cannot start.`);
              }
          }
      });

      if (allPlayersLoaded) {
          Object.values(stems).forEach(stem => {
               if (songs[currentSong].stems.hasOwnProperty(stem.name.toLowerCase()) && stem.player.loaded) {
                  stem.player.sync().start(0, Tone.Transport.seconds); // Start synced from current transport time
              }
          });
          Tone.Transport.start();
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
          console.log("Transport started with synced players");
      } else {
          console.error("Not all players are loaded. Playback cannot start.");
          alert("Some audio stems are not loaded yet. Please wait or try reloading the song.");
      }
  }
}

resetBtn.addEventListener('click', () => {
  if (!currentSong) return; 
  resetStems();
});

// Delegated event listeners for dynamically created stem controls
document.addEventListener('click', (e) => {
  if (!currentSong) return;

  const soloBtn = e.target.closest('.solo-btn');
  if (soloBtn) {
      const stemKey = soloBtn.dataset.stem;
      const targetStem = stems[stemKey];
      if (!targetStem || !targetStem.volume) {
          console.warn("Target stem for solo not found or has no volume control:", stemKey);
          return;
      }

      soloBtn.classList.toggle('active');
      
      // Get all active solo buttons
      const activeSolos = Array.from(document.querySelectorAll('.solo-btn.active'))
          .map(btn => btn.dataset.stem);

      // If no stems are soloed, unmute everything
      if (activeSolos.length === 0) {
          Object.values(stems).forEach(s => {
              if (s.volume) s.volume.mute = false;
          });
      } else {
          // Mute everything except the soloed stems
          Object.entries(stems).forEach(([key, s]) => {
              if (s.volume) {
                  s.volume.mute = !activeSolos.includes(key);
              }
          });
      }
      document.querySelectorAll('.mute-btn').forEach(btn => {
          const sKey = btn.dataset.stem;
          if (stems[sKey] && stems[sKey].volume) {
              btn.classList.toggle('active', stems[sKey].volume.mute);
          }
      });
      console.log(`Solo toggled for ${stemKey}. Active: ${!isCurrentlySoloed}`);
      return;
  }

  const muteBtn = e.target.closest('.mute-btn');
  if (muteBtn) {
      const stemKey = muteBtn.dataset.stem;
      const stemToMute = stems[stemKey];
      if (stemToMute && stemToMute.volume) {
          stemToMute.volume.mute = !stemToMute.volume.mute;
          muteBtn.classList.toggle('active', stemToMute.volume.mute);
          console.log(`Mute toggled for ${stemKey}. Active: ${stemToMute.volume.mute}`);

          if (!stemToMute.volume.mute) { // If unmuting
              // Check if any other solo button is active, if so, this unmute shouldn't deactivate solo
              const otherSoloActive = Array.from(document.querySelectorAll('.solo-btn.active')).some(sb => sb.dataset.stem !== stemKey);
              if (!otherSoloActive) {
                  document.querySelectorAll('.solo-btn.active').forEach(sBtn => sBtn.classList.remove('active'));
              }
          }
      }
      return;
  }
});

document.addEventListener('input', (e) => {
  if (!currentSong) return;
  if (e.target.classList.contains('volume-slider')) {
      const stemKey = e.target.dataset.stem;
      if (stems[stemKey] && stems[stemKey].volume) {
          stems[stemKey].volume.volume.value = parseFloat(e.target.value);
          console.log(`Volume for ${stemKey} set to ${e.target.value}`);
      }
  }
});

// Call the initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);




const audio = new Audio('audio/stray-dog.mp3');
