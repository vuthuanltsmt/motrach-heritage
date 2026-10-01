import { supabase } from "./supabase-client.js";

const STORAGE_KEY = "motrach-language";

const postsGrid =
    document.getElementById("postsGrid");

let loadedPosts = [];


function getLanguage() {
    return localStorage.getItem(STORAGE_KEY) === "en"
        ? "en"
        : "vi";
}


function localizePost(post) {

    if (getLanguage() !== "en") {
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


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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


function makeExcerpt(post) {

    if (
        post.excerpt &&
        post.excerpt.trim()
    ) {
        return post.excerpt.trim();
    }

    const content =
        String(
            post.content || ""
        )
        .replace(/\s+/g, " ")
        .trim();

    if (content.length <= 160) {
        return content;
    }

    return (
        content.slice(0, 160) +
        "..."
    );
}


function renderPosts(posts) {

    if (!posts.length) {

        postsGrid.innerHTML = `
            <div class="state-box">

                <div class="state-icon">
                    📰
                </div>

                Hiện chưa có bài viết
                nào được xuất bản.

            </div>
        `;

        return;
    }


    postsGrid.innerHTML =
        posts.map(
            function (rawPost) {

                const post =
                    localizePost(
                        rawPost
                    );

                const title =
                    escapeHtml(
                        post.title
                    );

                const excerpt =
                    escapeHtml(
                        makeExcerpt(post)
                    );

                const date =
                    formatDate(
                        post.published_at ||
                        post.created_at
                    );

                const slug =
                    encodeURIComponent(
                        post.slug
                    );

                const postUrl =
                    "post.html?slug=" +
                    slug;


                let imageHtml = `
                    <div class="post-placeholder">
                        🏛️
                    </div>
                `;


                if (
                    post.cover_image_url
                ) {

                    imageHtml = `
                        <img
                            class="post-image"
                            src="${escapeHtml(
                                post.cover_image_url
                            )}"
                            alt="${title}"
                            loading="lazy"
                        >
                    `;
                }


                return `
                    <article class="post-card">

                        <a
                            class="post-image-wrap"
                            href="${postUrl}"
                        >
                            ${imageHtml}
                        </a>


                        <div class="post-content">

                            <div class="post-date">
                                ${
                                    date
                                        ? "📅 " + date
                                        : ""
                                }
                            </div>


                            <h3 class="post-title">

                                <a href="${postUrl}">
                                    ${title}
                                </a>

                            </h3>


                            <p class="post-excerpt">
                                ${excerpt}
                            </p>


                            <a
                                class="read-more"
                                href="${postUrl}"
                            >
                                Đọc bài →
                            </a>

                        </div>

                    </article>
                `;
            }
        )
        .join("");
}


async function loadPosts() {

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
                    title_en,
                    slug,
                    excerpt,
                    excerpt_en,
                    content,
                    content_en,
                    cover_image_url,
                    published_at,
                    created_at
                `)
                .eq(
                    "status",
                    "published"
                )
                .order(
                    "published_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        loadedPosts =
            data || [];


        renderPosts(
            loadedPosts
        );


    } catch (error) {

        console.error(
            "Lỗi tải bài viết:",
            error
        );


        postsGrid.innerHTML = `
            <div class="state-box">

                <div class="state-icon">
                    ⚠️
                </div>

                Không thể tải danh sách
                bài viết lúc này.

            </div>
        `;
    }
}


window.addEventListener(
    "motrach:languagechange",
    function () {

        renderPosts(
            loadedPosts
        );
    }
);


loadPosts();
