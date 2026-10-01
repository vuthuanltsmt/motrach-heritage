import { supabase } from "./supabase-client.js";


/* =====================================================
   PHẦN TỬ TRÊN TRANG
===================================================== */

const postForm =
    document.getElementById("postForm");

const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");

const excerptInput =
    document.getElementById("excerpt");

const contentInput =
    document.getElementById("content");

const coverImageInput =
    document.getElementById("coverImage");

const galleryImagesInput =
    document.getElementById("galleryImages");

const audioFileInput =
    document.getElementById("audioFile");

const videoFileInput =
    document.getElementById("videoFile");

const coverPreview =
    document.getElementById("coverPreview");

const galleryPreview =
    document.getElementById("galleryPreview");

const audioName =
    document.getElementById("audioName");

const videoName =
    document.getElementById("videoName");

const message =
    document.getElementById("message");

const adminStatus =
    document.getElementById("adminStatus");

const saveDraftButton =
    document.getElementById("saveDraftButton");

const publishButton =
    document.getElementById("publishButton");

const pageHeading =
    document.querySelector(".page-title h2");

const pageSubtitle =
    document.querySelector(".page-title p");


/* =====================================================
   TRẠNG THÁI
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

let currentPostId =
    params.get("id");

let currentUser = null;

let existingPost = null;

let slugEditedManually = false;


/* =====================================================
   THÔNG BÁO
===================================================== */

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


/* =====================================================
   GIAO DIỆN NÚT
===================================================== */

function refreshButtonLabels() {

    saveDraftButton.textContent =
        "💾 Lưu bản nháp";


    if (
        existingPost &&
        existingPost.status ===
            "published"
    ) {

        publishButton.textContent =
            "✅ Cập nhật bài đã đăng";

    } else {

        publishButton.textContent =
            "🚀 Đăng bài";
    }
}


function setLoading(
    loading,
    mode = "publish"
) {

    saveDraftButton.disabled =
        loading;

    publishButton.disabled =
        loading;


    if (loading) {

        if (mode === "draft") {

            saveDraftButton.textContent =
                "⏳ Đang lưu...";

        } else {

            publishButton.textContent =
                "⏳ Đang cập nhật...";
        }

    } else {

        refreshButtonLabels();
    }
}


/* =====================================================
   TẠO SLUG
===================================================== */

function createSlug(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(/đ/g, "d")
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .trim()
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        );
}


titleInput.addEventListener(
    "input",
    function () {

        if (!slugEditedManually) {

            slugInput.value =
                createSlug(
                    titleInput.value
                );
        }
    }
);


slugInput.addEventListener(
    "input",
    function () {

        slugEditedManually =
            slugInput.value.trim() !== "";
    }
);


/* =====================================================
   TÊN FILE AN TOÀN
===================================================== */

function sanitizeFileName(
    fileName
) {

    const dotIndex =
        fileName.lastIndexOf(".");


    const originalName =
        dotIndex >= 0
            ? fileName.substring(
                0,
                dotIndex
            )
            : fileName;


    const extension =
        dotIndex >= 0
            ? fileName.substring(
                dotIndex
            ).toLowerCase()
            : "";


    let safeName =
        createSlug(
            originalName
        );


    if (!safeName) {
        safeName = "file";
    }


    return (
        safeName +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8) +
        extension
    );
}


/* =====================================================
   LẤY TÊN FILE TỪ URL
===================================================== */

function getFileNameFromUrl(url) {

    if (!url) {
        return "";
    }

    try {

        const clean =
            url.split("?")[0];

        return decodeURIComponent(
            clean.substring(
                clean.lastIndexOf("/") + 1
            )
        );

    } catch {

        return "File hiện tại";
    }
}


/* =====================================================
   LẤY PATH STORAGE TỪ PUBLIC URL
===================================================== */

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


/* =====================================================
   XÓA 1 FILE STORAGE CŨ
===================================================== */

async function removeStoredFile(
    bucket,
    publicUrl
) {

    const path =
        getStoragePath(
            publicUrl,
            bucket
        );


    if (!path) {
        return;
    }


    const {
        error
    } =
        await supabase.storage
            .from(bucket)
            .remove([path]);


    if (error) {

        console.warn(
            "Không thể xóa file cũ:",
            error
        );
    }
}


/* =====================================================
   UPLOAD 1 FILE
===================================================== */

async function uploadFile(
    bucket,
    file,
    folder
) {

    if (!file) {
        return null;
    }


    const safeFileName =
        sanitizeFileName(
            file.name
        );


    const filePath =
        folder +
        "/" +
        safeFileName;


    const {
        error
    } =
        await supabase.storage
            .from(bucket)
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        throw new Error(
            "Không thể tải file " +
            file.name +
            ": " +
            error.message
        );
    }


    const {
        data
    } =
        supabase.storage
            .from(bucket)
            .getPublicUrl(
                filePath
            );


    return data.publicUrl;
}


