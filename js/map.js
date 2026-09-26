/* =========================================================
   MỘ TRẠCH HERITAGE
   MAP.JS - BƯỚC 6 + BƯỚC 7
   ========================================================= */

"use strict";


/* =========================================================
   BIẾN TOÀN CỤC
   ========================================================= */

let map = null;

let heritageData = [];

let markers = [];

let markerLayer = null;

let tourLine = null;

let tourMarkers = [];

let selectedId = null;


/* =========================================================
   BƯỚC 7 - BIẾN TUYẾN THAM QUAN THÔNG MINH
   ========================================================= */

let smartTourIndex = -1;

let smartTourStarted = false;
const SMART_TOUR_STORAGE_KEY =
    "motrachSmartTourProgress";

let visitedHeritageIds =
    new Set();

/* =========================================================
   KHỞI ĐỘNG
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initMap();

    bindEvents();

    loadHeritageData();

});


/* =========================================================
   KHỞI TẠO BẢN ĐỒ
   ========================================================= */

function initMap() {

    map = L.map("map", {
        zoomControl: true,
        attributionControl: true
    }).setView(
        [20.9430, 106.3650],
        15
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    markerLayer =
        L.layerGroup().addTo(map);


    setTimeout(function () {

        if (map) {
            map.invalidateSize();
        }

    }, 300);

}


/* =========================================================
   SỰ KIỆN
   ========================================================= */

function bindEvents() {

    const searchInput =
        document.getElementById("searchInput");

    const typeFilter =
        document.getElementById("typeFilter");

    const showAllBtn =
        document.getElementById("showAllBtn");

    const fitAllBtn =
        document.getElementById("fitAllBtn");

    const myLocationBtn =
        document.getElementById("myLocationBtn");

    const tourBtn =
        document.getElementById("tourBtn");

    const startTourBtn =
        document.getElementById("startTourBtn");if (startTourBtn) {
    startTourBtn.addEventListener("click", function () {
        window.location.href = "map-tour.html";
    });
}

    const tourAllBtn =
        document.getElementById("tourAllBtn");

    const clearTourBtn =
        document.getElementById("clearTourBtn");


    /* -----------------------------------------
       TÌM KIẾM
    ----------------------------------------- */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderHeritageList
        );

    }


    /* -----------------------------------------
       BỘ LỌC
    ----------------------------------------- */

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            renderHeritageList
        );

    }


    /* -----------------------------------------
       XEM TẤT CẢ
    ----------------------------------------- */

    if (showAllBtn) {

        showAllBtn.addEventListener(
            "click",
            showAllHeritage
        );

    }


    if (fitAllBtn) {

        fitAllBtn.addEventListener(
            "click",
            showAllHeritage
        );

    }


    /* -----------------------------------------
       VỊ TRÍ
    ----------------------------------------- */

    if (myLocationBtn) {

        myLocationBtn.addEventListener(
            "click",
            findMyLocation
        );

    }


    /* -----------------------------------------
       TUYẾN THAM QUAN
    ----------------------------------------- */

    if (tourBtn) {

        tourBtn.addEventListener(
            "click",
            function () {

                const section =
                    document.getElementById(
                        "tourSection"
                    );

                if (section) {

                    section.scrollIntoView({
                        behavior: "smooth"
                    });

                }

                showTour();

            }
        );

    }


    if (startTourBtn) {

        startTourBtn.addEventListener(
            "click",
            startTour
        );

    }


    if (tourAllBtn) {

        tourAllBtn.addEventListener(
            "click",
            showTour
        );

    }


    if (clearTourBtn) {

        clearTourBtn.addEventListener(
            "click",
            clearTour
        );

    }


    /* =====================================================
       BƯỚC 7
    ===================================================== */

    const smartStartBtn =
        document.getElementById(
            "smartStartBtn"
        );

    const previousStopBtn =
        document.getElementById(
            "previousStopBtn"
        );

    const nextStopBtn =
        document.getElementById(
            "nextStopBtn"
        );

    const resetSmartTourBtn =
        document.getElementById(
            "resetSmartTourBtn"
        );


    if (smartStartBtn) {

        smartStartBtn.addEventListener(
            "click",
            startSmartTour
        );

    }


    if (previousStopBtn) {

        previousStopBtn.addEventListener(
            "click",
            previousSmartStop
        );

    }


    if (nextStopBtn) {

        nextStopBtn.addEventListener(
            "click",
            nextSmartStop
        );

    }


    if (resetSmartTourBtn) {

        resetSmartTourBtn.addEventListener(
            "click",
            resetSmartTour
        );

    }

}


