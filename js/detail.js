/* =========================================================
   MỘ TRẠCH HERITAGE
   DETAIL.JS
   Hỗ trợ URL:
   ?id=1
   ?id=2
   ?id=3

   và URL chuẩn:
   ?id=lang-than
   ?id=van-mieu-mo-trach
   ?id=dinh-lang-mo-trach
   ========================================================= */

"use strict";

console.log("========================================");
console.log("DETAIL.JS - PHIÊN BẢN SLUG");
console.log("========================================");


document.addEventListener("DOMContentLoaded", function () {
    loadHeritageDetail();
});


/* =========================================================
   BIẾN
   ========================================================= */

let heritageData = [];

let currentHeritage = null;


/* =========================================================
   LẤY ID / SLUG TỪ URL
   ========================================================= */

function getUrlId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


/* =========================================================
   TẠO SLUG
   ========================================================= */

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


/* =========================================================
   CHUẨN HÓA DỮ LIỆU
   ========================================================= */

function normalizeData(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.heritage)
    ) {
        return data.heritage;
    }

    if (
        data &&
        Array.isArray(data.items)
    ) {
        return data.items;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        Array.isArray(data.sites)
    ) {
        return data.sites;
    }

    return [];
}


/* =========================================================
   TẠO SLUG CHUẨN CHO TỪNG DI TÍCH
   ========================================================= */

function getHeritageSlug(item) {

    /*
       Nếu JSON đã có slug thì ưu tiên.
    */

    if (item.slug) {

        return createSlug(
            item.slug
        );

    }


    /*
       Nếu chưa có slug thì tạo từ tên.
    */

    const generated =
        createSlug(
            item.name ||
            item.title ||
            ""
        );


    /*
       Đảm bảo 3 URL chính xác
       theo yêu cầu của dự án.
    */

    if (
        generated === "lang-than" ||
        generated === "lang-than-vu-hon"
    ) {

        return "lang-than";

    }


    if (
        generated === "van-mieu-mo-trach"
    ) {

        return "van-mieu-mo-trach";

    }


    if (
        generated === "dinh-lang-mo-trach"
    ) {

        return "dinh-lang-mo-trach";

    }


    return generated;
}


/* =========================================================
   TÌM DI TÍCH
   ========================================================= */

function findHeritage(
    requestedId
) {

    const wanted =
        String(
            requestedId || ""
        )
        .trim()
        .toLowerCase();


    console.log(
        "Đang tìm di tích với mã:",
        wanted
    );


    /*
       -------------------------------------------------------
       1. Tìm theo slug
       -------------------------------------------------------
    */

    let item =
        heritageData.find(
            function (heritage) {

                return (
                    getHeritageSlug(
                        heritage
                    )
                    === wanted
                );

            }
        );


    if (item) {

        console.log(
            "✓ TÌM THẤY THEO SLUG:",
            getHeritageSlug(item),
            "|",
            item.name
        );

        return item;
    }


    /*
       -------------------------------------------------------
       2. Tìm theo id số trong JSON
       -------------------------------------------------------
    */

    item =
        heritageData.find(
            function (heritage) {

                return (
                    String(
                        heritage.id
                    )
                    .toLowerCase()
                    === wanted
                );

            }
        );


    if (item) {

        console.log(
            "✓ TÌM THẤY THEO ID:",
            item.id,
            "|",
            item.name
        );

        return item;
    }


    /*
       -------------------------------------------------------
       3. Tìm theo tên
       -------------------------------------------------------
    */

    item =
        heritageData.find(
            function (heritage) {

                return (
                    createSlug(
                        heritage.name
                    )
                    === wanted
                );

            }
        );


    if (item) {

        console.log(
            "✓ TÌM THẤY THEO TÊN:",
            item.name
        );

        return item;
    }


    /*
       -------------------------------------------------------
       4. Tương thích với id=1, id=2, id=3
       -------------------------------------------------------
    */

    if (/^\d+$/.test(wanted)) {

        const index =
            Number(wanted) - 1;


        if (
            index >= 0 &&
            index < heritageData.length
        ) {

            item =
                heritageData[index];


            console.log(
                "✓ TÌM THẤY THEO VỊ TRÍ:",
                index + 1,
                "|",
                item.name
            );


            return item;
        }
    }


    return null;
}


/* =========================================================
   TẢI DỮ LIỆU
   ========================================================= */

