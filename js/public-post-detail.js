import { supabase } from "./supabase-client.js";


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
        "vi-VN",
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

    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {
        return;
    }


    gallery.innerHTML = "";


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
                " - ảnh " +
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


function renderPost(post) {

    document.title =
        post.title +
        " - Di sản Mộ Trạch";


    articleTitle.textContent =
        post.title || "";


    articleDate.textContent =
        formatDate(
            post.published_at ||
            post.created_at
        )
            ? "📅 " +
              formatDate(
                  post.published_at ||
                  post.created_at
              )
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
    }


    if (post.cover_image_url) {

        coverImage.src =
            post.cover_image_url;

        coverImage.alt =
            post.title || "Ảnh bài viết";

        coverWrap.classList.add(
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
    }


    if (post.video_url) {

        videoPlayer.src =
            post.video_url;

        videoSection.classList.add(
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
                    slug,
                    excerpt,
                    content,
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


        renderPost(
            data
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


loadPost();