/* =====================================================
   UPLOAD NHIỀU ẢNH
===================================================== */

async function uploadGallery(
    files
) {

    const urls = [];


    for (
        const file of files
    ) {

        const url =
            await uploadFile(
                "post-images",
                file,
                "gallery"
            );


        if (url) {
            urls.push(url);
        }
    }


    return urls;
}


/* =====================================================
   KIỂM TRA KÍCH THƯỚC FILE
===================================================== */

function validateFiles() {

    const cover =
        coverImageInput.files[0];


    if (
        cover &&
        cover.size >
            10 * 1024 * 1024
    ) {

        throw new Error(
            "Ảnh đại diện vượt quá 10 MB."
        );
    }


    const galleryFiles =
        Array.from(
            galleryImagesInput.files
        );


    for (
        const file of galleryFiles
    ) {

        if (
            file.size >
            10 * 1024 * 1024
        ) {

            throw new Error(
                "Ảnh " +
                file.name +
                " vượt quá 10 MB."
            );
        }
    }


    const audio =
        audioFileInput.files[0];


    if (
        audio &&
        audio.size >
            50 * 1024 * 1024
    ) {

        throw new Error(
            "Audio vượt quá 50 MB."
        );
    }


    const video =
        videoFileInput.files[0];


    if (
        video &&
        video.size >
            50 * 1024 * 1024
    ) {

        throw new Error(
            "Video vượt quá 50 MB."
        );
    }
}


/* =====================================================
   HIỂN THỊ ẢNH ĐẠI DIỆN CŨ
===================================================== */

function renderExistingCover() {

    coverPreview.innerHTML = "";


    if (
        !existingPost ||
        !existingPost.cover_image_url
    ) {
        return;
    }


    const image =
        document.createElement("img");


    image.src =
        existingPost.cover_image_url;

    image.alt =
        "Ảnh đại diện hiện tại";


    coverPreview.appendChild(
        image
    );
}


/* =====================================================
   PREVIEW ẢNH ĐẠI DIỆN MỚI
===================================================== */

coverImageInput.addEventListener(
    "change",
    function () {

        coverPreview.innerHTML = "";


        const file =
            coverImageInput.files[0];


        if (!file) {

            renderExistingCover();

            return;
        }


        const image =
            document.createElement("img");


        const objectUrl =
            URL.createObjectURL(
                file
            );


        image.src =
            objectUrl;


        image.onload =
            function () {

                URL.revokeObjectURL(
                    objectUrl
                );
            };


        coverPreview.appendChild(
            image
        );
    }
);


/* =====================================================
   PREVIEW GALLERY CŨ + MỚI
===================================================== */

function renderGalleryPreview() {

    galleryPreview.innerHTML = "";


    const oldImages =
        existingPost &&
        Array.isArray(
            existingPost.gallery_images
        )
            ? existingPost.gallery_images
            : [];


    oldImages.forEach(
        function (url) {

            const image =
                document.createElement(
                    "img"
                );

            image.src = url;

            image.alt =
                "Ảnh hiện tại";

            galleryPreview.appendChild(
                image
            );
        }
    );


    const newFiles =
        Array.from(
            galleryImagesInput.files
        );


    newFiles.forEach(
        function (file) {

            const image =
                document.createElement(
                    "img"
                );


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            image.src =
                objectUrl;


            image.onload =
                function () {

                    URL.revokeObjectURL(
                        objectUrl
                    );
                };


            galleryPreview.appendChild(
                image
            );
        }
    );
}


galleryImagesInput.addEventListener(
    "change",
    renderGalleryPreview
);


/* =====================================================
   AUDIO / VIDEO
===================================================== */

audioFileInput.addEventListener(
    "change",
    function () {

        const file =
            audioFileInput.files[0];


        if (file) {

            audioName.textContent =
                "File mới: " +
                file.name;

        } else if (
            existingPost &&
            existingPost.audio_url
        ) {

            audioName.textContent =
                "Hiện tại: " +
                getFileNameFromUrl(
                    existingPost.audio_url
                );

        } else {

            audioName.textContent = "";
        }
    }
);


videoFileInput.addEventListener(
    "change",
    function () {

        const file =
            videoFileInput.files[0];


        if (file) {

            videoName.textContent =
                "File mới: " +
                file.name;

        } else if (
            existingPost &&
            existingPost.video_url
        ) {

            videoName.textContent =
                "Hiện tại: " +
                getFileNameFromUrl(
                    existingPost.video_url
                );

        } else {

            videoName.textContent = "";
        }
    }
);


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


/* =====================================================
   NẠP BÀI CŨ KHI BẤM SỬA
===================================================== */

