// Birthday song via YouTube embed (https://youtu.be/zrFoPT5jkOg)
// Keeps the same BirthdayMusic API used by index.html.

(function () {
  const VIDEO_ID = "zrFoPT5jkOg";
  let player = null;
  let isReady = false;
  let isMuted = false;
  let wantPlaying = false;
  let apiLoading = false;

  try {
    const saved = localStorage.getItem("birthday_music_muted");
    if (saved !== null) isMuted = saved === "true";
  } catch (e) {}

  function updateMuteUI() {
    document.querySelectorAll(".music-toggle-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", isMuted ? "true" : "false");
      btn.innerHTML = isMuted
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg><span>Music: OFF</span>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>Music: ON</span>';
      btn.classList.toggle("is-muted", isMuted);
    });
  }

  function applyMuteState() {
    if (!player || !isReady) return;
    try {
      if (isMuted) player.mute();
      else player.unMute();
      player.setVolume(isMuted ? 0 : 80);
    } catch (e) {}
  }

  function playIfNeeded() {
    if (!player || !isReady || !wantPlaying || isMuted) return;
    try {
      applyMuteState();
      const state = player.getPlayerState();
      // 1 = playing, 3 = buffering
      if (state !== 1 && state !== 3) player.playVideo();
    } catch (e) {}
  }

  function ensureHost() {
    let host = document.getElementById("birthdayYtHost");
    if (host) return host;
    host = document.createElement("div");
    host.id = "birthdayYtHost";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none;overflow:hidden;";
    const mount = document.createElement("div");
    mount.id = "birthdayYtPlayer";
    host.appendChild(mount);
    document.body.appendChild(host);
    return host;
  }

  function createPlayer() {
    if (player || !window.YT || !window.YT.Player) return;
    ensureHost();
    player = new window.YT.Player("birthdayYtPlayer", {
      videoId: VIDEO_ID,
      width: 1,
      height: 1,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        loop: 1,
        playlist: VIDEO_ID
      },
      events: {
        onReady: function () {
          isReady = true;
          applyMuteState();
          if (wantPlaying && !isMuted) playIfNeeded();
        },
        onStateChange: function (event) {
          // 0 = ended — restart for looping reliability
          if (event.data === 0 && wantPlaying && !isMuted) {
            try {
              player.seekTo(0, true);
              player.playVideo();
            } catch (e) {}
          }
        },
        onError: function () {
          // Keep UI usable even if embed is blocked
        }
      }
    });
  }

  function loadApi() {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }
    if (apiLoading) return;
    apiLoading = true;
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previous === "function") previous();
      createPlayer();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  }

  function start() {
    wantPlaying = true;
    loadApi();
    if (isMuted) return;
    playIfNeeded();
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem("birthday_music_muted", String(isMuted));
    } catch (e) {}

    updateMuteUI();
    loadApi();

    if (isMuted) {
      if (player && isReady) {
        try {
          player.mute();
          player.pauseVideo();
        } catch (e) {}
      }
      return;
    }

    wantPlaying = true;
    applyMuteState();
    playIfNeeded();
  }

  const unlockEvents = ["pointerdown", "click", "touchstart", "keydown"];
  function onFirstInteraction() {
    start();
    unlockEvents.forEach(function (evt) {
      window.removeEventListener(evt, onFirstInteraction);
    });
  }
  unlockEvents.forEach(function (evt) {
    window.addEventListener(evt, onFirstInteraction, { passive: true });
  });

  window.addEventListener("DOMContentLoaded", function () {
    updateMuteUI();
    document.querySelectorAll(".music-toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMute();
      });
    });
    loadApi();
    start();
  });

  window.BirthdayMusic = {
    start: start,
    toggleMute: toggleMute,
    isMuted: function () { return isMuted; },
    getAudioContext: function () { return null; }
  };
})();
