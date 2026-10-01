/* =========================================================
   DI SẢN MỘ TRẠCH
   DETAIL.JS - VI / EN
   ========================================================= */

"use strict";

let heritageData = [];
let currentHeritage = null;

const LOCALIZED_PREFIX = {
    "lang-than": "detail_lang_than",
    "van-mieu-mo-trach": "detail_van_mieu",
    "dinh-lang-mo-trach": "detail_dinh_lang",
    "chua-dien-phuc": "detail_chua"
};

document.addEventListener("DOMContentLoaded", function () {
    loadHeritageDetail();
});

document.addEventListener("motrach:languagechange", function () {
    if (currentHeritage) {
        const container = document.getElementById("detail-content");
        if (container) {
            renderHeritage(currentHeritage, container);
        }
    }
});


function tr(key) {
    if (window.MoTrachI18n && typeof window.MoTrachI18n.t === "function") {
        return window.MoTrachI18n.t(key);
    }
    return key;
}


function getCurrentLanguage() {
    if (window.MoTrachI18n && typeof window.MoTrachI18n.getLanguage === "function") {
        return window.MoTrachI18n.getLanguage();
    }

    return localStorage.getItem("motrach-language") === "en" ? "en" : "vi";
}


function getUrlId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}


function createSlug(text) {
    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function normalizeData(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.heritage)) return data.heritage;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.sites)) return data.sites;
    return [];
}


function getHeritageSlug(item) {
    if (item.slug) {
        return createSlug(item.slug);
    }

    const generated = createSlug(item.name || item.title || "");

    if (generated === "lang-than" || generated === "lang-than-vu-hon") {
        return "lang-than";
    }

    if (generated === "van-mieu-mo-trach") {
        return "van-mieu-mo-trach";
    }

    if (generated === "dinh-lang-mo-trach") {
        return "dinh-lang-mo-trach";
    }

    if (generated === "chua-dien-phuc") {
        return "chua-dien-phuc";
    }

    return generated;
}


function findHeritage(requestedId) {
    const wanted = String(requestedId || "").trim().toLowerCase();

    let item = heritageData.find(function (heritage) {
        return getHeritageSlug(heritage) === wanted;
    });

    if (item) return item;

    item = heritageData.find(function (heritage) {
        return String(heritage.id).toLowerCase() === wanted;
    });

    if (item) return item;

    item = heritageData.find(function (heritage) {
        return createSlug(heritage.name) === wanted;
    });

    if (item) return item;

    if (/^\d+$/.test(wanted)) {
        const index = Number(wanted) - 1;

        if (index >= 0 && index < heritageData.length) {
            return heritageData[index];
        }
    }

    return null;
}


function localizedItem(item) {
    const slug = getHeritageSlug(item);
    const prefix = LOCALIZED_PREFIX[slug];

    if (!prefix) {
        return {
            name: item.name || "Di tích Mộ Trạch",
            subtitle: item.subtitle || "",
            type: item.type || "Di tích",
            location: item.location || item.address || "",
            description: item.description || "",
            history: item.history || ""
        };
    }

    return {
        name: tr(prefix + "_name"),
        subtitle: tr(prefix + "_subtitle"),
        type: tr(prefix + "_type"),
        location: tr(prefix + "_location"),
        description: tr(prefix + "_description"),
        history: tr(prefix + "_history")
    };
}


