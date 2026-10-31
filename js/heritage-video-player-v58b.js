
/*
 * MO TRACH HERITAGE V5.8B-21I
 * VIDEO PLAYER WITH V5.8A FALLBACK
 */

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  VIDEO_BUCKET
} from "./heritage-videos-config-v58b.js";

// Read-only public client; does not use Admin sessions.
const client = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const stations = {
  "tram-lang-than.html": "lang-than",
  "tram-van-mieu.html": "van-mieu-mo-trach",
  "tram-dinh-lang.html": "dinh-lang-mo-trach",
  "tram-chua-dien-phuc.html": "chua-dien-phuc"
};

const TIMEOUT_MS = 10000;

function withTimeout(promise, ms) {
  let timeoutId;

  const deadline = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Timeout")),
      ms
    );
  });

  return Promise.race([promise, deadline])
    .finally(() => clearTimeout(timeoutId));
}

function getHeritageVideo() {
  // Select the video whose original source is an MP4.
  return [...document.querySelectorAll("video")].find(
    video => [...video.querySelectorAll("source")].some(
      source => /\.mp4(?:[?#]|$)/i.test(
        source.getAttribute("src") || ""
      )
    )
  );
}

function verifyVideo(url) {
  return new Promise((resolve, reject) => {
    const probe = document.createElement("video");
    let settled = false;
    let timer;

    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      probe.removeAttribute("src");
      probe.load();

      if (error) reject(error);
      else resolve();
    }

    probe.preload = "metadata";

    probe.addEventListener(
      "loadedmetadata",
      () => finish(null),
      { once: true }
    );

    probe.addEventListener(
      "error",
      () => finish(new Error("Video unavailable")),
      { once: true }
    );

    timer = setTimeout(
      () => finish(new Error("Video load timeout")),
      TIMEOUT_MS
    );

    probe.src = url;
    probe.load();
  });
}

async function initializeHeritageVideo() {
  const filename = decodeURIComponent(
    window.location.pathname.split("/").pop()
  ).toLowerCase();

  const station = stations[filename];
  if (!station) return;

  const video = getHeritageVideo();
  if (!video) {
    console.warn("[V5.8B] Heritage video not found");
    return;
  }

  // Keep all original V5.8A <source> elements.
  const originalSrc = video.getAttribute("src");
  let fallbackActive = false;

  // V5.8B-23Z8H: Visible failure state.
  const notice = document.createElement("div");
  notice.hidden = true;
  notice.setAttribute("role", "alert");
  notice.style.cssText =
    "padding:16px;margin-top:12px;background:#fff4e5;" +
    "border:1px solid #b8862b;border-radius:10px;" +
    "color:#493100;line-height:1.6";

  const message = document.createElement("p");
  message.textContent =
    "Video hiện chưa thể phát. Vui lòng thử tải lại sau.";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Thử tải lại video";
  retry.style.cssText =
    "padding:10px 16px;cursor:pointer;" +
    "border:1px solid #8b0000;border-radius:8px;" +
    "background:white;color:#8b0000";

  retry.addEventListener("click", () => {
    window.location.reload();
  });

  notice.append(message, retry);
  video.insertAdjacentElement("afterend", notice);

  function showFailure() {
    notice.hidden = false;
  }

  video.addEventListener("loadedmetadata", () => {
    notice.hidden = true;
  });

  video.addEventListener("error", () => {
    if (fallbackActive) {
      showFailure();
    } else {
      fallback("Playback error");
    }
  });

  function fallback(reason) {
    if (fallbackActive) return;
    fallbackActive = true;

    video.pause();

    if (originalSrc !== null) {
      video.setAttribute("src", originalSrc);
    } else {
      video.removeAttribute("src");
    }

    // The original child <source> elements remain intact.
    video.load();

    console.warn(
      "[V5.8B] Using V5.8A fallback:",
      station,
      reason
    );
  }

  try {
    const isLocal = (
      location.hostname === "127.0.0.1" ||
      location.hostname === "localhost"
    );

    const testMode = isLocal
      ? new URLSearchParams(location.search)
          .get("v58b_fallback_test")
      : null;

    if (testMode === "api-error") {
      throw new Error("Simulated Supabase error");
    }

    let newUrl;

    if (testMode === "bad-video") {
      newUrl = new URL(
        "../videos/nonexistent-v58b-test.mp4",
        location.href
      ).href;
    } else {
      const query = client
        .from("heritage_video_versions")
        .select("storage_path")
        .eq("station_id", station)
        .eq("status", "published")
        .maybeSingle();

      const { data, error } = await withTimeout(
        query,
        TIMEOUT_MS
      );

      if (error) throw error;

      if (!data) {
        console.info(
          "[V5.8B] No published version; V5.8A retained:",
          station
        );
        return;
      }

      newUrl = client.storage
        .from(VIDEO_BUCKET)
        .getPublicUrl(data.storage_path)
        .data.publicUrl;
    }

    if (!newUrl) {
      throw new Error("Missing video URL");
    }

    // Check before changing the visible player's source.
    await verifyVideo(newUrl);

    fallbackActive = false;


    video.src = newUrl;
    video.load();

    console.info(
      "[V5.8B] Supabase video selected:",
      station
    );

  } catch (error) {
    // Original V5.8A source was never removed.
    fallback(error.message);
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeHeritageVideo,
    { once: true }
  );
} else {
  initializeHeritageVideo();
}
