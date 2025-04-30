const stems = [
  { name: "Drums", file: "stems/drums.mp3" },
  { name: "Music", file: "stems/music.mp3" },
  { name: "Vocals", file: "stems/vocals.mp3" }
  { name: "Bass", file: "stems/bass.mp3" }
];

const audioElements = {};
const soloStates = {};
let isPlaying = false;

// Create audio elements and UI
const container = document.getElementById("controls");

stems.forEach(stem => {
  // Create audio element
  const audio = new Audio(stem.file);
  audio.loop = true;
  audio.volume = 1;

  audioElements[stem.name] = audio;
  soloStates[stem.name] = false;

  // UI Elements
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <h3>${stem.name}</h3>
    <button class="mute">Mute</button>
    <button class="solo">Solo</button>
    <input type="range" min="0" max="1" step="0.01" value="1" class="volume">
  `;
  container.appendChild(wrapper);

  // Event listeners
  wrapper.querySelector(".mute").addEventListener("click", () => {
    audio.muted = !audio.muted;
    wrapper.querySelector(".mute").textContent = audio.muted ? "Unmute" : "Mute";
  });

  wrapper.querySelector(".solo").addEventListener("click", () => {
    const solo = !soloStates[stem.name];
    soloStates[stem.name] = solo;
    wrapper.querySelector(".solo").textContent = solo ? "Unsolo" : "Solo";
    updateSoloing();
  });

  wrapper.querySelector(".volume").addEventListener("input", (e) => {
    audio.volume = parseFloat(e.target.value);
  });
});

// Play / Pause all
document.getElementById("play").addEventListener("click", () => {
  isPlaying = !isPlaying;
  for (const stem of stems) {
    const audio = audioElements[stem.name];
    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }
});

function updateSoloing() {
  const anySoloed = Object.values(soloStates).some(state => state);

  stems.forEach(stem => {
    const audio = audioElements[stem.name];
    const isSoloed = soloStates[stem.name];
    audio.muted = anySoloed ? !isSoloed : false;
  });
}


