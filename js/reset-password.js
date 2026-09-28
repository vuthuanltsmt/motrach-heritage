import { supabase } from "./supabase-client.js";

const resetForm =
    document.getElementById("resetForm");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const resetButton =
    document.getElementById("resetButton");

const message =
    document.getElementById("message");


let recoverySessionReady = false;


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


function setLoading(loading) {

    resetButton.disabled = loading;

    resetButton.textContent =
        loading
            ? "Đang cập nhật..."
            : "Đặt mật khẩu mới";
}


/* =========================================
   KHỞI TẠO PHIÊN KHÔI PHỤC
========================================= */

async function initializeRecovery() {

    showMessage(
        "Đang xác thực liên kết khôi phục...",
        "success"
    );

    try {

        /*
            1. Kiểm tra xem Supabase đã tự
            tạo session hay chưa.
        */

        const {
            data: sessionData
        } =
            await supabase.auth
                .getSession();


        if (sessionData.session) {

            recoverySessionReady = true;

            showMessage(
                "Liên kết hợp lệ. Bạn có thể đặt mật khẩu mới.",
                "success"
            );

            return;
        }


        const url =
            new URL(
                window.location.href
            );


        /*
            2. Xử lý PKCE:
            ?code=...
        */

        const code =
            url.searchParams.get(
                "code"
            );


        if (code) {

            const {
                data,
                error
            } =
                await supabase.auth
                    .exchangeCodeForSession(
                        code
                    );


            if (error) {
                throw error;
            }


            if (data.session) {

                recoverySessionReady =
                    true;


                /*
                    Xóa code khỏi thanh địa chỉ
                    sau khi đã dùng.
                */

                url.searchParams.delete(
                    "code"
                );

                window.history
                    .replaceState(
                        {},
                        document.title,
                        url.pathname
                    );


                showMessage(
                    "Liên kết hợp lệ. Bạn có thể đặt mật khẩu mới.",
                    "success"
                );

                return;
            }
        }


        /*
            3. Xử lý link dạng implicit:
            #access_token=...
            &refresh_token=...
        */

        const hash =
            new URLSearchParams(
                window.location.hash
                    .substring(1)
            );


        const accessToken =
            hash.get(
                "access_token"
            );

        const refreshToken =
            hash.get(
                "refresh_token"
            );


        if (
            accessToken &&
            refreshToken
        ) {

            const {
                data,
                error
            } =
                await supabase.auth
                    .setSession({
                        access_token:
                            accessToken,

                        refresh_token:
                            refreshToken
                    });


            if (error) {
                throw error;
            }


            if (data.session) {

                recoverySessionReady =
                    true;


                window.history
                    .replaceState(
                        {},
                        document.title,
                        window.location.pathname
                    );


                showMessage(
                    "Liên kết hợp lệ. Bạn có thể đặt mật khẩu mới.",
                    "success"
                );

                return;
            }
        }


        throw new Error(
            "Không tìm thấy phiên khôi phục mật khẩu. Hãy yêu cầu một email đặt lại mật khẩu mới."
        );


    } catch (error) {

        console.error(
            "Lỗi xác thực liên kết:",
            error
        );


        recoverySessionReady =
            false;


        showMessage(
            "Liên kết khôi phục không còn hiệu lực. Hãy yêu cầu email đặt lại mật khẩu mới."
        );
    }
}


/* =========================================
   ĐỔI MẬT KHẨU
========================================= */

resetForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (password.length < 8) {

            showMessage(
                "Mật khẩu phải có ít nhất 8 ký tự."
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "Hai mật khẩu chưa giống nhau."
            );

            return;
        }


        if (!recoverySessionReady) {

            showMessage(
                "Phiên khôi phục chưa hợp lệ. Hãy mở liên kết trong email mới nhất."
            );

            return;
        }


        setLoading(true);


        try {

            const {
                error
            } =
                await supabase.auth
                    .updateUser({
                        password:
                            password
                    });


            if (error) {
                throw error;
            }


            showMessage(
                "Đổi mật khẩu thành công. Đang chuyển về trang đăng nhập...",
                "success"
            );


            await supabase.auth
                .signOut();


            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                1200
            );


        } catch (error) {

            console.error(
                "Lỗi đổi mật khẩu:",
                error
            );


            showMessage(
                error.message ||
                "Không thể đổi mật khẩu."
            );


            setLoading(false);
        }
    }
);


/* =========================================
   THEO DÕI PASSWORD RECOVERY
========================================= */

supabase.auth.onAuthStateChange(
    function (event, session) {

        if (
            event ===
                "PASSWORD_RECOVERY" &&
            session
        ) {

            recoverySessionReady =
                true;


            showMessage(
                "Liên kết hợp lệ. Bạn có thể đặt mật khẩu mới.",
                "success"
            );
        }
    }
);


initializeRecovery();