/**
 * Mo Trach Heritage – Cinematic hero, v1.0
 * Chi ap dung cho section.hero tren trang chu.
 * Khong thay doi header, menu, i18n, Supabase hoac bo dem truy cap.
 */
(() => {
  "use strict";

  function initializeCinematicBanner() {
    const hero = document.querySelector("section.hero");
    if (!hero || hero.dataset.cinemaReady === "true") return;

    // Duong dan tinh tu trang chu index.html, dung duoc tren GitHub Pages.
    // Uu tien su dung anh da co trong thu muc images/ cua du an.
    const slides = [
      { image: "images/gallery/lang-than%202.jpg", label: "Lăng Thần – Mộ cụ Vũ Hồn" },
      { image: "images/van-mieu.jpg", label: "Văn Miếu Mộ Trạch" },
      { image: "images/dinh-lang.jpg", label: "Đình làng Mộ Trạch" },
      { image: "images/chua-dien-phuc.jpg", label: "Chùa Diên Phúc" }
    ];

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const slideDuration = 6500; // ms
    const stage = document.createElement("div");
    stage.className = "cinema-stage";
    stage.setAttribute("aria-hidden", "true");

    const frames = slides.map((slide, index) => {
      const frame = document.createElement("div");
      frame.className = "cinema-frame" + (index === 0 ? " is-active" : "");
      frame.style.backgroundImage = `url("${new URL(slide.image, document.baseURI).href}")`;
      stage.appendChild(frame);
      return frame;
    });

    // Chen phia sau noi dung hero cu, giu nguyen tat ca nut va chu da dich.
    hero.insertBefore(stage, hero.firstChild);
    hero.classList.add("cinema-hero");
    hero.dataset.cinemaReady = "true";

    const controls = document.createElement("div");
    controls.className = "cinema-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Điều khiển ảnh banner / Banner controls");

    function createButton(className, label, contents) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.textContent = contents;
      return button;
    }

    const previousButton = createButton("cinema-arrow", "Ảnh trước / Previous slide", "‹");
    const nextButton = createButton("cinema-arrow", "Ảnh tiếp / Next slide", "›");
    const pauseButton = createButton("cinema-play-toggle", "Tạm dừng / Pause slideshow", "Ⅱ");
    const dots = document.createElement("div");
    dots.className = "cinema-dots";

    const dotButtons = slides.map((slide, index) => {
      const dot = createButton("cinema-dot", `Ảnh ${index + 1}: ${slide.label}`, "");
      dot.setAttribute("aria-pressed", String(index === 0));
      if (index === 0) dot.classList.add("is-current");
      dots.appendChild(dot);
      return dot;
    });

    controls.append(previousButton, dots, nextButton, pauseButton);
    hero.appendChild(controls);

    let currentSlide = 0;
    let paused = motionPreference.matches;
    let intervalId = null;

    function render(index) {
      currentSlide = (index + slides.length) % slides.length;
      frames.forEach((frame, i) => {
        frame.classList.toggle("is-active", i === currentSlide);
      });
      dotButtons.forEach((dot, i) => {
        const selected = i === currentSlide;
        dot.classList.toggle("is-current", selected);
        dot.setAttribute("aria-pressed", String(selected));
      });
    }

    function stopAutoplay() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (!paused && !document.hidden) {
        intervalId = window.setInterval(() => render(currentSlide + 1), slideDuration);
      }
    }

    function updatePauseButton() {
      pauseButton.textContent = paused ? "▶" : "Ⅱ";
      const text = paused ? "Tiếp tục / Resume slideshow" : "Tạm dừng / Pause slideshow";
      pauseButton.title = text;
      pauseButton.setAttribute("aria-label", text);
      pauseButton.setAttribute("aria-pressed", String(paused));
    }

    previousButton.addEventListener("click", () => {
      render(currentSlide - 1);
      startAutoplay();
    });
    nextButton.addEventListener("click", () => {
      render(currentSlide + 1);
      startAutoplay();
    });
    dotButtons.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        render(index);
        startAutoplay();
      });
    });
    pauseButton.addEventListener("click", () => {
      paused = !paused;
      updatePauseButton();
      startAutoplay();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });
    motionPreference.addEventListener?.("change", (event) => {
      paused = event.matches;
      updatePauseButton();
      startAutoplay();
    });
    updatePauseButton();
    startAutoplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCinematicBanner, { once: true });
  } else {
    initializeCinematicBanner();
  }
})();