async function loadExistingPost() {

    if (!currentPostId) {
        return true;
    }


    showMessage(
        "Đang tải bài viết...",
        "success"
    );


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("posts")
                .select("*")
                .eq(
                    "id",
                    currentPostId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            throw new Error(
                "Không tìm thấy bài viết cần sửa."
            );
        }


        existingPost =
            data;


        titleInput.value =
            data.title || "";

        slugInput.value =
            data.slug || "";

        excerptInput.value =
            data.excerpt || "";

        contentInput.value =
            data.content || "";


        slugEditedManually =
            true;


        renderExistingCover();

        renderGalleryPreview();


        if (data.audio_url) {

            audioName.textContent =
                "Hiện tại: " +
                getFileNameFromUrl(
                    data.audio_url
                );
        }


        if (data.video_url) {

            videoName.textContent =
                "Hiện tại: " +
                getFileNameFromUrl(
                    data.video_url
                );
        }


        if (pageHeading) {

            pageHeading.textContent =
                "✏️ Sửa bài viết";
        }


        if (pageSubtitle) {

            pageSubtitle.textContent =
                data.status ===
                "published"
                    ? "Chỉnh sửa bài viết đang được xuất bản."
                    : "Chỉnh sửa bản nháp.";
        }


        document.title =
            "Sửa bài - Di sản Mộ Trạch";


        refreshButtonLabels();


        showMessage(
            data.status === "published"
                ? "✅ Đã tải bài viết đang xuất bản."
                : "✅ Đã tải bản nháp.",
            "success"
        );


        return true;


    } catch (error) {

        console.error(
            "Lỗi tải bài:",
            error
        );


        showMessage(
            error.message ||
            "Không thể tải bài viết."
        );


        return false;
    }
}


/* =====================================================
   LƯU / CẬP NHẬT BÀI
===================================================== */