/* =========================================================
   TẢI HERITAGE.JSON
   ========================================================= */

async function loadHeritageData() {

    const status =
        document.getElementById(
            "dataStatus"
        );

    const list =
        document.getElementById(
            "heritageList"
        );


    try {

        const response =
            await fetch(
                "../data/heritage.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const rawData =
            await response.json();


        heritageData =
            normalizeHeritageData(
                rawData
            );


        if (!heritageData.length) {

            throw new Error(
                "Không có dữ liệu di tích hợp lệ."
            );

        }


        console.log(
            "MỘ TRẠCH HERITAGE:",
            heritageData
        );


        if (status) {

            status.textContent =
                "✅ Đã tải " +
                heritageData.length +
                " di tích";

            status.className =
                "data-status success";

        }


        createTypeFilter();

        renderMarkers();

        renderHeritageList();

        renderTourStops();
loadSmartTourProgress();
        renderSmartTour();
updateSmartTourButtons();

        showAllHeritage();


    } catch (error) {

        console.error(
            "Lỗi tải heritage.json:",
            error
        );


        if (status) {

            status.textContent =
                "❌ Không thể tải dữ liệu di tích. Kiểm tra file: data/heritage.json";

            status.className =
                "data-status error";

        }


        if (list) {

            list.innerHTML = `
                <div style="
                    padding:20px;
                    color:#a40000;
                    line-height:1.6;
                ">
                    ❌ Không thể tải dữ liệu di tích.
                    <br>
                    Kiểm tra:
                    <br>
                    <strong>data/heritage.json</strong>
                    <br><br>
                    Hãy chạy website bằng
                    <strong>Live Server</strong>.
                </div>
            `;

        }

    }

}


/* =========================================================
   CHUẨN HÓA DỮ LIỆU
   ========================================================= */

function normalizeHeritageData(raw) {

    let data = raw;


    if (!Array.isArray(data)) {

        if (Array.isArray(raw.items)) {

            data = raw.items;

        } else if (
            Array.isArray(raw.heritage)
        ) {

            data = raw.heritage;

        } else if (
            Array.isArray(raw.diTich)
        ) {

            data = raw.diTich;

        } else if (
            Array.isArray(raw.di_tich)
        ) {

            data = raw.di_tich;

        } else if (
            Array.isArray(raw.sites)
        ) {

            data = raw.sites;

        } else if (
            Array.isArray(raw.data)
        ) {

            data = raw.data;

        } else {

            data = [];

        }

    }


    return data
        .map(function (item, index) {

            const lat =
                getNumber(
                    item.lat ??
                    item.latitude ??
                    item.coordinates?.lat ??
                    item.location?.lat
                );


            const lng =
                getNumber(
                    item.lng ??
                    item.lon ??
                    item.longitude ??
                    item.coordinates?.lng ??
                    item.location?.lng
                );


            return {

                id:
                    item.id ??
                    item.ID ??
                    item.ma ??
                    item.code ??
                    item.slug ??
                    String(index + 1),


                name:
                    item.name ??
                    item.title ??
                    item.ten ??
                    item.ten_di_tich ??
                    "Di tích " +
                    (index + 1),


                type:
                    item.type ??
                    item.category ??
                    item.loai ??
                    item.loai_di_tich ??
                    "Di tích",


                description:
                    item.description ??
                    item.desc ??
                    item.moTa ??
                    item.mo_ta ??
                    "",


                lat: lat,

                lng: lng,


                detail:
                    item.detail ??
                    item.detailUrl ??
                    item.url ??
                    "",


                image:
                    item.image ??
                    item.thumbnail ??
                    ""

            };

        })

        .filter(function (item) {

            return (
                Number.isFinite(item.lat) &&
                Number.isFinite(item.lng)
            );

        });

}


/* =========================================================
   CHUYỂN SỐ
   ========================================================= */

function getNumber(value) {

    const number =
        Number.parseFloat(value);


    return Number.isFinite(number)
        ? number
        : NaN;

}


/* =========================================================
   TẠO BỘ LỌC LOẠI
   ========================================================= */

function createTypeFilter() {

    const select =
        document.getElementById(
            "typeFilter"
        );


    if (!select) return;


    const types = [
        ...new Set(
            heritageData
                .map(
                    item => item.type
                )
                .filter(Boolean)
        )
    ];


    select.innerHTML = `
        <option value="">
            🏛️ Tất cả loại di tích
        </option>
    `;


    types.forEach(function (type) {

        const option =
            document.createElement(
                "option"
            );


        option.value = type;

        option.textContent =
            "🏛️ " + type;


        select.appendChild(option);

    });

}


/* =========================================================
   TẠO MARKER
   ========================================================= */

function renderMarkers() {

    if (!markerLayer) return;


    markerLayer.clearLayers();

    markers = [];


    heritageData.forEach(function (item) {

        const marker =
            L.marker([
                item.lat,
                item.lng
            ]);


        marker.bindPopup(
            createPopup(item)
        );


        marker.on(
            "click",
            function () {

                selectedId =
                    item.id;

                renderHeritageList();

            }
        );


        marker.addTo(
            markerLayer
        );


        markers.push({

            id: item.id,

            item: item,

            marker: marker

        });

    });

}


/* =========================================================
   POPUP
   ========================================================= */

function createPopup(item) {

    const googleUrl =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            item.lat +
            "," +
            item.lng
        );


    let detailButton = "";
const stationUrl = {
    "lang-than": "tram-lang-than.html",
    "van-mieu-mo-trach": "tram-van-mieu.html",
    "dinh-lang-mo-trach": "tram-dinh-lang.html"
}[String(item.id)] || "";

let stationButton = "";

   const detailUrl =
    item.detail ||
    (
        "detail.html?id=" +
        encodeURIComponent(item.id)
    );

detailButton = `
    <a
        class="popup-detail"
        href="${safeAttr(detailUrl)}"
    >
        📖 Xem chi tiết
    </a>
`;
if (stationUrl) {

    stationButton = `
        <a
            class="popup-station"
            href="${safeAttr(stationUrl)}"
        >
            🏛️ Trạm tham quan
        </a>
    `;

}

    return `
        <div class="heritage-popup">

            <h3>
                🏛️ ${escapeHtml(item.name)}
            </h3>

            <div>
                ${escapeHtml(item.type)}
            </div>

            <p>
                ${escapeHtml(
                    item.description
                )}
            </p>

            <div class="popup-actions">

                ${detailButton}
${stationButton}
                <a
                    class="popup-direction"
                    href="${googleUrl}"
                    target="_blank"
                    rel="noopener"
                >
                    🧭 Chỉ đường
                </a>

            </div>

        </div>
    `;

}