async function loadHeritageDetail() {
    const container = document.getElementById("detail-content");

    if (!container) {
        console.error("Không tìm thấy #detail-content");
        return;
    }

    const requestedId = getUrlId();

    if (!requestedId) {
        showError(
            tr("detail_error_no_id_title"),
            tr("detail_error_no_id_message")
        );
        return;
    }

    container.innerHTML = `
        <div class="qr-loading">
            <div class="qr-loading-icon">⏳</div>
            <h2>${escapeHtml(tr("detail_loading"))}</h2>
            <p>${escapeHtml(tr("detail_wait"))}</p>
        </div>
    `;

    try {
        const response = await fetch(
            "../data/heritage.json?v=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        heritageData = normalizeData(data);
        currentHeritage = findHeritage(requestedId);

        if (!currentHeritage) {
            showError(
                tr("detail_error_not_found_title"),
                tr("detail_error_not_found_prefix") + " " + requestedId
            );
            return;
        }

        renderHeritage(currentHeritage, container);
    }
    catch (error) {
        console.error("LỖI DETAIL.JS:", error);

        showError(
            tr("detail_error_load_title"),
            error.message
        );
    }
}


function renderHeritage(item, container) {
    const localized = localizedItem(item);

    const name = localized.name || item.name || "Di tích Mộ Trạch";
    const subtitle = localized.subtitle || "";
    const type = localized.type || "";
    const description = localized.description || "";
    const history = localized.history || "";

    const address =
        localized.location ||
        item.location ||
        item.address ||
        "Thôn Mộ Trạch, xã Đường An, thành phố Hải Phòng";

    const year = item.year || "";
    const rank = item.rank || "";

    const image = getAssetPath(item.image || item.cover);
    const audio = getAssetPath(item.audio);
    const video = getAssetPath(item.video);

    const gallery = Array.isArray(item.gallery)
        ? item.gallery
        : [];

    const mapUrl =
        item.map ||
        createGoogleMapUrl(item);

    const stationUrl = {
        "lang-than": "tram-lang-than.html",
        "van-mieu-mo-trach": "tram-van-mieu.html",
        "dinh-lang-mo-trach": "tram-dinh-lang.html"
    }[getHeritageSlug(item)] || "";

    document.title =
        name +
        (getCurrentLanguage() === "en"
            ? " - Mo Trach Heritage"
            : " - Di sản Mộ Trạch");

    container.innerHTML = `
        <article class="qr-card">

            ${
                image
                ? `
                <div class="hero-image-wrap">
                    <img
                        src="${safe(image)}"
                        alt="${safe(name)}"
                        class="qr-main-image"
                    >
                    <div class="hero-image-caption">
                        ${escapeHtml(name)}
                    </div>
                </div>
                `
                : `
                <div class="hero-no-image">
                    🏛️
                </div>
                `
            }

            <div class="qr-content">

                <div class="qr-badge">
                    ${escapeHtml(tr("detail_badge"))}
                </div>

                <h1 class="qr-title">
                    ${escapeHtml(name)}
                </h1>

                ${
                    subtitle
                    ? `
                    <div class="qr-subtitle">
                        ${escapeHtml(subtitle)}
                    </div>
                    `
                    : ""
                }

                <div class="qr-info">

                    <p>
                        🏛️
                        <strong>${escapeHtml(tr("detail_type_label"))}</strong>
                        ${escapeHtml(type)}
                    </p>

                    <p>
                        📍
                        <strong>${escapeHtml(tr("detail_location_label"))}</strong>
                        ${escapeHtml(address)}
                    </p>

                    ${
                        year
                        ? `
                        <p>
                            📅
                            <strong>${escapeHtml(tr("detail_year_label"))}</strong>
                            ${escapeHtml(year)}
                        </p>
                        `
                        : ""
                    }

                    ${
                        rank
                        ? `
                        <p>
                            🏅
                            <strong>${escapeHtml(tr("detail_rank_label"))}</strong>
                            ${escapeHtml(rank)}
                        </p>
                        `
                        : ""
                    }

                </div>

                <div class="qr-actions">

                    ${
                        audio
                        ? `
                        <button
                            id="audioJumpButton"
                            type="button"
                            class="qr-action qr-action-audio"
                        >
                            ${escapeHtml(tr("detail_audio_button"))}
                        </button>
                        `
                        : ""
                    }

                    ${
                        video
                        ? `
                        <button
                            id="videoJumpButton"
                            type="button"
                            class="qr-action qr-action-video"
                        >
                            ${escapeHtml(tr("detail_video_button"))}
                        </button>
                        `
                        : ""
                    }

                    ${
                        mapUrl
                        ? `
                        <a
                            href="${safe(mapUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="qr-action qr-action-map"
                        >
                            ${escapeHtml(tr("detail_directions_button"))}
                        </a>
                        `
                        : ""
                    }

                    ${
                        stationUrl
                        ? `
                        <a
                            href="${safe(stationUrl)}"
                            class="qr-action qr-action-station"
                        >
                            ${escapeHtml(tr("detail_station_button"))}
                        </a>
                        `
                        : ""
                    }

                </div>

                ${
                    description
                    ? `
                    <section class="qr-section">
                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_intro_title"))}
                        </h2>
                        <div class="qr-text">
                            ${formatText(description)}
                        </div>
                    </section>
                    `
                    : ""
                }

                ${
                    history
                    ? `
                    <section class="qr-section">
                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_history_title"))}
                        </h2>
                        <div class="qr-text">
                            ${formatText(history)}
                        </div>
                    </section>
                    `
                    : ""
                }

                ${
                    audio
                    ? `
                    <section class="qr-section" id="audio">

                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_audio_title"))}
                        </h2>

                        <div class="audio-player-card">

                            <div class="audio-player-header">

                                <div class="audio-icon">🎧</div>

                                <div>
                                    <div class="audio-player-title">
                                        ${escapeHtml(tr("detail_audio_player_title"))}
                                    </div>

                                    <div class="audio-player-name">
                                        ${escapeHtml(name)}
                                    </div>
                                </div>

                            </div>

                            <audio
                                id="audioPlayer"
                                preload="metadata"
                                controls
                            >
                                <source
                                    src="${safe(audio)}"
                                    type="audio/mpeg"
                                >
                            </audio>

                            <div
                                id="audioStatus"
                                class="audio-status"
                            >
                                ${escapeHtml(tr("detail_audio_preparing"))}
                            </div>

                            <div
                                id="audioError"
                                class="audio-error"
                            ></div>

                        </div>
                    </section>
                    `
                    : ""
                }

                ${
                    video
                    ? `
                    <section class="qr-section" id="video">

                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_video_title"))}
                        </h2>

                        <div class="qr-media qr-video">
                            <video
                                controls
                                preload="metadata"
                                playsinline
                            >
                                <source
                                    src="${safe(video)}"
                                    type="video/mp4"
                                >
                            </video>
                        </div>

                    </section>
                    `
                    : ""
                }

                ${
                    gallery.length
                    ? `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_gallery_title"))}
                        </h2>

                        <div class="heritage-gallery">
                            ${
                                gallery.map(function (photo) {

                                    const src =
                                        getAssetPath(
                                            typeof photo === "string"
                                                ? photo
                                                : photo.image
                                        );

                                    const caption =
                                        typeof photo === "string"
                                            ? ""
                                            : (photo.caption || "");

                                    return `
                                        <figure>
                                            <img
                                                src="${safe(src)}"
                                                alt="${safe(caption || name)}"
                                                loading="lazy"
                                                class="gallery-image"
                                            >

                                            ${
                                                caption
                                                ? `
                                                <figcaption>
                                                    ${escapeHtml(caption)}
                                                </figcaption>
                                                `
                                                : ""
                                            }
                                        </figure>
                                    `;

                                }).join("")
                            }
                        </div>

                    </section>
                    `
                    : ""
                }

                ${
                    mapUrl
                    ? `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            ${escapeHtml(tr("detail_location_title"))}
                        </h2>

                        <div class="qr-map-box">

                            <p>
                                ${escapeHtml(address)}
                            </p>

                            <a
                                href="${safe(mapUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="qr-map-button"
                            >
                                ${escapeHtml(tr("detail_open_maps"))}
                            </a>

                        </div>
                    </section>
                    `
                    : ""
                }

                <div class="qr-navigation">

                    <a
                        href="../index.html"
                        class="qr-nav-button"
                    >
                        ${escapeHtml(tr("detail_home"))}
                    </a>

                    <a
                        href="map.html"
                        class="qr-nav-button"
                    >
                        ${escapeHtml(tr("detail_map"))}
                    </a>

                </div>

            </div>

        </article>
    `;

    addUpgradeStyles();
    setupAudio();
    setupJumpButtons();
}


function setupAudio() {
    const audio = document.getElementById("audioPlayer");

    if (!audio) return;

    const status = document.getElementById("audioStatus");
    const error = document.getElementById("audioError");

    audio.addEventListener("loadedmetadata", function () {
        status.textContent = tr("detail_audio_ready");
    });

    audio.addEventListener("play", function () {
        status.textContent = tr("detail_audio_playing");
    });

    audio.addEventListener("pause", function () {
        if (!audio.ended) {
            status.textContent = tr("detail_audio_paused");
        }
    });

    audio.addEventListener("ended", function () {
        status.textContent = tr("detail_audio_finished");
    });

    audio.addEventListener("error", function () {
        status.textContent = tr("detail_audio_failed");
        error.textContent =
            tr("detail_audio_file_error") +
            " " +
            audio.currentSrc;
    });
}


function setupJumpButtons() {
    const audioButton = document.getElementById("audioJumpButton");
    const videoButton = document.getElementById("videoJumpButton");

    if (audioButton) {
        audioButton.addEventListener("click", function () {
            document
                .getElementById("audio")
                ?.scrollIntoView({ behavior: "smooth" });
        });
    }

    if (videoButton) {
        videoButton.addEventListener("click", function () {
            document
                .getElementById("video")
                ?.scrollIntoView({ behavior: "smooth" });
        });
    }
}


function getAssetPath(path) {
    if (!path) return "";

    let value = String(path).trim();

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    ) {
        return value;
    }

    if (value.startsWith("../")) return value;
    if (value.startsWith("/")) return value;

    return "../" + value.replace(/^\/+/, "");
}


