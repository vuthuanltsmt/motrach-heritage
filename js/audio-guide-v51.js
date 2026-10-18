/* MỘ TRẠCH HERITAGE V5.1 — keeps original Vietnamese MP3, optional English browser TTS.
   No autoplay, analytics, database calls, or QR URL changes.
   English scripts reuse the existing English descriptions in station-pages-i18n.js. */
(() => {
  "use strict";

  const GUIDES = {
    "lang-than": {
      title: "Vu Hon Ancestral Tomb",
      paragraphs: [
        "The Ancestral Tomb is the burial place of Ancestor Vu Hon, regarded as the founder of Mo Trach village.",
        "The Ancestral Tomb is one of Mo Trach's sacred heritage sites. Each year, descendants of the Vu family and visitors come to offer incense in remembrance of Ancestor Vu Hon."
      ]
    },
    "van-mieu-mo-trach": {
      title: "Mo Trach Temple of Literature",
      paragraphs: [
        "The Mo Trach Temple of Literature is a cultural space associated with the village's tradition of scholarship, learning and distinctive cultural values.",
        "Mo Trach has long been known as a village of scholarship, with a strong tradition of learning and generations of successful scholars."
      ]
    },
    "dinh-lang-mo-trach": {
      title: "Mo Trach Communal House",
      paragraphs: [
        "Mo Trach Communal House is a notable historical architectural work associated with local cultural life and community activities.",
        "Mo Trach Communal House is a notable example of traditional village architecture. It has undergone several restorations while retaining many traditional architectural values."
      ]
    },
    "chua-dien-phuc": {
      title: "Dien Phuc Pagoda",
      paragraphs: [
        "Dien Phuc Pagoda is a cultural and religious heritage site of Mo Trach village, associated with the community's spiritual life and traditional heritage space.",
        "As Station Four of the Mo Trach digital heritage route, the pagoda introduces visitors to local Buddhist culture.",
        "According to local materials, the pagoda is associated with Ancestor Vu Hon and was built as a place of Buddhist worship.",
        "To the southeast of the pagoda lies the Dragon Well, a location associated with the village's traditional cultural landscape.",
        "Over time, local residents have maintained and restored Dien Phuc Pagoda, helping preserve its setting and cultural value."
      ]
    }
  };

  const TEXT = {
    vi: {
      heading: "🎧 Thuyết minh song ngữ – V5.1",
      info: "Tiếng Việt: tệp MP3 gốc. Tiếng Anh: giọng đọc tự động của trình duyệt; cần bấm nút để bắt đầu.",
      vi: "▶ Nghe tiếng Việt", en: "▶ Listen in English", pause: "⏸ Tạm dừng / Tiếp tục",
      stop: "■ Dừng", rate: "Tốc độ", transcript: "Xem nội dung thuyết minh tiếng Anh",
      ready: "Sẵn sàng. Chọn ngôn ngữ để nghe.", viPlaying: "Đang phát MP3 tiếng Việt.",
      enPlaying: "Đang đọc nội dung tiếng Anh.", paused: "Đã tạm dừng; nhấn Tạm dừng / Tiếp tục để nghe tiếp.",
      stopped: "Đã dừng thuyết minh.", viError: "Không phát được MP3. Bạn có thể thử bộ phát gốc bên trên.",
      enUnavailable: "Thiết bị/trình duyệt chưa hỗ trợ giọng đọc. Hãy xem phần nội dung tiếng Anh bên dưới.",
      enError: "Không thể đọc tiếng Anh trên thiết bị này. Hãy xem bản văn bên dưới.",
      finished: "Đã đọc xong thuyết minh tiếng Anh."
    },
    en: {
      heading: "🎧 Bilingual heritage audio guide – V5.1",
      info: "Vietnamese: original MP3. English: browser-generated voice; tap to start. Voice availability varies by device.",
      vi: "▶ Vietnamese recording", en: "▶ Listen in English", pause: "⏸ Pause / Resume",
      stop: "■ Stop", rate: "Speed", transcript: "Read English narration text",
      ready: "Ready. Choose a language to listen.", viPlaying: "Playing the original Vietnamese recording.",
      enPlaying: "Reading the English guide.", paused: "Paused. Press Pause / Resume to continue.",
      stopped: "Narration stopped.", viError: "Unable to play the MP3. Try the original audio player above.",
      enUnavailable: "Speech synthesis is not available in this browser. The English text is shown below.",
      enError: "English speech is unavailable on this device. Please read the transcript below.",
      finished: "English narration finished."
    }
  };

  const file = (location.pathname.split("/").pop() || "").toLowerCase();
  const stationIds = {
    "tram-lang-than.html": "lang-than",
    "tram-van-mieu.html": "van-mieu-mo-trach",
    "tram-dinh-lang.html": "dinh-lang-mo-trach",
    "tram-chua-dien-phuc.html": "chua-dien-phuc"
  };
  const queryId = new URLSearchParams(location.search).get("id") || "";
  const normalizedId = {
    "1": "lang-than",
    "2": "van-mieu-mo-trach",
    "3": "dinh-lang-mo-trach",
    "4": "chua-dien-phuc"
}[queryId] || queryId;
  const id = stationIds[file] || (file === "detail.html" ? normalizedId : "");
  const guide = GUIDES[id];
  if (!guide) return;

  const speechAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let panel = null;
  let originalAudio = null;
  let mode = null;
  let currentUtterance = null;
  let started = false;

  function language() { return document.documentElement.lang === "en" ? "en" : "vi"; }
  function tr(key) { return TEXT[language()][key]; }
  function status(key) {
    if (panel && panel.isConnected) panel.querySelector('[data-role="status"]').textContent = tr(key);
  }
  function stopSpeech() {
    currentUtterance = null;
    if (speechAvailable) window.speechSynthesis.cancel();
  }
  function stopAll({ resetPosition = true } = {}) {
    stopSpeech();
    if (originalAudio) {
      originalAudio.pause();
      if (resetPosition) {
        try { originalAudio.currentTime = 0; } catch (_) { /* metadata not loaded */ }
      }
    }
    mode = null;
    started = false;
  }
  function speakEnglish() {
    if (!speechAvailable) { status("enUnavailable"); panel.querySelector("details").open = true; return; }
    if (mode === "en" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume(); status("enPlaying"); return;
    }
    stopAll();
    const utterance = new SpeechSynthesisUtterance(guide.title + ". " + guide.paragraphs.join(" "));
    utterance.lang = "en-US";
    utterance.rate = Number(panel.querySelector("select").value) || 1;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => /^en[-_]/i.test(v.lang) && v.localService) ||
                         voices.find(v => /^en[-_]/i.test(v.lang));
    if (englishVoice) utterance.voice = englishVoice;
    currentUtterance = utterance;
    mode = "en";
    started = true;
    utterance.onend = () => {
      if (currentUtterance !== utterance) return;
      currentUtterance = null; mode = null; started = false; status("finished");
    };
    utterance.onerror = (event) => {
      if (currentUtterance !== utterance) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      currentUtterance = null; mode = null; started = false;
      status("enError"); panel.querySelector("details").open = true;
    };
    try { window.speechSynthesis.speak(utterance); status("enPlaying"); }
    catch (_) { stopSpeech(); mode = null; status("enError"); panel.querySelector("details").open = true; }
  }
  async function playVietnamese() {
    if (!originalAudio) return;
    if (mode !== "vi") stopSpeech();
    mode = "vi";
    try {
      originalAudio.playbackRate = Number(panel.querySelector("select").value) || 1;
      await originalAudio.play();
      started = true;
      status("viPlaying");
    } catch (_) { mode = null; status("viError"); }
  }
  function pauseResume() {
    if (mode === "vi" && originalAudio) {
      if (originalAudio.paused) {
        playVietnamese();
      } else { originalAudio.pause(); status("paused"); }
    } else if (mode === "en" && speechAvailable) {
      if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); status("enPlaying"); }
      else if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); status("paused"); }
    }
  }
  function makeElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function localize() {
    if (!panel || !panel.isConnected) return;
    panel.setAttribute("aria-label", tr("heading"));
    const fields = ["heading", "info", "vi", "en", "pause", "stop", "rate", "transcript"];
    for (const field of fields) {
      const el = panel.querySelector(`[data-role="${field}"]`);
      if (el) el.textContent = tr(field);
    }
  }
  function mount() {
    const target = file === "detail.html" ? document.querySelector("#audio .audio-player-card audio") : document.querySelector(".audio-box audio");
    if (!target) return;
    if (panel && panel.isConnected && originalAudio === target) return;
    if (panel) stopAll();
    originalAudio = target;
    panel = makeElement("section", "motrach-v51");
    panel.setAttribute("role", "region");
    panel.innerHTML = `
      <h3 class="motrach-v51__heading" data-role="heading"></h3>
      <p class="motrach-v51__info" data-role="info"></p>
      <div class="motrach-v51__controls">
        <button type="button" data-action="vi" data-role="vi"></button>
        <button type="button" data-action="en" data-role="en"></button>
        <button type="button" data-action="pause" data-role="pause"></button>
        <button type="button" data-action="stop" data-role="stop"></button>
        <label class="motrach-v51__rate"><span data-role="rate"></span>
          <select aria-label="Narration speed">
            <option value="0.85">0.85×</option><option value="1" selected>1×</option>
            <option value="1.15">1.15×</option><option value="1.3">1.3×</option>
          </select>
        </label>
      </div>
      <p class="motrach-v51__status" data-role="status" role="status" aria-live="polite"></p>
      <details><summary data-role="transcript"></summary><p class="motrach-v51__transcript"></p></details>`;
    panel.querySelector(".motrach-v51__transcript").textContent = guide.title + ".\n\n" + guide.paragraphs.join("\n\n");
    target.insertAdjacentElement("afterend", panel);
    localize();
    status("ready");
    panel.querySelector('[data-action="en"]').addEventListener("click", speakEnglish);
    panel.querySelector('[data-action="vi"]').addEventListener("click", playVietnamese);
    panel.querySelector('[data-action="pause"]').addEventListener("click", pauseResume);
    panel.querySelector('[data-action="stop"]').addEventListener("click", () => { stopAll(); status("stopped"); });
    panel.querySelector("select").addEventListener("change", event => {
      if (originalAudio) originalAudio.playbackRate = Number(event.target.value);
      if (mode === "en" && speechAvailable && (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
        speakEnglish(); // starts the narration again at the chosen speed
      }
    });
    // Retain native audio controls; using them stops English TTS and avoids overlapping sound.
    target.addEventListener("play", () => {
      if (mode === "en") stopSpeech();
      mode = "vi"; status("viPlaying");
    });
    target.addEventListener("ended", () => { if (mode === "vi") { mode = null; status("ready"); } });
  }
  function init() {
    mount();
    const rootObserver = new MutationObserver(() => localize());
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    if (file === "detail.html") {
      const container = document.getElementById("detail-content");
      if (container) {
        const detailObserver = new MutationObserver(() => mount());
        detailObserver.observe(container, { childList: true });
      }
    }
    window.addEventListener("pagehide", () => stopAll());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && mode === "en" && speechAvailable && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause(); status("paused");
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