/* =========================================================
   DANH SÁCH DI TÍCH
   ========================================================= */

function renderHeritageList() {

    const list =
        document.getElementById(
            "heritageList"
        );


    if (!list) return;


    const search =
        (
            document
                .getElementById(
                    "searchInput"
                )
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    const type =
        document
            .getElementById(
                "typeFilter"
            )
            ?.value || "";


    const filtered =
        heritageData.filter(
            function (item) {

                const itemName =
                    String(
                        item.name || ""
                    ).toLowerCase();


                const matchSearch =
                    !search ||
                    itemName.includes(
                        search
                    );


                const matchType =
                    !type ||
                    item.type === type;


                return (
                    matchSearch &&
                    matchType
                );

            }
        );


    if (!filtered.length) {

        list.innerHTML = `
            <div style="
                padding:20px;
                text-align:center;
                color:#777;
            ">
                Không tìm thấy di tích phù hợp.
            </div>
        `;

        return;

    }


    list.innerHTML = "";


    filtered.forEach(
        function (item) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "heritage-item" +
                (
                    selectedId === item.id
                        ? " active"
                        : ""
                );


            card.innerHTML = `

                <h3>
                    🏛️
                    ${escapeHtml(
                        item.name
                    )}
                </h3>

                <div class="heritage-type">
                    ${escapeHtml(
                        item.type
                    )}
                </div>

                <div class="heritage-description">
                    ${escapeHtml(
                        item.description
                    )}
                </div>

                <div class="item-buttons">

                    <button
                        class="small-btn red"
                        type="button"
                    >
                        📍 Xem vị trí
                    </button>

                    <button
                        class="small-btn gold"
                        type="button"
                    >
                        🧭 Chỉ đường
                    </button>

                </div>

            `;


            const buttons =
                card.querySelectorAll(
                    "button"
                );


            card.addEventListener(
                "click",
                function () {

                    selectHeritage(
                        item
                    );

                }
            );


            if (buttons[0]) {

                buttons[0]
                    .addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            selectHeritage(
                                item
                            );

                        }
                    );

            }


            if (buttons[1]) {

                buttons[1]
                    .addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            openDirections(
                                item
                            );

                        }
                    );

            }


            list.appendChild(card);

        }
    );

}


