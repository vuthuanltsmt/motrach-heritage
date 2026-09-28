import { supabase } from "./supabase-client.js";


/* =====================================================
   PHẦN TỬ GIAO DIỆN
===================================================== */

const pageTitle =
    document.getElementById("pageTitle");

const pageDescription =
    document.getElementById(
        "pageDescription"
    );

const adminStatus =
    document.getElementById(
        "adminStatus"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const refreshButton =
    document.getElementById(
        "refreshButton"
    );

const mediaCount =
    document.getElementById(
        "mediaCount"
    );

const mediaGrid =
    document.getElementById(
        "mediaGrid"
    );

const message =
    document.getElementById(
        "message"
    );

const imagesTab =
    document.getElementById(
        "imagesTab"
    );

const audioTab =
    document.getElementById(
        "audioTab"
    );

const videoTab =
    document.getElementById(
        "videoTab"
    );


/* =====================================================
   CHẾ ĐỘ HIỆN TẠI
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

let currentType =
    params.get("type") ||
    "images";

if (
    ![
        "images",
        "audio",
        "video"
    ].includes(currentType)
) {
    currentType = "images";
}


let currentUser = null;

let allFiles = [];

let postReferences = [];


/* =====================================================
   CẤU HÌNH TỪNG LOẠI
===================================================== */

const mediaConfig = {

    images: {

        title:
            "🖼️ Quản lý ảnh",

        description:
            "Ảnh đại diện và ảnh bổ sung trong các bài viết.",

        bucket:
            "post-images",

        folders: [
            "covers",
            "gallery"
        ]
    },


    audio: {

        title:
            "🎧 Quản lý Audio",

        description:
            "Các file MP3/M4A đã tải lên hệ thống.",

        bucket:
            "post-media",

        folders: [
            "audio"
        ]
    },


    video: {

        title:
            "🎬 Quản lý Video",

        description:
            "Các video MP4 đã tải lên hệ thống.",

        bucket:
            "post-media",

        folders: [
            "video"
        ]
    }

};


function getConfig() {

    return mediaConfig[
        currentType
    ];
}


/* =====================================================
   THÔNG BÁO
===================================================== */

function showMessage(
    text,
    type = "error"
) {

    message.textContent =
        text;

    message.style.color =
        type === "success"
            ? "#28734a"
            : "#b00020";
}


/* =====================================================
   HTML AN TOÀN
===================================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =====================================================
   HIỂN THỊ DUNG LƯỢNG
===================================================== */

function formatBytes(bytes) {

    const number =
        Number(bytes);


    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        return "";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let size =
        number;

    let unitIndex =
        0;


    while (
        size >= 1024 &&
        unitIndex <
            units.length - 1
    ) {

        size =
            size / 1024;

        unitIndex++;
    }


    return (
        size.toFixed(
            unitIndex === 0
                ? 0
                : 1
        ) +
        " " +
        units[unitIndex]
    );
}


/* =====================================================
   GIAO DIỆN THEO TYPE
===================================================== */

function setupPage() {

    const config =
        getConfig();


    pageTitle.textContent =
        config.title;

    pageDescription.textContent =
        config.description;


    imagesTab.classList
        .toggle(
            "active",
            currentType ===
                "images"
        );

    audioTab.classList
        .toggle(
            "active",
            currentType ===
                "audio"
        );

    videoTab.classList
        .toggle(
            "active",
            currentType ===
                "video"
        );


    document.title =
        config.title
            .replace(
                /^[^\s]+\s/,
                ""
            ) +
        " - Mộ Trạch Heritage";
}


/* =====================================================
   KIỂM TRA ADMIN
===================================================== */

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error
        } =
            await supabase.auth
                .getUser();


        if (
            error ||
            !user
        ) {

            window.location.href =
                "login.html";

            return false;
        }


        const {
            data: admin,
            error: adminError
        } =
            await supabase
                .from("admins")
                .select("user_id")
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (
            adminError ||
            !admin
        ) {

            await supabase.auth
                .signOut();

            window.location.href =
                "login.html";

            return false;
        }


        currentUser =
            user;


        adminStatus.textContent =
            "Đã đăng nhập: " +
            user.email;


        return true;


    } catch (error) {

        console.error(
            "Lỗi kiểm tra quản trị:",
            error
        );


        window.location.href =
            "login.html";


        return false;
    }
}


/* =====================================================
   TẢI DANH SÁCH BÀI
   DÙNG ĐỂ KIỂM TRA FILE
   CÓ ĐANG ĐƯỢC SỬ DỤNG KHÔNG
===================================================== */

async function loadPostReferences() {

    const {
        data,
        error
    } =
        await supabase
            .from("posts")
            .select(`
                id,
                title,
                cover_image_url,
                gallery_images,
                audio_url,
                video_url
            `);


    if (error) {

        console.warn(
            "Không đọc được tham chiếu bài viết:",
            error
        );

        postReferences = [];

        return;
    }


    postReferences =
        data || [];
}


