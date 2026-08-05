document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(location.search);

    let id = parseInt(params.get("id"));

    if (isNaN(id)) {
        id = 1;
    }

    fetch("../data/heritage.json")
        .then(response => {

            if (!response.ok) {
                throw new Error("Không thể tải heritage.json");
            }

            return response.json();
        })

        .then(data => {

            const place = data.find(
                item => Number(item.id) === id
            );

            if (!place) {
                document.body.innerHTML =
                    "<h2>Không tìm thấy di tích!</h2>";
                return;
            }


            /* =========================
               THÔNG TIN
            ========================= */

            const cover = document.getElementById("cover");

            if (cover) {
                cover.src = "../" + place.image;
                cover.alt = place.name;
            }

            function text(id, value) {

                const el = document.getElementById(id);

                if (el) {
                    el.textContent = value || "";
                }
            }

            text("name", place.name);
            text("type", place.type);
            text("year", place.year);
            text("rank", place.rank);
            text("address", place.address);
            text("description", place.description);
            text("history", place.history);
            text("audio-name", place.name);


            /* =========================
               AUDIO THUYẾT MINH
            ========================= */

            const audio =
                document.getElementById("audio-player");

            if (audio && place.audio) {

                const audioURL =
                    new URL(
                        "../" + place.audio,
                        window.location.href
                    ).href;

                console.log(
                    "Đường dẫn audio:",
                    audioURL
                );

                audio.src = audioURL;

                audio.load();

                audio.onerror = function () {

                    console.error(
                        "Không tải được file audio:",
                        audioURL
                    );

                };
            }


            /* =========================
               VIDEO
            ========================= */

            const video =
                document.getElementById("video-player");

            if (video && place.video) {

                const videoURL =
                    new URL(
                        "../" + place.video,
                        window.location.href
                    ).href;

                console.log(
                    "Đường dẫn video:",
                    videoURL
                );

                video.src = videoURL;

                video.load();
            }


            /* =========================
               THƯ VIỆN ẢNH
            ========================= */

            const thumbs =
                document.getElementById("thumbs");

            const mainPhoto =
                document.getElementById("main-photo");

            const photoIndex =
                document.getElementById("photo-index");

            const photoTotal =
                document.getElementById("photo-total");

            const prev =
                document.getElementById("prev");

            const next =
                document.getElementById("next");


            if (
                thumbs &&
                mainPhoto &&
                Array.isArray(place.gallery) &&
                place.gallery.length > 0
            ) {

                let current = 0;

                thumbs.innerHTML = "";

                photoTotal.textContent =
                    place.gallery.length;


                function showPhoto(index) {

                    current = index;

                    const photo =
                        place.gallery[index];

                    mainPhoto.src =
                        "../" + photo.image;

                    mainPhoto.alt =
                        photo.caption || place.name;

                    photoIndex.textContent =
                        index + 1;


                    thumbs
                        .querySelectorAll("img")
                        .forEach(img => {

                            img.classList.remove("active");

                        });


                    if (thumbs.children[index]) {

                        thumbs.children[index]
                            .classList.add("active");

                    }
                }


                place.gallery.forEach(
                    (photo, index) => {

                        const img =
                            document.createElement("img");

                        img.src =
                            "../" + photo.image;

                        img.alt =
                            photo.caption || "";

                        img.title =
                            photo.caption || "";

                        img.addEventListener(
                            "click",
                            () => showPhoto(index)
                        );

                        thumbs.appendChild(img);
                    }
                );


                if (prev) {

                    prev.onclick = function () {

                        current--;

                        if (current < 0) {
                            current =
                                place.gallery.length - 1;
                        }

                        showPhoto(current);
                    };
                }


                if (next) {

                    next.onclick = function () {

                        current++;

                        if (
                            current >=
                            place.gallery.length
                        ) {
                            current = 0;
                        }

                        showPhoto(current);
                    };
                }


                showPhoto(0);


                /* =========================
                   LIGHTBOX
                ========================= */

                const lightbox =
                    document.getElementById("lightbox");

                const lightboxImg =
                    document.getElementById("lightbox-img");

                const caption =
                    document.getElementById("caption");

                const close =
                    document.getElementById("close");


                if (mainPhoto && lightbox) {

                    mainPhoto.onclick = function () {

                        lightbox.style.display =
                            "flex";

                        lightboxImg.src =
                            mainPhoto.src;

                        caption.textContent =
                            place.gallery[current]
                                .caption || "";
                    };
                }


                if (close && lightbox) {

                    close.onclick = function () {

                        lightbox.style.display =
                            "none";
                    };


                    lightbox.onclick =
                        function (event) {

                            if (
                                event.target ===
                                lightbox
                            ) {

                                lightbox.style.display =
                                    "none";
                            }
                        };
                }

            }


            /* =========================
               BẢN ĐỒ
            ========================= */

            const mapElement =
                document.getElementById("map");


            if (
                mapElement &&
                typeof L !== "undefined" &&
                place.lat &&
                place.lng
            ) {

                const map =
                    L.map("map").setView(
                        [
                            Number(place.lat),
                            Number(place.lng)
                        ],
                        17
                    );


                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        attribution:
                            "&copy; OpenStreetMap contributors"
                    }
                ).addTo(map);


                L.marker([
                    Number(place.lat),
                    Number(place.lng)
                ])
                .addTo(map)
                .bindPopup(place.name)
                .openPopup();

            }

        })

        .catch(error => {

            console.error(error);

            alert(
                "Có lỗi khi tải dữ liệu. " +
                error.message
            );

        });

});