/* =========================================================
   CHỌN DI TÍCH
   ========================================================= */

function selectHeritage(item) {

    if (!map || !item) return;


    selectedId =
        item.id;


    map.flyTo(
        [
            item.lat,
            item.lng
        ],
        18,
        {
            duration: 1.2
        }
    );


    const found =
        markers.find(
            m => m.id === item.id
        );


    if (found) {

        setTimeout(
            function () {

                found.marker.openPopup();

            },
            600
        );

    }


    renderHeritageList();

}


/* =========================================================
   CHỈ ĐƯỜNG
   ========================================================= */

function openDirections(item) {

    const url =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            item.lat +
            "," +
            item.lng
        );


    window.open(
        url,
        "_blank",
        "noopener"
    );

}


/* =========================================================
   XEM TẤT CẢ
   ========================================================= */

function showAllHeritage() {

    if (
        !map ||
        !heritageData.length
    ) {
        return;
    }


    const bounds =
        L.latLngBounds(
            heritageData.map(
                item => [
                    item.lat,
                    item.lng
                ]
            )
        );


    map.fitBounds(
        bounds,
        {
            padding: [
                50,
                50
            ],
            maxZoom: 17
        }
    );

}


/* =========================================================
   BƯỚC 6
   RENDER CÁC ĐIỂM TUYẾN
   ========================================================= */

function renderTourStops() {

    const container =
        document.getElementById(
            "tourStops"
        );


    if (!container) return;


    container.innerHTML = "";


    heritageData.forEach(
        function (item, index) {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "tour-stop";


            div.innerHTML = `

                <div class="tour-number">
                    ${index + 1}
                </div>

                <h3>
                    ${escapeHtml(
                        item.name
                    )}
                </h3>

                <div style="
                    color:#777;
                ">
                    ${escapeHtml(
                        item.type
                    )}
                </div>

                <p>
                    ${escapeHtml(
                        item.description
                    )}
                </p>

                <button
                    class="small-btn red"
                    type="button"
                >
                    📍 Xem điểm này
                </button>

            `;


            const button =
                div.querySelector(
                    "button"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    function () {

                        selectHeritage(
                            item
                        );


                        const mapElement =
                            document.getElementById(
                                "map"
                            );


                        if (mapElement) {

                            mapElement.scrollIntoView({
                                behavior:
                                    "smooth"
                            });

                        }

                    }
                );

            }


            container.appendChild(
                div
            );

        }
    );


    const pointCount =
        document.getElementById(
            "tourPointCount"
        );


    if (pointCount) {

        pointCount.textContent =
            heritageData.length;

    }


    calculateTourDistance();

}


/* =========================================================
   HIỂN THỊ TUYẾN BƯỚC 6
   ========================================================= */