async function savePost(status) {

    showMessage("");


    if (!currentUser) {

        showMessage(
            "Phiên đăng nhập không hợp lệ."
        );

        return;
    }


    const title =
        titleInput.value.trim();

    const excerpt =
        excerptInput.value.trim();

    const content =
        contentInput.value.trim();

    let slug =
        slugInput.value.trim();


    if (!title) {

        showMessage(
            "Vui lòng nhập tiêu đề bài viết."
        );

        titleInput.focus();

        return;
    }


    if (!slug) {

        slug =
            createSlug(title);

        slugInput.value =
            slug;
    }


    if (!slug) {

        showMessage(
            "Không thể tạo đường dẫn bài viết."
        );

        return;
    }


    if (
        status === "published" &&
        !content
    ) {

        showMessage(
            "Vui lòng nhập nội dung trước khi đăng bài."
        );

        contentInput.focus();

        return;
    }


    const mode =
        status === "draft"
            ? "draft"
            : "publish";


    setLoading(
        true,
        mode
    );


    try {

        validateFiles();


        showMessage(
            "Đang xử lý file...",
            "success"
        );


        /* -------------------------
           ẢNH ĐẠI DIỆN
        ------------------------- */

        const newCoverFile =
            coverImageInput.files[0];


        const oldCoverUrl =
            existingPost
                ? existingPost
                    .cover_image_url
                : null;


        let coverImageUrl =
            oldCoverUrl;


        if (newCoverFile) {

            coverImageUrl =
                await uploadFile(
                    "post-images",
                    newCoverFile,
                    "covers"
                );
        }


        /* -------------------------
           GALLERY
           Ảnh mới sẽ được thêm vào
           ảnh cũ.
        ------------------------- */

        const oldGallery =
            existingPost &&
            Array.isArray(
                existingPost.gallery_images
            )
                ? existingPost.gallery_images
                : [];


        const galleryFiles =
            Array.from(
                galleryImagesInput.files
            );


        const newGalleryUrls =
            await uploadGallery(
                galleryFiles
            );


        const galleryUrls = [
            ...oldGallery,
            ...newGalleryUrls
        ];


        /* -------------------------
           AUDIO
        ------------------------- */

        const newAudioFile =
            audioFileInput.files[0];


        const oldAudioUrl =
            existingPost
                ? existingPost.audio_url
                : null;


        let audioUrl =
            oldAudioUrl;


        if (newAudioFile) {

            audioUrl =
                await uploadFile(
                    "post-media",
                    newAudioFile,
                    "audio"
                );
        }


        /* -------------------------
           VIDEO
        ------------------------- */

        const newVideoFile =
            videoFileInput.files[0];


        const oldVideoUrl =
            existingPost
                ? existingPost.video_url
                : null;


        let videoUrl =
            oldVideoUrl;


        if (newVideoFile) {

            videoUrl =
                await uploadFile(
                    "post-media",
                    newVideoFile,
                    "video"
                );
        }


        /* -------------------------
           NGÀY XUẤT BẢN
        ------------------------- */

        let publishedAt = null;


        if (
            status === "published"
        ) {

            publishedAt =
                existingPost &&
                existingPost.published_at
                    ? existingPost
                        .published_at
                    : new Date()
                        .toISOString();
        }


        const postData = {

            title:
                title,

            slug:
                slug,

            excerpt:
                excerpt || null,

            content:
                content,

            cover_image_url:
                coverImageUrl,

            gallery_images:
                galleryUrls,

            audio_url:
                audioUrl,

            video_url:
                videoUrl,

            status:
                status,

            author_id:
                currentUser.id,

            published_at:
                publishedAt
        };


        showMessage(
            currentPostId
                ? "Đang cập nhật bài viết..."
                : "Đang lưu bài viết...",
            "success"
        );


        let savedPost = null;


        /* -------------------------
           CẬP NHẬT
        ------------------------- */

        if (currentPostId) {

            const {
                data,
                error
            } =
                await supabase
                    .from("posts")
                    .update(
                        postData
                    )
                    .eq(
                        "id",
                        currentPostId
                    )
                    .select()
                    .single();


            if (error) {

                if (
                    error.code ===
                    "23505"
                ) {

                    throw new Error(
                        "Đường dẫn bài viết đã được sử dụng bởi bài khác."
                    );
                }


                throw error;
            }


            savedPost =
                data;


        } else {

            /* -------------------------
               TẠO BÀI MỚI
            ------------------------- */

            const {
                data,
                error
            } =
                await supabase
                    .from("posts")
                    .insert(
                        postData
                    )
                    .select()
                    .single();


            if (error) {

                if (
                    error.code ===
                    "23505"
                ) {

                    throw new Error(
                        "Đường dẫn bài viết đã tồn tại."
                    );
                }


                throw error;
            }


            savedPost =
                data;

            currentPostId =
                data.id;


            window.history
                .replaceState(
                    {},
                    document.title,
                    window.location.pathname +
                    "?id=" +
                    encodeURIComponent(
                        data.id
                    )
                );
        }


        /*
            Chỉ xóa file cũ sau khi
            Database đã cập nhật thành công.
        */

        if (
            newCoverFile &&
            oldCoverUrl &&
            oldCoverUrl !==
                coverImageUrl
        ) {

            await removeStoredFile(
                "post-images",
                oldCoverUrl
            );
        }


        if (
            newAudioFile &&
            oldAudioUrl &&
            oldAudioUrl !== audioUrl
        ) {

            await removeStoredFile(
                "post-media",
                oldAudioUrl
            );
        }


        if (
            newVideoFile &&
            oldVideoUrl &&
            oldVideoUrl !== videoUrl
        ) {

            await removeStoredFile(
                "post-media",
                oldVideoUrl
            );
        }


        existingPost =
            savedPost;


        /*
            Xóa lựa chọn file mới
            sau khi đã lưu.
        */

        coverImageInput.value = "";

        galleryImagesInput.value = "";

        audioFileInput.value = "";

        videoFileInput.value = "";


        renderExistingCover();

        renderGalleryPreview();


        audioName.textContent =
            savedPost.audio_url
                ? "Hiện tại: " +
                  getFileNameFromUrl(
                      savedPost.audio_url
                  )
                : "";


        videoName.textContent =
            savedPost.video_url
                ? "Hiện tại: " +
                  getFileNameFromUrl(
                      savedPost.video_url
                  )
                : "";


        if (pageHeading) {

            pageHeading.textContent =
                "✏️ Sửa bài viết";
        }


        if (pageSubtitle) {

            pageSubtitle.textContent =
                status === "published"
                    ? "Bài viết đang được xuất bản."
                    : "Bài viết đang ở trạng thái bản nháp.";
        }


        refreshButtonLabels();


        if (
            status === "published"
        ) {

            showMessage(
                "✅ Cập nhật và đăng bài thành công!",
                "success"
            );

        } else {

            showMessage(
                "✅ Đã lưu bản nháp thành công!",
                "success"
            );
        }


    } catch (error) {

        console.error(
            "Lỗi lưu bài:",
            error
        );


        showMessage(
            error.message ||
            "Không thể lưu bài viết."
        );


    } finally {

        setLoading(false);
    }
}


/* =====================================================
   LƯU NHÁP
===================================================== */

saveDraftButton.addEventListener(
    "click",
    function () {

        savePost(
            "draft"
        );
    }
);


/* =====================================================
   ĐĂNG / CẬP NHẬT
===================================================== */

postForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        savePost(
            "published"
        );
    }
);


/* =====================================================
   KHỞI ĐỘNG
===================================================== */

async function init() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    if (currentPostId) {

        await loadExistingPost();

    } else {

        refreshButtonLabels();
    }
}


init();