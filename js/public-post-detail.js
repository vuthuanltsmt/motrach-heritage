import { supabase } from "./supabase-client.js";

const STORAGE_KEY = "motrach-language";

const loadingState =
    document.getElementById("loadingState");

const article =
    document.getElementById("article");

const coverWrap =
    document.getElementById("coverWrap");

const coverImage =
    document.getElementById("coverImage");

const articleDate =
    document.getElementById("articleDate");

const articleTitle =
    document.getElementById("articleTitle");

const articleExcerpt =
    document.getElementById("articleExcerpt");

const articleContent =
    document.getElementById("articleContent");

const gallerySection =
    document.getElementById("gallerySection");

const gallery =
    document.getElementById("gallery");

const audioSection =
    document.getElementById("audioSection");

const audioPlayer =
    document.getElementById("audioPlayer");

const videoSection =
    document.getElementById("videoSection");

const videoPlayer =
    document.getElementById("videoPlayer");

let loadedPost = null;


function getLanguage() {
    return localStorage.getItem(STORAGE_KEY) === "en"
        ? "en"
        : "vi";
}


function localizePost(post) {

    if (!post || getLanguage() !== "en") {
        return post;
    }

    return {
        ...post,

        title:
            post.title_en &&
            post.title_en.trim()
                ? post.title_en.trim()
                : post.title,

        excerpt:
            post.excerpt_en &&
            post.excerpt_en.trim()
                ? post.excerpt_en.trim()
                : post.excerpt,

        content:
            post.content_en &&
            post.content_en.trim()
                ? post.content_en.trim()
                : post.content
    };
}


function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        getLanguage() === "en"
            ? "en-GB"
            : "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


function showError(text) {

    loadingState.innerHTML = `
        <div class="state-icon">
            ⚠️
        </div>

        ${text}

        <div style="margin-top:20px;">
            <a
                href="bai-viet.html"
                style="
                    color:#800000;
                    font-weight:700;
                    text-decoration:none;
                "
            >
                ← Quay lại danh sách bài viết
            </a>
        </div>
    `;
}


function renderGallery(images) {

    gallery.innerHTML = "";
    gallerySection.classList.remove(
        "visible"
    );


    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {
        return;
    }


    images.forEach(
        function (url, index) {

            if (!url) {
                return;
            }


            const image =
                document.createElement("img");


            image.src = url;

            image.alt =
                articleTitle.textContent +
                (
                    getLanguage() === "en"
                        ? " - image "
                        : " - ảnh "
                ) +
                (index + 1);

            image.loading =
                "lazy";


            image.addEventListener(
                "click",
                function () {

                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }
            );


            gallery.appendChild(
                image
            );
        }
    );


    if (
        gallery.children.length > 0
    ) {

        gallerySection.classList.add(
            "visible"
        );
    }
}


function renderPost(rawPost) {

    const post =
        localizePost(
            rawPost
        );


    document.title =
        (post.title || "") +
        (
            getLanguage() === "en"
                ? " - Mo Trach Heritage"
                : " - Di sản Mộ Trạch"
        );


    articleTitle.textContent =
        post.title || "";


    const formattedDate =
        formatDate(
            post.published_at ||
            post.created_at
        );


    articleDate.textContent =
        formattedDate
            ? "📅 " + formattedDate
            : "";


    articleContent.textContent =
        post.content || "";


    if (
        post.excerpt &&
        post.excerpt.trim()
    ) {

        articleExcerpt.textContent =
            post.excerpt.trim();

        articleExcerpt.hidden =
            false;

    } else {

        articleExcerpt.textContent = "";

        articleExcerpt.hidden =
            true;
    }


    if (post.cover_image_url) {

        coverImage.src =
            post.cover_image_url;

        coverImage.alt =
            post.title ||
            (
                getLanguage() === "en"
                    ? "Article image"
                    : "Ảnh bài viết"
            );

        coverWrap.classList.add(
            "visible"
        );

    } else {

        coverImage.removeAttribute(
            "src"
        );

        coverWrap.classList.remove(
            "visible"
        );
    }


    renderGallery(
        post.gallery_images
    );


    if (post.audio_url) {

        audioPlayer.src =
            post.audio_url;

        audioSection.classList.add(
            "visible"
        );

    } else {

        audioPlayer.removeAttribute(
            "src"
        );

        audioSection.classList.remove(
            "visible"
        );
    }


    if (post.video_url) {

        videoPlayer.src =
            post.video_url;

        videoSection.classList.add(
            "visible"
        );

    } else {

        videoPlayer.removeAttribute(
            "src"
        );

        videoSection.classList.remove(
            "visible"
        );
    }


    loadingState.hidden =
        true;

    article.hidden =
        false;
}


async function loadPost() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const slug =
            params.get("slug");


        if (!slug) {

            showError(
                "Không tìm thấy đường dẫn bài viết."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("posts")
                .select(`
                    id,
                    title,
                    title_en,
                    slug,
                    excerpt,
                    excerpt_en,
                    content,
                    content_en,
                    cover_image_url,
                    gallery_images,
                    audio_url,
                    video_url,
                    status,
                    published_at,
                    created_at
                `)
                .eq(
                    "slug",
                    slug
                )
                .eq(
                    "status",
                    "published"
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            showError(
                "Bài viết không tồn tại hoặc chưa được xuất bản."
            );

            return;
        }


        loadedPost =
            data;


        renderPost(
            loadedPost
        );


    } catch (error) {

        console.error(
            "Lỗi tải chi tiết bài viết:",
            error
        );


        showError(
            "Không thể tải bài viết lúc này."
        );
    }
}


window.addEventListener(
    "motrach:languagechange",
    function () {

        if (loadedPost) {

            renderPost(
                loadedPost
            );
        }
    }
);


loadPost();