/* =====================================================
   PUBLIC URL
===================================================== */

function getPublicUrl(
    bucket,
    path
) {

    const {
        data
    } =
        supabase.storage
            .from(bucket)
            .getPublicUrl(
                path
            );


    return data.publicUrl;
}


/* =====================================================
   ĐỌC FILE TRONG 1 THƯ MỤC
===================================================== */

async function listFolder(
    bucket,
    folder
) {

    const {
        data,
        error
    } =
        await supabase.storage
            .from(bucket)
            .list(
                folder,
                {
                    limit: 1000,

                    sortBy: {
                        column:
                            "created_at",

                        order:
                            "desc"
                    }
                }
            );


    if (error) {

        throw new Error(
            "Không thể đọc thư mục " +
            folder +
            ": " +
            error.message
        );
    }


    return (
        data || []
    )
        .filter(
            function (item) {

                /*
                    Folder trong Storage
                    không có metadata.
                */

                return Boolean(
                    item.metadata
                );
            }
        )
        .map(
            function (item) {

                const path =
                    folder +
                    "/" +
                    item.name;


                return {

                    name:
                        item.name,

                    folder:
                        folder,

                    path:
                        path,

                    bucket:
                        bucket,

                    url:
                        getPublicUrl(
                            bucket,
                            path
                        ),

                    size:
                        item.metadata
                            ?.size ||
                        0,

                    mimeType:
                        item.metadata
                            ?.mimetype ||
                        "",

                    createdAt:
                        item.created_at ||
                        item.updated_at ||
                        null
                };
            }
        );
}


/* =====================================================
   TẢI TOÀN BỘ FILE
===================================================== */

async function loadFiles() {

    const config =
        getConfig();


    mediaGrid.innerHTML = `
        <div class="state-box">

            <div class="state-icon">
                ⏳
            </div>

            Đang tải thư viện...

        </div>
    `;


    showMessage("");


    try {

        const results = [];


        for (
            const folder
            of config.folders
        ) {

            const files =
                await listFolder(
                    config.bucket,
                    folder
                );


            results.push(
                ...files
            );
        }


        allFiles =
            results.sort(
                function (
                    a,
                    b
                ) {

                    const dateA =
                        new Date(
                            a.createdAt ||
                            0
                        )
                            .getTime();

                    const dateB =
                        new Date(
                            b.createdAt ||
                            0
                        )
                            .getTime();


                    return (
                        dateB -
                        dateA
                    );
                }
            );


        renderFiles();


    } catch (error) {

        console.error(
            "Lỗi tải thư viện:",
            error
        );


        mediaGrid.innerHTML = `
            <div class="state-box">

                <div class="state-icon">
                    ⚠️
                </div>

                ${escapeHtml(
                    error.message ||
                    "Không thể tải thư viện."
                )}

            </div>
        `;
    }
}


/* =====================================================
   KIỂM TRA FILE ĐANG ĐƯỢC BÀI NÀO DÙNG
===================================================== */

function getPostsUsingFile(
    file
) {

    return postReferences.filter(
        function (post) {

            if (
                currentType ===
                "images"
            ) {

                if (
                    post.cover_image_url ===
                    file.url
                ) {
                    return true;
                }


                if (
                    Array.isArray(
                        post.gallery_images
                    ) &&
                    post.gallery_images
                        .includes(
                            file.url
                        )
                ) {
                    return true;
                }
            }


            if (
                currentType ===
                "audio" &&
                post.audio_url ===
                    file.url
            ) {
                return true;
            }


            if (
                currentType ===
                "video" &&
                post.video_url ===
                    file.url
            ) {
                return true;
            }


            return false;
        }
    );
}


/* =====================================================
   PREVIEW
===================================================== */

function createPreview(
    file
) {

    const safeUrl =
        escapeHtml(
            file.url
        );


    if (
        currentType ===
        "images"
    ) {

        return `
            <img
                src="${safeUrl}"
                alt="${escapeHtml(
                    file.name
                )}"
                loading="lazy"
            >
        `;
    }


    if (
        currentType ===
        "audio"
    ) {

        return `
            <audio
                controls
                preload="metadata"
                src="${safeUrl}"
            ></audio>
        `;
    }


    if (
        currentType ===
        "video"
    ) {

        return `
            <video
                controls
                preload="metadata"
                src="${safeUrl}"
            ></video>
        `;
    }


    return `
        <div class="media-icon">
            📁
        </div>
    `;
}


/* =====================================================
   HIỂN THỊ FILE
===================================================== */

