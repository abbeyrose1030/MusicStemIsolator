// Store all audio elements
const stems = {
    vocals: new Audio("stems/vocals.mp3"),
    drums: new Audio("stems/drums.mp3"),
    bass: new Audio("stems/bass.mp3"),
  };
  
  let isPlaying = false;
  let soloMode = false;
  let soloStem = null;
  
  // Sync all stems (important!)
  Object.values(stems).forEach(audio => {
    audio.loop = true;
    audio.volume = 1;
  });
  
  // Play/pause button
  document.getElementById("play").addEventListener("click", () => {
    if (isPlaying) {
      Object.values(stems).forEach(audio => audio.pause());
      isPlaying = false;
    } else {
      Object.values(stems).forEach(audio => {
        audio.currentTime = 0;
        audio.play();
      });
      isPlaying = true;
    }
  });
  
  // Mute/solo buttons
  document.querySelectorAll(".stem-control").forEach(control => {
    const stem = control.dataset.stem;
    const muteBtn = control.querySelector(".mute");
    const soloBtn = control.querySelector(".solo");
  
    muteBtn.addEventListener("click", () => {
      stems[stem].muted = !stems[stem].muted;
      muteBtn.textContent = stems[stem].muted ? "Unmute" : "Mute";
    });
  
    soloBtn.addEventListener("click", () => {
      soloMode = soloStem !== stem;
      soloStem = soloMode ? stem : null;
  
      Object.keys(stems).forEach(key => {
        stems[key].muted = soloMode ? key !== stem : false;
      });
  
      // Update all button states
      document.querySelectorAll(".solo").forEach(btn => {
        btn.textContent = "Solo";
      });
      if (soloMode) soloBtn.textContent = "Unsolo";
    });
  });

  // Volume sliders




  const stems = {
  vocals: new Audio("stems/vocals.mp3"),
  drums: new Audio("stems/drums.mp3"),
  bass: new Audio("stems/bass.mp3"),
};
const stems = {
    vocals: new Audio("stems/vocals.mp3"),
    drums: new Audio("stems/drums.mp3"),
    bass: new Audio("stems/bass.mp3"),
  };

  