function createGoogleMapUrl(item) {
    if (
        item.lat !== undefined &&
        item.lng !== undefined
    ) {
        return (
            "https://www.google.com/maps/dir/?api=1" +
            "&destination=" +
            encodeURIComponent(item.lat + "," + item.lng)
        );
    }

    if (item.name) {
        return (
            "https://www.google.com/maps/search/?api=1" +
            "&query=" +
            encodeURIComponent(item.name + " Mộ Trạch Hải Phòng")
        );
    }

    return "";
}


function formatText(text) {
    return escapeHtml(text)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>");
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function safe(value) {
    return escapeHtml(value);
}


function showError(title, message) {
    const container = document.getElementById("detail-content");

    if (!container) return;

    container.innerHTML = `
        <div class="qr-error">

            <div style="
                font-size:60px;
                margin-bottom:15px;
            ">
                ⚠️
            </div>

            <h2>${escapeHtml(title)}</h2>

            <p>${escapeHtml(message)}</p>

            <div style="
                display:flex;
                gap:12px;
                justify-content:center;
                flex-wrap:wrap;
                margin-top:25px;
            ">

                <a
                    href="../index.html"
                    class="qr-nav-button"
                >
                    ${escapeHtml(tr("detail_back_home"))}
                </a>

                <a
                    href="map.html"
                    class="qr-nav-button"
                >
                    ${escapeHtml(tr("detail_view_map"))}
                </a>

            </div>

        </div>
    `;
}


function addUpgradeStyles() {
    if (document.getElementById("detail-upgrade-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "detail-upgrade-style";

    style.textContent = `
        .audio-player-card {
            background:#fff8ed;
            border:1px solid #ead8b8;
            border-radius:20px;
            padding:20px;
            margin-top:15px;
        }

        .audio-player-card audio {
            width:100%;
            margin-top:10px;
        }

        .audio-player-header {
            display:flex;
            align-items:center;
            gap:15px;
            margin-bottom:10px;
        }

        .audio-icon {
            width:50px;
            height:50px;
            border-radius:50%;
            background:#8b0000;
            color:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:25px;
        }

        .audio-player-title {
            font-size:20px;
            font-weight:800;
            color:#8b0000;
        }

        .audio-player-name {
            color:#666;
            margin-top:3px;
        }

        .audio-status {
            margin-top:10px;
            color:#666;
            font-size:14px;
        }

        .audio-error {
            color:#a00000;
            margin-top:8px;
            font-size:13px;
        }

        .hero-image-wrap {
            position:relative;
            overflow:hidden;
        }

        .hero-image-caption {
            position:absolute;
            left:15px;
            bottom:15px;
            background:rgba(0,0,0,.65);
            color:#fff;
            padding:7px 13px;
            border-radius:20px;
        }

        .heritage-gallery {
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:15px;
        }

        .heritage-gallery figure {
            margin:0;
            overflow:hidden;
            border-radius:12px;
            background:#fff;
            box-shadow:0 4px 15px rgba(0,0,0,.08);
        }

        .gallery-image {
            width:100%;
            height:210px;
            object-fit:cover;
            display:block;
        }

        .heritage-gallery figcaption {
            padding:9px;
            text-align:center;
            font-size:14px;
        }

        @media(max-width:700px) {
            .heritage-gallery {
                grid-template-columns:1fr;
            }

            .gallery-image {
                height:230px;
            }
        }
    `;

    document.head.appendChild(style);
}