function renderFiles() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        allFiles.filter(
            function (file) {

                if (!keyword) {
                    return true;
                }


                return (
                    file.name
                        .toLowerCase()
                        .includes(
                            keyword
                        ) ||

                    file.path
                        .toLowerCase()
                        .includes(
                            keyword
                        )
                );
            }
        );


    mediaCount.textContent =
        filtered.length +
        " tệp";


    if (
        filtered.length === 0
    ) {

        mediaGrid.innerHTML = `
            <div class="state-box">

                <div class="state-icon">
                    📭
                </div>

                Không tìm thấy tệp nào.

            </div>
        `;

        return;
    }


    mediaGrid.innerHTML =
        filtered.map(
            function (file) {

                const usedBy =
                    getPostsUsingFile(
                        file
                    );


                const usageText =
                    usedBy.length > 0
                        ? (
                            "Đang dùng trong " +
                            usedBy.length +
                            " bài"
                        )
                        : "Chưa được bài nào sử dụng";


                const sizeText =
                    formatBytes(
                        file.size
                    );


                return `
                    <article class="media-card">


                        <div class="media-preview">

                            ${createPreview(
                                file
                            )}

                        </div>


                        <div class="media-info">


                            <div class="media-name">
                                ${escapeHtml(
                                    file.name
                                )}
                            </div>


                            <div class="media-path">
                                ${escapeHtml(
                                    file.path
                                )}

                                ${
                                    sizeText
                                        ? "<br>" +
                                          escapeHtml(
                                              sizeText
                                          )
                                        : ""
                                }

                                <br>

                                ${
                                    usedBy.length > 0
                                        ? "🔗 "
                                        : "○ "
                                }

                                ${escapeHtml(
                                    usageText
                                )}

                            </div>


                            <div class="media-actions">


                                <a
                                    class="
                                        media-btn
                                        btn-open
                                    "
                                    href="${escapeHtml(
                                        file.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    👁️ Mở
                                </a>


                                <button
                                    class="
                                        media-btn
                                        btn-delete
                                    "
                                    type="button"
                                    data-delete-path="${escapeHtml(
                                        file.path
                                    )}"
                                >
                                    🗑️ Xóa
                                </button>


                            </div>


                        </div>

                    </article>
                `;
            }
        )
        .join("");


    attachDeleteEvents();
}


/* =====================================================
   XÓA FILE
===================================================== */

async function deleteFile(
    path,
    button
) {

    const config =
        getConfig();


    const file =
        allFiles.find(
            function (item) {

                return (
                    item.path ===
                    path
                );
            }
        );


    if (!file) {
        return;
    }


    /*
        Không cho xóa file
        đang được bài viết dùng.
    */

    const usedBy =
        getPostsUsingFile(
            file
        );


    if (
        usedBy.length > 0
    ) {

        const titles =
            usedBy
                .map(
                    function (post) {

                        return (
                            "• " +
                            post.title
                        );
                    }
                )
                .join("\n");


        window.alert(
            "Không thể xóa file này vì đang được sử dụng trong bài viết:\n\n" +
            titles +
            "\n\nHãy sửa hoặc xóa bài viết trước."
        );


        return;
    }


    const confirmed =
        window.confirm(
            "Bạn có chắc muốn xóa file này?\n\n" +
            file.name +
            "\n\nThao tác này không thể hoàn tác."
        );


    if (!confirmed) {
        return;
    }


    button.disabled =
        true;

    button.textContent =
        "Đang xóa...";


    try {

        const {
            error
        } =
            await supabase.storage
                .from(
                    config.bucket
                )
                .remove([
                    file.path
                ]);


        if (error) {
            throw error;
        }


        allFiles =
            allFiles.filter(
                function (item) {

                    return (
                        item.path !==
                        file.path
                    );
                }
            );


        renderFiles();


        showMessage(
            "✅ Đã xóa file.",
            "success"
        );


    } catch (error) {

        console.error(
            "Lỗi xóa file:",
            error
        );


        showMessage(
            error.message ||
            "Không thể xóa file."
        );


        button.disabled =
            false;

        button.textContent =
            "🗑️ Xóa";
    }
}


/* =====================================================
   NÚT XÓA
===================================================== */

function attachDeleteEvents() {

    const buttons =
        document.querySelectorAll(
            "[data-delete-path]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    deleteFile(
                        button.dataset
                            .deletePath,
                        button
                    );
                }
            );
        }
    );
}


/* =====================================================
   TÌM KIẾM
===================================================== */

searchInput.addEventListener(
    "input",
    renderFiles
);


/* =====================================================
   LÀM MỚI
===================================================== */

refreshButton.addEventListener(
    "click",
    async function () {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "⏳ Đang tải...";


        await loadPostReferences();

        await loadFiles();


        refreshButton.disabled =
            false;

        refreshButton.textContent =
            "🔄 Làm mới";
    }
);


/* =====================================================
   KHỞI ĐỘNG
===================================================== */

async function init() {

    setupPage();


    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    await loadPostReferences();

    await loadFiles();
}


init();