async function loadHeritageDetail() {

    const container =
        document.getElementById(
            "detail-content"
        );


    if (!container) {

        console.error(
            "Không tìm thấy #detail-content"
        );

        return;
    }


    const requestedId =
        getUrlId();


    console.log(
        "URL hiện tại:",
        window.location.href
    );


    console.log(
        "ID nhận được:",
        requestedId
    );


    if (!requestedId) {

        showError(
            "Không xác định được di tích",
            "Đường dẫn không chứa mã di tích."
        );

        return;
    }


    /*
       Loading
    */

    container.innerHTML = `

        <div class="qr-loading">

            <div class="qr-loading-icon">
                ⏳
            </div>

            <h2>
                Đang tải thông tin di tích...
            </h2>

            <p>
                Vui lòng chờ trong giây lát.
            </p>

        </div>

    `;


    try {

        console.log(
            "Đang tải ../data/heritage.json..."
        );


        const response =
            await fetch(
                "../data/heritage.json?v=" +
                Date.now(),
                {
                    cache: "no-store"
                }
            );


        console.log(
            "HTTP:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        heritageData =
            normalizeData(data);


        console.log(
            "Dữ liệu thực tế:",
            heritageData
        );


        console.log(
            "Số lượng di tích:",
            heritageData.length
        );


        /*
           In danh sách slug
        */

        console.log(
            "===== DANH SÁCH SLUG ====="
        );


        heritageData.forEach(
            function (item, index) {

                console.log(
                    index + 1,
                    "| ID JSON:",
                    item.id,
                    "| SLUG:",
                    getHeritageSlug(item),
                    "| Tên:",
                    item.name
                );

            }
        );


        console.log(
            "=========================="
        );


        currentHeritage =
            findHeritage(
                requestedId
            );


        if (!currentHeritage) {

            console.error(
                "✗ KHÔNG TÌM THẤY:",
                requestedId
            );


            showError(
                "Không tìm thấy di tích",
                "Mã di tích \"" +
                requestedId +
                "\" không tồn tại trong heritage.json."
            );


            return;
        }


        console.log(
            "✓ DI TÍCH ĐƯỢC CHỌN:",
            currentHeritage.name
        );


        console.log(
            "✓ SLUG:",
            getHeritageSlug(
                currentHeritage
            )
        );


        renderHeritage(
            currentHeritage,
            container
        );

    }
    catch (error) {

        console.error(
            "LỖI DETAIL.JS:",
            error
        );


        showError(
            "Không thể tải thông tin di tích",
            error.message
        );

    }

}


/* =========================================================
   RENDER
   ========================================================= */

function renderHeritage(
    item,
    container
) {

    const name =
        item.name ||
        "Di tích Mộ Trạch";


    const subtitle =
        item.subtitle ||
        "";


    const type =
        item.type ||
        "Di tích";


    const description =
        item.description ||
        "";


    const history =
        item.history ||
        "";


    const address =
        item.address ||
        "Thôn Mộ Trạch, xã Đường An, thành phố Hải Phòng";


    const year =
        item.year ||
        "";


    const rank =
        item.rank ||
        "";


    const image =
        getAssetPath(
            item.image ||
            item.cover
        );


    const audio =
        getAssetPath(
            item.audio
        );


    const video =
        getAssetPath(
            item.video
        );


    const gallery =
        Array.isArray(
            item.gallery
        )
        ? item.gallery
        : [];


    const mapUrl =
        item.map ||
        createGoogleMapUrl(item);


    /*
       Tạo HTML
    */

    container.innerHTML = `

        <article class="qr-card">

            <!-- ẢNH CHÍNH -->

            ${
                image
                ?
                `
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
                :
                `
                <div class="hero-no-image">
                    🏛️
                </div>
                `
            }


            <div class="qr-content">


                <!-- BADGE -->

                <div class="qr-badge">
                    KHÔNG GIAN DI SẢN SỐ
                </div>


                <!-- TÊN -->

                <h1 class="qr-title">
                    ${escapeHtml(name)}
                </h1>


                ${
                    subtitle
                    ?
                    `
                    <div class="qr-subtitle">
                        ${escapeHtml(subtitle)}
                    </div>
                    `
                    :
                    ""
                }


                <!-- THÔNG TIN -->

                <div class="qr-info">

                    <p>
                        🏛️
                        <strong>Loại di tích:</strong>
                        ${escapeHtml(type)}
                    </p>

                    <p>
                        📍
                        <strong>Địa điểm:</strong>
                        ${escapeHtml(address)}
                    </p>

                    ${
                        year
                        ?
                        `
                        <p>
                            📅
                            <strong>Niên đại:</strong>
                            ${escapeHtml(year)}
                        </p>
                        `
                        :
                        ""
                    }

                    ${
                        rank
                        ?
                        `
                        <p>
                            🏅
                            <strong>Xếp hạng:</strong>
                            ${escapeHtml(rank)}
                        </p>
                        `
                        :
                        ""
                    }

                </div>


                <!-- NÚT -->

                <div class="qr-actions">

                    ${
                        audio
                        ?
                        `
                        <button
                            id="audioJumpButton"
                            type="button"
                            class="qr-action qr-action-audio"
                        >
                            🎧 NGHE THUYẾT MINH
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        video
                        ?
                        `
                        <button
                            id="videoJumpButton"
                            type="button"
                            class="qr-action qr-action-video"
                        >
                            🎬 XEM VIDEO
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        mapUrl
                        ?
                        `
                        <a
                            href="${safe(mapUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="qr-action qr-action-map"
                        >
                            📍 CHỈ ĐƯỜNG
                        </a>
                        `
                        :
                        ""
                    }

                </div>


                <!-- GIỚI THIỆU -->

                ${
                    description
                    ?
                    `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            📜 Giới thiệu
                        </h2>

                        <div class="qr-text">
                            ${formatText(description)}
                        </div>

                    </section>
                    `
                    :
                    ""
                }


                <!-- LỊCH SỬ -->

                ${
                    history
                    ?
                    `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            📖 Lịch sử
                        </h2>

                        <div class="qr-text">
                            ${formatText(history)}
                        </div>

                    </section>
                    `
                    :
                    ""
                }


                <!-- THUYẾT MINH -->

                ${
                    audio
                    ?
                    `
                    <section
                        class="qr-section"
                        id="audio"
                    >

                        <h2 class="qr-section-title">
                            🎧 Thuyết minh
                        </h2>


                        <div class="audio-player-card">

                            <div class="audio-player-header">

                                <div class="audio-icon">
                                    🎧
                                </div>

                                <div>

                                    <div class="audio-player-title">
                                        Thuyết minh di tích
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
                                ⏳ Đang chuẩn bị thuyết minh...
                            </div>


                            <div
                                id="audioError"
                                class="audio-error"
                            ></div>

                        </div>

                    </section>
                    `
                    :
                    ""
                }


                <!-- VIDEO -->

                ${
                    video
                    ?
                    `
                    <section
                        class="qr-section"
                        id="video"
                    >

                        <h2 class="qr-section-title">
                            🎬 Video giới thiệu
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
                    :
                    ""
                }


                <!-- GALLERY -->

                ${
                    gallery.length
                    ?
                    `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            🖼️ Hình ảnh
                        </h2>

                        <div class="heritage-gallery">

                            ${
                                gallery.map(
                                    function (photo, index) {

                                        const src =
                                            getAssetPath(
                                                typeof photo === "string"
                                                ? photo
                                                : photo.image
                                            );


                                        const caption =
                                            typeof photo === "string"
                                            ? ""
                                            : (
                                                photo.caption ||
                                                ""
                                            );


                                        return `

                                            <figure>

                                                <img
                                                    src="${safe(src)}"
                                                    alt="${safe(
                                                        caption ||
                                                        name
                                                    )}"
                                                    loading="lazy"
                                                    class="gallery-image"
                                                >

                                                ${
                                                    caption
                                                    ?
                                                    `
                                                    <figcaption>
                                                        ${escapeHtml(
                                                            caption
                                                        )}
                                                    </figcaption>
                                                    `
                                                    :
                                                    ""
                                                }

                                            </figure>

                                        `;

                                    }
                                ).join("")
                            }

                        </div>

                    </section>
                    `
                    :
                    ""
                }


                <!-- BẢN ĐỒ -->

                ${
                    mapUrl
                    ?
                    `
                    <section class="qr-section">

                        <h2 class="qr-section-title">
                            📍 Vị trí di tích
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
                                🗺️ MỞ GOOGLE MAPS
                            </a>

                        </div>

                    </section>
                    `
                    :
                    ""
                }


                <!-- ĐIỀU HƯỚNG -->

                <div class="qr-navigation">

                    <a
                        href="../index.html"
                        class="qr-nav-button"
                    >
                        🏠 Trang chủ
                    </a>

                    <a
                        href="map.html"
                        class="qr-nav-button"
                    >
                        🗺️ Bản đồ
                    </a>

                </div>


            </div>

        </article>

    `;


    addUpgradeStyles();

    setupAudio();

    setupJumpButtons();

}


/* =========================================================
   AUDIO
   ========================================================= */

function setupAudio() {

    const audio =
        document.getElementById(
            "audioPlayer"
        );


    if (!audio) {
        return;
    }


    const status =
        document.getElementById(
            "audioStatus"
        );


    const error =
        document.getElementById(
            "audioError"
        );


    audio.addEventListener(
        "loadedmetadata",
        function () {

            status.textContent =
                "▶ Sẵn sàng phát thuyết minh";

        }
    );


    audio.addEventListener(
        "play",
        function () {

            status.textContent =
                "🔊 Đang phát thuyết minh...";

        }
    );


    audio.addEventListener(
        "pause",
        function () {

            if (!audio.ended) {

                status.textContent =
                    "⏸ Đã tạm dừng";

            }

        }
    );


    audio.addEventListener(
        "ended",
        function () {

            status.textContent =
                "✅ Đã phát xong thuyết minh";

        }
    );


    audio.addEventListener(
        "error",
        function () {

            console.error(
                "Không phát được audio:",
                audio.currentSrc
            );


            status.textContent =
                "⚠️ Không phát được thuyết minh";


            error.textContent =
                "Không tìm thấy hoặc không đọc được file: " +
                audio.currentSrc;

        }
    );

}


/* =========================================================
   NÚT NHẢY AUDIO / VIDEO
   ========================================================= */

function setupJumpButtons() {

    const audioButton =
        document.getElementById(
            "audioJumpButton"
        );


    const videoButton =
        document.getElementById(
            "videoJumpButton"
        );


    if (audioButton) {

        audioButton.addEventListener(
            "click",
            function () {

                document
                    .getElementById("audio")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    if (videoButton) {

        videoButton.addEventListener(
            "click",
            function () {

                document
                    .getElementById("video")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }

}


/* =========================================================
   ĐƯỜNG DẪN FILE
   ========================================================= */

function getAssetPath(path) {

    if (!path) {
        return "";
    }


    let value =
        String(path).trim();


    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    ) {

        return value;

    }


    if (
        value.startsWith("../")
    ) {

        return value;

    }


    if (
        value.startsWith("/")
    ) {

        return value;

    }


    /*
       detail.html nằm trong /pages
       nên:

       audio/lang-than.mp3
       →
       ../audio/lang-than.mp3
    */

    return "../" +
        value.replace(
            /^\/+/,
            ""
        );

}


/* =========================================================
   GOOGLE MAP
   ========================================================= */

function createGoogleMapUrl(item) {

    if (
        item.lat !== undefined &&
        item.lng !== undefined
    ) {

        return (
            "https://www.google.com/maps/dir/?api=1" +
            "&destination=" +
            encodeURIComponent(
                item.lat +
                "," +
                item.lng
            )
        );

    }


    if (item.name) {

        return (
            "https://www.google.com/maps/search/?api=1" +
            "&query=" +
            encodeURIComponent(
                item.name +
                " Mộ Trạch Hải Phòng"
            )
        );

    }


    return "";
}


/* =========================================================
   FORMAT TEXT
   ========================================================= */

function formatText(text) {

    return escapeHtml(
        text
    )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br>");

}


/* =========================================================
   ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function safe(value) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   LỖI
   ========================================================= */

function showError(
    title,
    message
) {

    const container =
        document.getElementById(
            "detail-content"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="qr-error">

            <div style="
                font-size:60px;
                margin-bottom:15px;
            ">
                ⚠️
            </div>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

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
                    🏠 Về trang chủ
                </a>

                <a
                    href="map.html"
                    class="qr-nav-button"
                >
                    🗺️ Xem bản đồ
                </a>

            </div>

        </div>

    `;

}


/* =========================================================
   CSS NHỎ CHO AUDIO
   ========================================================= */

function addUpgradeStyles() {

    if (
        document.getElementById(
            "detail-upgrade-style"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "detail-upgrade-style";


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
            grid-template-columns:
                repeat(3,1fr);
            gap:15px;
        }

        .heritage-gallery figure {
            margin:0;
            overflow:hidden;
            border-radius:12px;
            background:#fff;
            box-shadow:
                0 4px 15px rgba(0,0,0,.08);
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


    document.head.appendChild(
        style
    );

}