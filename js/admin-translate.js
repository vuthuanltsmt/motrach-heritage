import { supabase } from "./supabase-client.js";

const titleInput =
    document.getElementById("title");

const excerptInput =
    document.getElementById("excerpt");

const contentInput =
    document.getElementById("content");

const titleEnInput =
    document.getElementById("titleEn");

const excerptEnInput =
    document.getElementById("excerptEn");

const contentEnInput =
    document.getElementById("contentEn");

const message =
    document.getElementById("message");

let translateButton = null;


function showTranslationMessage(
    text,
    type = "success"
) {

    if (!message) {
        return;
    }

    message.textContent = text;

    message.style.color =
        type === "success"
            ? "#28734a"
            : "#b00020";
}


function createTranslateButton() {

    if (
        !titleEnInput ||
        !excerptEnInput ||
        !contentEnInput
    ) {
        return;
    }

    if (
        document.getElementById(
            "translateEnglishButton"
        )
    ) {
        return;
    }


    const firstEnglishGroup =
        titleEnInput.closest(
            ".form-group"
        );


    if (!firstEnglishGroup) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.display =
        "flex";

    wrapper.style.flexWrap =
        "wrap";

    wrapper.style.gap =
        "10px";

    wrapper.style.alignItems =
        "center";

    wrapper.style.margin =
        "0 0 20px";


    translateButton =
        document.createElement(
            "button"
        );


    translateButton.id =
        "translateEnglishButton";

    translateButton.type =
        "button";

    translateButton.textContent =
        "🌐 Dịch sang tiếng Anh";


    translateButton.style.border =
        "0";

    translateButton.style.borderRadius =
        "9px";

    translateButton.style.padding =
        "12px 18px";

    translateButton.style.fontSize =
        "15px";

    translateButton.style.fontWeight =
        "700";

    translateButton.style.cursor =
        "pointer";

    translateButton.style.background =
        "#1f5f99";

    translateButton.style.color =
        "white";


    const hint =
        document.createElement(
            "span"
        );


    hint.textContent =
        "AI sẽ điền 3 ô tiếng Anh; bạn vẫn có thể sửa lại trước khi lưu.";

    hint.style.fontSize =
        "13px";

    hint.style.color =
        "#666";


    wrapper.appendChild(
        translateButton
    );

    wrapper.appendChild(
        hint
    );


    firstEnglishGroup.parentNode
        .insertBefore(
            wrapper,
            firstEnglishGroup
        );


    translateButton.addEventListener(
        "click",
        translateToEnglish
    );
}


async function translateToEnglish() {

    const title =
        titleInput?.value.trim() || "";

    const excerpt =
        excerptInput?.value.trim() || "";

    const content =
        contentInput?.value.trim() || "";


    if (!title) {

        showTranslationMessage(
            "Vui lòng nhập tiêu đề tiếng Việt trước.",
            "error"
        );

        titleInput?.focus();

        return;
    }


    if (!content) {

        showTranslationMessage(
            "Vui lòng nhập nội dung tiếng Việt trước.",
            "error"
        );

        contentInput?.focus();

        return;
    }


    const hasEnglishContent =
        Boolean(
            titleEnInput.value.trim() ||
            excerptEnInput.value.trim() ||
            contentEnInput.value.trim()
        );


    if (
        hasEnglishContent &&
        !window.confirm(
            "Các ô tiếng Anh đang có nội dung. Bạn có muốn dịch lại và ghi đè không?"
        )
    ) {
        return;
    }


    translateButton.disabled =
        true;

    translateButton.textContent =
        "⏳ Đang dịch...";

    translateButton.style.opacity =
        ".65";

    translateButton.style.cursor =
        "wait";


    showTranslationMessage(
        "Đang dịch bài viết sang tiếng Anh...",
        "success"
    );


    try {

        const {
            data: {
                session
            },
            error: sessionError
        } =
            await supabase.auth
                .getSession();


        if (
            sessionError ||
            !session?.access_token
        ) {

            throw new Error(
                "Phiên đăng nhập quản trị không hợp lệ."
            );
        }


        const response =
            await fetch(
                "/api/translate-article",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            "Bearer " +
                            session.access_token
                    },

                    body: JSON.stringify({
                        title,
                        excerpt,
                        content
                    })
                }
            );


        let payload = null;


        try {
            payload =
                await response.json();
        } catch {
            payload = {};
        }


        if (!response.ok) {

            throw new Error(
                payload?.error ||
                "Không thể dịch bài viết lúc này."
            );
        }


        titleEnInput.value =
            payload.title_en || "";

        excerptEnInput.value =
            payload.excerpt_en || "";

        contentEnInput.value =
            payload.content_en || "";


        showTranslationMessage(
            "✅ Đã dịch sang tiếng Anh. Hãy đọc lại rồi bấm Lưu/Cập nhật bài.",
            "success"
        );


        titleEnInput.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        console.error(
            "Lỗi dịch bài:",
            error
        );


        const onLocalhost =
            location.hostname ===
                "127.0.0.1" ||
            location.hostname ===
                "localhost";


        if (onLocalhost) {

            showTranslationMessage(
                "Nút dịch tự động cần chạy trên Vercel Preview/Production, không chạy bằng Live Server.",
                "error"
            );

        } else {

            showTranslationMessage(
                error.message ||
                "Không thể dịch bài viết.",
                "error"
            );
        }


    } finally {

        translateButton.disabled =
            false;

        translateButton.textContent =
            "🌐 Dịch sang tiếng Anh";

        translateButton.style.opacity =
            "1";

        translateButton.style.cursor =
            "pointer";
    }
}


createTranslateButton();