function showTour() {

    if (
        heritageData.length < 2
    ) {

        alert(
            "Cần ít nhất 2 di tích để tạo tuyến tham quan."
        );

        return;

    }


    clearTourGraphics();


    const coordinates =
        heritageData.map(
            item => [
                item.lat,
                item.lng
            ]
        );


    tourLine =
        L.polyline(
            coordinates,
            {
                color: "#a40000",
                weight: 6,
                opacity: 0.85,
                dashArray: "12,8"
            }
        ).addTo(map);


    heritageData.forEach(
        function (item, index) {

            const icon =
                L.divIcon({

                    className:
                        "tour-number-marker",

                    html: `
                        <div style="
                            width:38px;
                            height:38px;
                            border-radius:50%;
                            background:#a40000;
                            color:#fff;
                            border:3px solid #fff;
                            box-shadow:0 3px 10px rgba(0,0,0,.35);
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-weight:900;
                            font-size:17px;
                        ">
                            ${index + 1}
                        </div>
                    `,

                    iconSize: [
                        38,
                        38
                    ],

                    iconAnchor: [
                        19,
                        19
                    ]

                });


            const marker =
                L.marker(
                    [
                        item.lat,
                        item.lng
                    ],
                    {
                        icon: icon,

                        zIndexOffset:
                            1000
                    }
                )
                .addTo(map);


            marker.bindTooltip(
                `${index + 1}. ${item.name}`,
                {
                    direction:
                        "top"
                }
            );


            tourMarkers.push(
                marker
            );

        }
    );


    const bounds =
        L.latLngBounds(
            coordinates
        );


    map.fitBounds(
        bounds,
        {
            padding: [
                70,
                70
            ],
            maxZoom: 17
        }
    );


    const status =
        document.getElementById(
            "tourStatus"
        );


    if (status) {

        status.textContent =
            "Đang hiển thị";

    }


    calculateTourDistance();

}


/* =========================================================
   BẮT ĐẦU TUYẾN BƯỚC 6
   ========================================================= */

function startTour() {

    if (
        !heritageData.length
    ) {
        return;
    }


    showTour();


    setTimeout(
        function () {

            selectHeritage(
                heritageData[0]
            );

        },
        800
    );

}


/* =========================================================
   XÓA ĐƯỜNG TUYẾN
   ========================================================= */

function clearTourGraphics() {

    if (tourLine) {

        map.removeLayer(
            tourLine
        );

        tourLine = null;

    }


    tourMarkers.forEach(
        function (marker) {

            map.removeLayer(
                marker
            );

        }
    );


    tourMarkers = [];

}


/* =========================================================
   XÓA TUYẾN BƯỚC 6
   ========================================================= */

function clearTour() {

    if (!map) return;


    clearTourGraphics();


    const status =
        document.getElementById(
            "tourStatus"
        );


    if (status) {

        status.textContent =
            "Chưa mở tuyến";

    }


    const distance =
        document.getElementById(
            "tourDistance"
        );


    if (distance) {

        distance.textContent =
            "0 km";

    }

}


/* =========================================================
   TÍNH KHOẢNG CÁCH TUYẾN
   ========================================================= */

function calculateTourDistance() {

    let total = 0;


    for (
        let i = 0;
        i <
        heritageData.length - 1;
        i++
    ) {

        const a =
            heritageData[i];

        const b =
            heritageData[i + 1];


        total +=
            haversineDistance(
                a.lat,
                a.lng,
                b.lat,
                b.lng
            );

    }


    const element =
        document.getElementById(
            "tourDistance"
        );


    if (element) {

        element.textContent =
            total.toFixed(2) +
            " km";

    }

}


/* =========================================================
   HAVERSINE
   ========================================================= */

function haversineDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) *
        Math.sin(
            dLat / 2
        ) +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) *

        Math.sin(
            dLon / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


function toRadians(value) {

    return value *
        Math.PI /
        180;

}


/* =========================================================
   XÁC ĐỊNH VỊ TRÍ
   ========================================================= */

function findMyLocation() {

    if (!navigator.geolocation) {

        alert(
            "Thiết bị hoặc trình duyệt không hỗ trợ xác định vị trí."
        );

        return;

    }


    const button =
        document.getElementById(
            "myLocationBtn"
        );


    if (button) {

        button.textContent =
            "⏳ Đang xác định...";

        button.disabled = true;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            map.flyTo(
                [
                    lat,
                    lng
                ],
                17,
                {
                    duration: 1
                }
            );


            L.marker([
                lat,
                lng
            ])
            .addTo(map)
            .bindPopup(
                "📍 Vị trí hiện tại của bạn"
            )
            .openPopup();


            if (button) {

                button.textContent =
                    "📍 Vị trí tôi";

                button.disabled =
                    false;

            }

        },


        function (error) {

            console.warn(
                "Geolocation:",
                error
            );


            if (button) {

                button.textContent =
                    "📍 Vị trí tôi";

                button.disabled =
                    false;

            }


            let message =
                "Không thể xác định vị trí hiện tại.";


            if (error.code === 1) {

                message =
                    "Trình duyệt chưa được cấp quyền vị trí.";

            } else if (
                error.code === 2
            ) {

                message =
                    "Không nhận được vị trí. Máy tính có thể không có GPS hoặc dịch vụ định vị.";

            } else if (
                error.code === 3
            ) {

                message =
                    "Quá thời gian xác định vị trí. Hãy thử lại.";

            }


            alert(
                message +
                "\n\n" +
                "Bạn vẫn có thể sử dụng đầy đủ bản đồ và tuyến tham quan Mộ Trạch."
            );

        },


        {
            enableHighAccuracy:
                false,

            timeout:
                10000,

            maximumAge:
                300000

        }

    );

}


/* =========================================================
   =========================================================
   BƯỚC 7
   TUYẾN THAM QUAN THÔNG MINH
   =========================================================
   ========================================================= */


/* =========================================================
   KHỞI TẠO BƯỚC 7
   ========================================================= */

function renderSmartTour() {

    const stages =
        document.getElementById(
            "smartTourStages"
        );


    if (!stages) {
        return;
    }


    stages.innerHTML = "";


    if (!heritageData.length) {

        stages.innerHTML = `
            <div style="
                padding:20px;
                text-align:center;
                color:#777;
            ">
                Chưa có dữ liệu tuyến tham quan.
            </div>
        `;

        updateSmartTourSummary();

        return;

    }


    heritageData.forEach(
        function (item, index) {

            const distance =
                index === 0
                    ? 0
                    : haversineDistance(
                        heritageData[
                            index - 1
                        ].lat,
                        heritageData[
                            index - 1
                        ].lng,
                        item.lat,
                        item.lng
                    );


            const stage =
                document.createElement(
                    "div"
                );


            stage.className =
                "smart-stage";


            stage.dataset.index =
                index;


            stage.innerHTML = `

                <div class="stage-number">
                    ${index + 1}
                </div>

                <div class="stage-info">

                    <h3>
                        ${escapeHtml(
                            item.name
                        )}
                    </h3>

                    <div class="stage-meta">

                        <span>
                            🏛️
                            ${escapeHtml(
                                item.type
                            )}
                        </span>

                        <span>
                            ${
                                index === 0
                                    ? "🚩 Điểm bắt đầu"
                                    : "📏 " +
                                      distance.toFixed(
                                          2
                                      ) +
                                      " km từ điểm trước"
                            }
                        </span>

                    </div>

                </div>

                <div class="stage-actions">

                    <button
                        class="stage-btn view"
                        type="button"
                    >
                        📍 Xem
                    </button>

                    <button
                        class="stage-btn route"
                        type="button"
                    >
                        🧭 Chỉ đường
                    </button>

                </div>

            `;


            const viewButton =
                stage.querySelector(
                    ".stage-btn.view"
                );


            const routeButton =
                stage.querySelector(
                    ".stage-btn.route"
                );


            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    function () {

                        selectSmartStop(
                            index
                        );

                    }
                );

            }


            if (routeButton) {

                routeButton.addEventListener(
                    "click",
                    function () {

                        openDirections(
                            item
                        );

                    }
                );

            }


            stages.appendChild(
                stage
            );

        }
    );


    updateSmartTourSummary();

    updateSmartTourProgress();

}


/* =========================================================
   TÍNH TỔNG KHOẢNG CÁCH BƯỚC 7
   ========================================================= */

function getSmartTourDistance() {

    let total = 0;


    for (
        let i = 0;
        i <
        heritageData.length - 1;
        i++
    ) {

        total +=
            haversineDistance(
                heritageData[i].lat,
                heritageData[i].lng,
                heritageData[i + 1].lat,
                heritageData[i + 1].lng
            );

    }


    return total;

}


