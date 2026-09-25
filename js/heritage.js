"use strict";

/* =========================================================
   MỘ TRẠCH HERITAGE
   HERITAGE.JS

   URL chuẩn:

   Lăng Thần
   detail.html?id=lang-than

   Văn Miếu
   detail.html?id=van-mieu-mo-trach

   Đình làng
   detail.html?id=dinh-lang-mo-trach
   ========================================================= */


let heritageData = [];


/* =========================================================
   KHỞI ĐỘNG
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "================================"
        );

        console.log(
            "HERITAGE.JS ĐÃ KHỞI ĐỘNG"
        );

        console.log(
            "================================"
        );

        loadHeritage();

    }
);


/* =========================================================
   TẢI DỮ LIỆU
   ========================================================= */

async function loadHeritage() {

    try {

        const response =
            await fetch(
                "../data/heritage.json?v=" +
                Date.now(),
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


        const data =
            await response.json();


        heritageData =
            Array.isArray(data)
                ? data
                : (
                    data.heritage ||
                    data.items ||
                    data.data ||
                    []
                );


        console.log(
            "Đã tải:",
            heritageData.length,
            "di tích"
        );


        renderHeritage(
            heritageData
        );


        setupSearch();


    }
    catch (error) {

        console.error(
            "Lỗi tải heritage.json:",
            error
        );


        const container =
            document.getElementById(
                "heritage-container"
            );


        if (container) {

            container.innerHTML = `

                <div style="
                    padding:30px;
                    text-align:center;
                    color:#a40000;
                ">

                    ❌ Không thể tải dữ liệu di tích.

                </div>

            `;

        }

    }

}


/* =========================================================
   LẤY SLUG
   ========================================================= */

function getHeritageSlug(item) {

    /*
       Ưu tiên slug đã khai báo
       trong heritage.json
    */

    if (item.slug) {

        return String(
            item.slug
        ).trim();

    }


    /*
       Nếu chưa có slug thì
       tự tạo từ tên
    */

    let slug =
        String(
            item.name ||
            ""
        )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /đ/g,
            "d"
        )
        .replace(
            /Đ/g,
            "D"
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );


    /*
       Chốt 3 slug chính
    */

    if (
        slug === "lang-than-vu-hon"
    ) {

        return "lang-than";

    }


    if (
        slug === "lang-than"
    ) {

        return "lang-than";

    }


    if (
        slug === "van-mieu-mo-trach"
    ) {

        return "van-mieu-mo-trach";

    }


    if (
        slug === "dinh-lang-mo-trach"
    ) {

        return "dinh-lang-mo-trach";

    }


    return slug;

}


/* =========================================================
   TẠO URL CHI TIẾT
   ========================================================= */

function getDetailUrl(item) {

    const slug =
        getHeritageSlug(
            item
        );


    return (
        "pages/detail.html?id=" +
        encodeURIComponent(slug)
    );

}


/* =========================================================
   HIỂN THỊ DANH SÁCH
   ========================================================= */

function renderHeritage(
    list
) {

    const container =
        document.getElementById(
            "heritage-container"
        );


    if (!container) {

        console.warn(
            "Không tìm thấy #heritage-container"
        );

        return;

    }


    if (!list.length) {

        container.innerHTML = `

            <div style="
                padding:30px;
                text-align:center;
            ">

                Chưa có dữ liệu di tích.

            </div>

        `;

        return;

    }


    container.innerHTML =
        list.map(
            function (item) {

                const slug =
                    getHeritageSlug(
                        item
                    );


                const url =
                    getDetailUrl(
                        item
                    );


                const image =
                    getImagePath(
                        item.image
                    );


                return `

                    <article
                        class="card"
                    >

                        <a
                            href="${escapeHtml(url)}"
                            class="card-link"
                        >

                            ${
                                image
                                ?
                                `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(item.name)}"
                                    class="card-image"
                                >
                                `
                                :
                                `
                                <div
                                    class="card-image"
                                    style="
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:60px;
                                    "
                                >
                                    🏛️
                                </div>
                                `
                            }


                            <div class="card-body">

                                <div class="card-type">

                                    ${escapeHtml(
                                        item.type ||
                                        "Di tích"
                                    )}

                                </div>


                                <h3>

                                    ${escapeHtml(
                                        item.name ||
                                        "Di tích Mộ Trạch"
                                    )}

                                </h3>


                                ${
                                    item.subtitle
                                    ?
                                    `
                                    <p>
                                        ${escapeHtml(
                                            item.subtitle
                                        )}
                                    </p>
                                    `
                                    :
                                    ""
                                }


                                <div
                                    class="card-button"
                                >

                                    🔎 Xem chi tiết

                                </div>

                            </div>

                        </a>

                    </article>

                `;

            }
        )
        .join("");


    console.log(
        "Đã tạo danh sách:",
        list.map(
            function (item) {

                return {
                    name: item.name,
                    slug: getHeritageSlug(item),
                    url: getDetailUrl(item)
                };

            }
        )
    );

}


/* =========================================================
   ĐƯỜNG DẪN ẢNH
   ========================================================= */

function getImagePath(
    value
) {

    if (!value) {

        return "";

    }


    let path =
        String(value)
            .trim();


    if (
        path.startsWith(
            "http://"
        ) ||
        path.startsWith(
            "https://"
        )
    ) {

        return path;

    }


    if (
        path.startsWith(
            "../"
        )
    ) {

        return path;

    }


    if (
        path.startsWith(
            "images/"
        )
    ) {

        return path;

    }


    return "images/" + path;

}


/* =========================================================
   TÌM KIẾM
   ========================================================= */

function setupSearch() {

    const search =
        document.getElementById(
            "search"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        function () {

            const keyword =
                search.value
                    .trim()
                    .toLowerCase();


            const filtered =
                heritageData.filter(
                    function (item) {

                        return (

                            String(
                                item.name ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                            ||

                            String(
                                item.type ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                            ||

                            String(
                                item.subtitle ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                        );

                    }
                );


            renderHeritage(
                filtered
            );

        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

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