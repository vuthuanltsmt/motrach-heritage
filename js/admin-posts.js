import { supabase } from "./supabase-client.js";


const adminStatus =
    document.getElementById("adminStatus");

const postsBody =
    document.getElementById("postsBody");

const message =
    document.getElementById("message");

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );


let currentUser = null;
let allPosts = [];
let currentFilter = "all";


/* =========================================
   THÔNG BÁO
========================================= */

function showMessage(
    text,
    type = "error"
) {

    message.textContent = text;

    message.style.color =
        type === "success"
            ? "#28734a"
            : "#b00020";
}


/* =========================================
   CHỐNG CHÈN HTML
========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   ĐỊNH DẠNG NGÀY
========================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }


    return new Intl.DateTimeFormat(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


/* =========================================
   KIỂM TRA ADMIN
========================================= */

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


        currentUser = user;


        adminStatus.textContent =
            "Đã đăng nhập: " +
            user.email;


        return true;


    } catch (error) {

        console.error(
            "Lỗi kiểm tra Admin:",
            error
        );


        window.location.href =
            "login.html";


        return false;
    }
}


/* =========================================
   TẢI DANH SÁCH BÀI
========================================= */

async function loadPosts() {

    postsBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="loading-state"
            >
                <div class="state-icon">
                    ⏳
                </div>

                Đang tải danh sách bài...
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("posts")
                .select(`
                    id,
                    title,
                    slug,
                    status,
                    created_at,
                    updated_at,
                    published_at,
                    cover_image_url,
                    gallery_images,
                    audio_url,
                    video_url
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        allPosts =
            data || [];


        renderPosts();


    } catch (error) {

        console.error(
            "Lỗi tải danh sách bài:",
            error
        );


        postsBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-state"
                >
                    <div class="state-icon">
                        ⚠️
                    </div>

                    Không thể tải danh sách bài.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   HIỂN THỊ DANH SÁCH
========================================= */

function renderPosts() {

    let posts =
        allPosts;


    if (
        currentFilter !== "all"
    ) {

        posts =
            allPosts.filter(
                function (post) {

                    return (
                        post.status ===
                        currentFilter
                    );
                }
            );
    }


    if (
        posts.length === 0
    ) {

        postsBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-state"
                >
                    <div class="state-icon">
                        📭
                    </div>

                    Chưa có bài viết
                    trong mục này.
                </td>
            </tr>
        `;

        return;
    }


    postsBody.innerHTML =
        posts.map(
            function (post) {

                const title =
                    escapeHtml(
                        post.title
                    );


                const slug =
                    escapeHtml(
                        post.slug
                    );


                let statusHtml = "";


                if (
                    post.status ===
                    "published"
                ) {

                    statusHtml = `
                        <span
                            class="
                                status
                                status-published
                            "
                        >
                            ✅ Đã đăng
                        </span>
                    `;

                } else {

                    statusHtml = `
                        <span
                            class="
                                status
                                status-draft
                            "
                        >
                            📝 Bản nháp
                        </span>
                    `;
                }


                let viewButton = "";


                if (
                    post.status ===
                    "published"
                ) {

                    viewButton = `
                        <a
                            class="
                                action-btn
                                btn-view
                            "
                            href="../pages/post.html?slug=${
                                encodeURIComponent(
                                    post.slug
                                )
                            }"
                            target="_blank"
                        >
                            👁️ Xem
                        </a>
                    `;
                }


                return `
                    <tr>

                        <td>

                            <div class="post-title">
                                ${title}
                            </div>

                            <div class="post-slug">
                                ${slug}
                            </div>

                        </td>


                        <td>
                            ${statusHtml}
                        </td>


                        <td>
                            ${formatDate(
                                post.created_at
                            )}
                        </td>


                        <td>
                            ${formatDate(
                                post.updated_at
                            )}
                        </td>


                        <td>

                            <div class="actions">

                                ${viewButton}

                                <button
                                    class="
                                        action-btn
                                        btn-edit
                                    "
                                    type="button"
                                    data-edit-id="${
                                        post.id
                                    }"
                                >
                                    ✏️ Sửa
                                </button>

                                <button
                                    class="
                                        action-btn
                                        btn-delete
                                    "
                                    type="button"
                                    data-delete-id="${
                                        post.id
                                    }"
                                >
                                    🗑️ Xóa
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    attachActionEvents();
}


/* =========================================
   BỘ LỌC
========================================= */

filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons
                    .forEach(
                        function (item) {

                            item.classList
                                .remove(
                                    "active"
                                );
                        }
                    );


                button.classList
                    .add(
                        "active"
                    );


                currentFilter =
                    button.dataset.status;


                renderPosts();
            }
        );
    }
);


/* =========================================
   LẤY ĐƯỜNG DẪN FILE TỪ PUBLIC URL
========================================= */

function getStoragePath(
    publicUrl,
    bucket
) {

    if (!publicUrl) {
        return null;
    }


    const marker =
        "/storage/v1/object/public/" +
        bucket +
        "/";


    const index =
        publicUrl.indexOf(
            marker
        );


    if (index === -1) {
        return null;
    }


    let path =
        publicUrl.substring(
            index +
            marker.length
        );


    path =
        path.split("?")[0];


    try {

        return decodeURIComponent(
            path
        );

    } catch {

        return path;
    }
}


/* =========================================
   DỌN FILE STORAGE CỦA BÀI
========================================= */

async function removePostFiles(
    post
) {

    const imagePaths = [];
    const mediaPaths = [];


    const coverPath =
        getStoragePath(
            post.cover_image_url,
            "post-images"
        );


    if (coverPath) {

        imagePaths.push(
            coverPath
        );
    }


    if (
        Array.isArray(
            post.gallery_images
        )
    ) {

        post.gallery_images
            .forEach(
                function (url) {

                    const path =
                        getStoragePath(
                            url,
                            "post-images"
                        );


                    if (path) {

                        imagePaths.push(
                            path
                        );
                    }
                }
            );
    }


    const audioPath =
        getStoragePath(
            post.audio_url,
            "post-media"
        );


    if (audioPath) {

        mediaPaths.push(
            audioPath
        );
    }


    const videoPath =
        getStoragePath(
            post.video_url,
            "post-media"
        );


    if (videoPath) {

        mediaPaths.push(
            videoPath
        );
    }


    if (
        imagePaths.length > 0
    ) {

        const {
            error
        } =
            await supabase.storage
                .from(
                    "post-images"
                )
                .remove(
                    imagePaths
                );


        if (error) {

            console.warn(
                "Không xóa được một số ảnh:",
                error
            );
        }
    }


    if (
        mediaPaths.length > 0
    ) {

        const {
            error
        } =
            await supabase.storage
                .from(
                    "post-media"
                )
                .remove(
                    mediaPaths
                );


        if (error) {

            console.warn(
                "Không xóa được một số media:",
                error
            );
        }
    }
}


/* =========================================
   XÓA BÀI
========================================= */

async function deletePost(
    postId,
    button
) {

    const post =
        allPosts.find(
            function (item) {

                return (
                    item.id ===
                    postId
                );
            }
        );


    if (!post) {
        return;
    }


    const confirmed =
        window.confirm(
            'Bạn có chắc muốn xóa bài "' +
            post.title +
            '"?\n\n' +
            "Bài viết và các file liên quan sẽ bị xóa."
        );


    if (!confirmed) {
        return;
    }


    button.disabled = true;

    button.textContent =
        "Đang xóa...";


    showMessage("");


    try {

        /*
            Xóa bài trong Database trước.
        */

        const {
            error
        } =
            await supabase
                .from("posts")
                .delete()
                .eq(
                    "id",
                    postId
                );


        if (error) {
            throw error;
        }


        /*
            Sau khi Database đã xóa,
            dọn các file liên quan.
        */

        await removePostFiles(
            post
        );


        allPosts =
            allPosts.filter(
                function (item) {

                    return (
                        item.id !==
                        postId
                    );
                }
            );


        renderPosts();


        showMessage(
            "✅ Đã xóa bài viết.",
            "success"
        );


    } catch (error) {

        console.error(
            "Lỗi xóa bài:",
            error
        );


        showMessage(
            error.message ||
            "Không thể xóa bài viết."
        );


        button.disabled =
            false;

        button.textContent =
            "🗑️ Xóa";
    }
}


/* =========================================
   SỰ KIỆN CÁC NÚT
========================================= */

function attachActionEvents() {

    const deleteButtons =
        document.querySelectorAll(
            "[data-delete-id]"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    deletePost(
                        button.dataset
                            .deleteId,
                        button
                    );
                }
            );
        }
    );


   const editButtons =
    document.querySelectorAll(
        "[data-edit-id]"
    );


editButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const postId =
                    button.dataset.editId;

                window.location.href =
                    "write.html?id=" +
                    encodeURIComponent(
                        postId
                    );
            }
        );
    }
);

}


/* =========================================
   KHỞI ĐỘNG
========================================= */

async function init() {

    const isAdmin =
        await checkAdmin();

    if (!isAdmin) {
        return;
    }

    await loadPosts();
}

init();