/* =========================================================
   CẬP NHẬT THỐNG KÊ BƯỚC 7
   ========================================================= */

function updateSmartTourSummary() {

    const points =
        document.getElementById(
            "smartTourPoints"
        );


    const distance =
        document.getElementById(
            "smartTourDistance"
        );


    const walking =
        document.getElementById(
            "walkingTime"
        );


    const motorbike =
        document.getElementById(
            "motorbikeTime"
        );


    const totalDistance =
        getSmartTourDistance();


    if (points) {

        points.textContent =
            heritageData.length;

    }


    if (distance) {

        distance.textContent =
            totalDistance.toFixed(
                2
            ) +
            " km";

    }


    /*
       Ước tính đơn giản:

       Đi bộ: 5 km/h
       Xe máy: 25 km/h

       Đây chỉ là thời gian ước tính
       theo khoảng cách đường thẳng
       giữa các điểm.
    */

    const walkingMinutes =
        Math.round(
            totalDistance /
            5 *
            60
        );


    const motorbikeMinutes =
        Math.round(
            totalDistance /
            25 *
            60
        );


    if (walking) {

        walking.textContent =
            walkingMinutes +
            " phút";

    }


    if (motorbike) {

        motorbike.textContent =
            motorbikeMinutes +
            " phút";

    }

}


/* =========================================================
   BẮT ĐẦU BƯỚC 7
   ========================================================= */

function startSmartTour() {

    if (!heritageData.length) {

        return;

    }


    smartTourStarted =
        true;


    smartTourIndex =
        0;


    /*
       Hiển thị tuyến trên bản đồ.
    */

    showTour();


    /*
       Cập nhật giao diện.
    */

    updateSmartTourProgress();

    updateSmartTourButtons();


    /*
       Cuộn xuống Bước 7.
    */

    const section =
        document.getElementById(
            "smartTourSection"
        );


    if (section) {

        section.scrollIntoView({
            behavior:
                "smooth"
        });

    }


    /*
       Đưa bản đồ tới điểm đầu.
    */

    setTimeout(
        function () {

            selectSmartStop(
                0
            );

        },
        500
    );

}


/* =========================================================
   CHỌN ĐIỂM BƯỚC 7
   ========================================================= */

function selectSmartStop(index) {

    if (
        index < 0 ||
        index >= heritageData.length
    ) {

        return;

    }


    smartTourIndex =
        index;


    smartTourStarted =
        true;


    const item =
        heritageData[index];
visitedHeritageIds.add(
    String(item.id)
);

saveSmartTourProgress();

    /*
       Di chuyển bản đồ.
    */

    selectHeritage(
        item
    );


    /*
       Cập nhật trạng thái.
    */

    updateSmartTourProgress();

    updateSmartTourButtons();


    /*
       Đánh dấu điểm hiện tại.
    */

    highlightSmartStage(
        index
    );

}


/* =========================================================
   ĐIỂM TIẾP THEO
   ========================================================= */

function nextSmartStop() {

    if (!heritageData.length) {

        return;

    }


    if (!smartTourStarted) {

        startSmartTour();

        return;

    }


    if (
        smartTourIndex <
        heritageData.length - 1
    ) {

        smartTourIndex++;

        selectSmartStop(
            smartTourIndex
        );

    } else {

        smartTourIndex =
            heritageData.length - 1;

        updateSmartTourProgress();

        updateSmartTourButtons();


        const status =
            document.getElementById(
                "tourStatus"
            );


        if (status) {

            status.textContent =
                "Đã hoàn thành tuyến";

        }

    }

}


/* =========================================================
   ĐIỂM TRƯỚC
   ========================================================= */

function previousSmartStop() {

    if (
        !smartTourStarted ||
        smartTourIndex <= 0
    ) {

        return;

    }


    smartTourIndex--;

    selectSmartStop(
        smartTourIndex
    );

}


/* =========================================================
   ĐÁNH DẤU ĐIỂM HIỆN TẠI
   ========================================================= */

