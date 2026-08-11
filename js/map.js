// =====================================================
// MỘ TRẠCH HERITAGE
// BẢN ĐỒ DI SẢN
// =====================================================

let map;
let heritageData = [];
let markers = [];
let myLocationMarker = null;


// =====================================================
// KHỞI TẠO BẢN ĐỒ
// =====================================================

function initMap() {

    map = L.map("map").setView(
        [20.943250, 106.365350],
        16
    );

    // Bản đồ OpenStreetMap
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

    loadHeritage();
}


// =====================================================
// ĐỌC DỮ LIỆU heritage.json
// =====================================================

async function loadHeritage() {

    try {

        const response = await fetch("../data/heritage.json");

        if (!response.ok) {
            throw new Error(
                "Không thể tải heritage.json"
            );
        }

        heritageData = await response.json();

        console.log(
            "Đã tải dữ liệu:",
            heritageData
        );

        displayMarkers();

        displayPlaceCards();

    } catch (error) {

        console.error(error);

        document.getElementById("places").innerHTML = `
            <div style="
                background:#fff;
                padding:20px;
                border-radius:12px;
                color:#a00000;
            ">
                ❌ Không thể tải dữ liệu di tích.
                <br><br>
                Hãy kiểm tra file:
                <strong>data/heritage.json</strong>
            </div>
        `;
    }
}


// =====================================================
// HIỂN THỊ MARKER
// =====================================================

function displayMarkers() {

    markers.forEach(marker => {
        map.removeLayer(marker);
    });

    markers = [];

    heritageData.forEach(place => {

        if (
            typeof place.lat !== "number" ||
            typeof place.lng !== "number"
        ) {
            return;
        }

        const marker = L.marker([
            place.lat,
            place.lng
        ]).addTo(map);

        const image =
            place.image
                ? "../" + place.image
                : "";

        const detailLink =
            `detail.html?id=${place.id}`;

        const googleMapLink =
            `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

        marker.bindPopup(`
            <div style="width:230px">

                ${
                    image
                    ? `
                    <img
                        src="${image}"
                        class="popup-image"
                        onerror="this.style.display='none'"
                    >
                    `
                    : ""
                }

                <div class="popup-title">
                    ${place.name}
                </div>

                <div>
                    ${place.type || ""}
                </div>

                <div style="
                    margin-top:6px;
                    font-size:13px;
                ">
                    📍 ${place.address || ""}
                </div>

                <a
                    href="${detailLink}"
                    class="popup-btn"
                >
                    Xem chi tiết →
                </a>

                <a
                    href="${googleMapLink}"
                    target="_blank"
                    class="popup-direction"
                >
                    🧭 Chỉ đường
                </a>

            </div>
        `);

        markers.push(marker);
    });
}


// =====================================================
// HIỂN THỊ DANH SÁCH DI TÍCH
// =====================================================

function displayPlaceCards() {

    const container =
        document.getElementById("places");

    if (!heritageData.length) {

        container.innerHTML = `
            <p>Chưa có dữ liệu di tích.</p>
        `;

        return;
    }

    container.innerHTML = "";

    heritageData.forEach(place => {

        const image =
            place.image
                ? "../" + place.image
                : "";

        const detailLink =
            `detail.html?id=${place.id}`;

        const googleMapLink =
            `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

        const card =
            document.createElement("div");

        card.className =
            "place-card";

        card.innerHTML = `

            ${
                image
                ? `
                <img
                    src="${image}"
                    alt="${place.name}"
                    onerror="
                        this.style.display='none'
                    "
                >
                `
                : ""
            }

            <div class="place-content">

                <h3>
                    ${place.name}
                </h3>

                <div class="place-type">
                    ${place.type || ""}
                </div>

                <div class="place-address">
                    📍 ${place.address || ""}
                </div>

                <div class="card-buttons">

                    <a
                        href="${detailLink}"
                    >
                        📖 Xem chi tiết
                    </a>

                    <a
                        href="${googleMapLink}"
                        target="_blank"
                    >
                        🧭 Chỉ đường
                    </a>

                    <a
                        href="#"
                        onclick="
                            focusPlace(${place.id});
                            return false;
                        "
                    >
                        📍 Xem trên bản đồ
                    </a>

                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


// =====================================================
// FOCUS VÀO MỘT DI TÍCH
// =====================================================

function focusPlace(id) {

    const place =
        heritageData.find(
            item => Number(item.id) === Number(id)
        );

    if (!place) {
        return;
    }

    map.setView(
        [place.lat, place.lng],
        18,
        {
            animate: true
        }
    );

    const marker =
        markers.find(marker => {

            const position =
                marker.getLatLng();

            return (
                Math.abs(
                    position.lat - place.lat
                ) < 0.000001 &&
                Math.abs(
                    position.lng - place.lng
                ) < 0.000001
            );
        });

    if (marker) {
        marker.openPopup();
    }
}


// =====================================================
// XEM TOÀN BỘ DI TÍCH
// =====================================================

function showAllPlaces() {

    if (!markers.length) {
        return;
    }

    const group =
        L.featureGroup(markers);

    map.fitBounds(
        group.getBounds().pad(0.2)
    );
}


// =====================================================
// LẤY VỊ TRÍ HIỆN TẠI
// =====================================================

function findMyLocation() {

    if (!navigator.geolocation) {

        alert(
            "Thiết bị của bạn không hỗ trợ định vị."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;

            // Xóa marker cũ
            if (myLocationMarker) {
                map.removeLayer(
                    myLocationMarker
                );
            }

            // Tạo marker vị trí hiện tại
            myLocationMarker =
                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(
                        "📍 Vị trí hiện tại của bạn"
                    )
                    .openPopup();

            map.setView(
                [lat, lng],
                17
            );

        },

        function(error) {

            let message =
                "Không thể xác định vị trí.";

            if (error.code === 1) {
                message =
                    "Bạn chưa cho phép website sử dụng vị trí.";
            }

            if (error.code === 2) {
                message =
                    "Không xác định được vị trí.";
            }

            if (error.code === 3) {
                message =
                    "Quá thời gian xác định vị trí.";
            }

            alert(message);
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


// =====================================================
// KHỞI ĐỘNG
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initMap();

    }
);