function highlightSmartStage(index) {

    const stages =
        document.querySelectorAll(
            ".smart-stage"
        );


    stages.forEach(
        function (stage, i) {

            stage.classList.remove(
                "active"
            );

            stage.classList.remove(
                "completed"
            );


            const item =
    heritageData[i];

if (
    item &&
    visitedHeritageIds.has(
        String(item.id)
    ) &&
    i !== index
) {

    stage.classList.add(
        "completed"
    );

}


            if (i === index) {

                stage.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   TIẾN TRÌNH BƯỚC 7
   ========================================================= */

function updateSmartTourProgress() {

    const text =
        document.getElementById(
            "tourProgressText"
        );


    const bar =
        document.getElementById(
            "tourProgressBar"
        );


    if (!heritageData.length) {

        if (text) {

            text.textContent =
                "Chưa có dữ liệu";

        }


        if (bar) {

            bar.style.width =
                "0%";

        }


        return;

    }


    if (!smartTourStarted) {

        if (text) {

            text.textContent =
                "Chưa bắt đầu";

        }


        if (bar) {

            bar.style.width =
                "0%";

        }


        highlightSmartStage(
            -1
        );

        return;

    }


    const current =
    heritageData.filter(
        function (item) {

            return visitedHeritageIds.has(
                String(item.id)
            );

        }
    ).length;

const total =
    heritageData.length;

const percent =
    total > 0
        ? (
            current /
            total
        ) * 100
        : 0;


    if (text) {

    if (
        current >= total &&
        total > 0
    ) {

        text.textContent =
            "Đã hoàn thành";

    } else {

        text.textContent =
            "Đã tham quan " +
            current +
            " / " +
            total;

    }

}


    if (bar) {

        bar.style.width =
            percent +
            "%";

    }


    highlightSmartStage(
        smartTourIndex
    );

}


/* =========================================================
   NÚT TRƯỚC / SAU
   ========================================================= */

function updateSmartTourButtons() {

    const start =
        document.getElementById(
            "smartStartBtn"
        );


    const previous =
        document.getElementById(
            "previousStopBtn"
        );


    const next =
        document.getElementById(
            "nextStopBtn"
        );


    if (start) {

        if (!smartTourStarted) {

            start.textContent =
                "▶️ Bắt đầu tham quan";

        } else {

            start.textContent =
                "▶️ Xem lại từ đầu";

        }

    }


    if (previous) {

        previous.disabled =
            !smartTourStarted ||
            smartTourIndex <= 0;

    }


    if (next) {

        next.disabled =
            !smartTourStarted ||
            smartTourIndex >=
            heritageData.length - 1;

    }

}


/* =========================================================
   KHỞI ĐỘNG LẠI BƯỚC 7
   ========================================================= */
function saveSmartTourProgress() {

    const data = {
        started: smartTourStarted,
        index: smartTourIndex,
        visitedIds:
            Array.from(
                visitedHeritageIds
            )
    };

    localStorage.setItem(
        SMART_TOUR_STORAGE_KEY,
        JSON.stringify(data)
    );

}
function loadSmartTourProgress() {

    try {

        const saved =
            localStorage.getItem(
                SMART_TOUR_STORAGE_KEY
            );

        if (!saved) {
            return;
        }

        const data =
            JSON.parse(saved);

        smartTourStarted =
            Boolean(data.started);

        smartTourIndex =
            Number.isInteger(data.index)
                ? data.index
                : -1;

        visitedHeritageIds =
            new Set(
                Array.isArray(data.visitedIds)
                    ? data.visitedIds
                    : []
            );

    } catch (error) {

        console.warn(
            "Không thể đọc tiến trình tham quan:",
            error
        );

    }

}
function resetSmartTour() {

    smartTourStarted =
        false;



smartTourIndex =
    -1;
visitedHeritageIds.clear();

localStorage.removeItem(
    SMART_TOUR_STORAGE_KEY
);
    updateSmartTourProgress();

    updateSmartTourButtons();


    /*
       Không xóa tuyến Bước 6.
       Chỉ bỏ trạng thái của Bước 7.
    */

    const status =
        document.getElementById(
            "tourStatus"
        );


    if (status) {

        status.textContent =
            "Chưa mở tuyến";

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function safeAttr(value) {

    return String(
        value ?? ""
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    );

}