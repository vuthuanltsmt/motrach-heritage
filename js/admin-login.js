import { supabase } from "./supabase-client.js";


const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

const message =
    document.getElementById("message");


function showMessage(
    text,
    type = "error"
) {

    message.textContent = text;

    if (type === "success") {

        message.style.color =
            "#28734a";

    } else {

        message.style.color =
            "#b00020";

    }
}


function setLoginLoading(
    loading
) {

    loginButton.disabled =
        loading;

    loginButton.textContent =
        loading
            ? "Đang đăng nhập..."
            : "Đăng nhập";
}


function setRecoveryLoading(
    loading
) {

    forgotPasswordButton.disabled =
        loading;

    forgotPasswordButton.textContent =
        loading
            ? "Đang gửi email..."
            : "Quên mật khẩu?";
}


/* ==========================
   ĐĂNG NHẬP
========================== */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        showMessage("");

        const email =
            emailInput.value
                .trim();

        const password =
            passwordInput.value;


        if (
            !email ||
            !password
        ) {

            showMessage(
                "Vui lòng nhập đầy đủ email và mật khẩu."
            );

            return;
        }


        setLoginLoading(true);


        try {

            const {
                data,
                error
            } =
                await supabase.auth
                    .signInWithPassword({
                        email: email,
                        password: password
                    });


            if (error) {

                if (
                    error.message
                        .toLowerCase()
                        .includes(
                            "invalid login credentials"
                        )
                ) {

                    throw new Error(
                        "Email hoặc mật khẩu không đúng."
                    );

                }

                throw error;
            }


            const user =
                data.user;


            if (!user) {

                throw new Error(
                    "Không tìm thấy tài khoản."
                );
            }


            /* Kiểm tra quyền Admin */

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


            if (adminError) {

                throw adminError;
            }


            if (!admin) {

                await supabase.auth
                    .signOut();

                throw new Error(
                    "Tài khoản này không có quyền quản trị."
                );
            }


            showMessage(
                "Đăng nhập thành công. Đang mở trang quản trị...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "../admin/index.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Lỗi đăng nhập:",
                error
            );


            showMessage(
                error.message ||
                "Đăng nhập không thành công."
            );


            setLoginLoading(false);
        }
    }
);


/* ==========================
   QUÊN MẬT KHẨU
========================== */

forgotPasswordButton.addEventListener(
    "click",
    async function () {

        showMessage("");


        const email =
            emailInput.value
                .trim();


        if (!email) {

            showMessage(
                "Hãy nhập email quản trị trước khi chọn Quên mật khẩu."
            );

            emailInput.focus();

            return;
        }


        setRecoveryLoading(true);


        try {

            /*
                Tự động tạo đúng URL:

                Local:
                http://127.0.0.1:5500/admin/reset-password.html

                Production:
                https://motrach-heritage.vercel.app/admin/reset-password.html
            */

            const redirectUrl =
                window.location.origin +
                "/admin/reset-password.html";


            const {
                error
            } =
                await supabase.auth
                    .resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                redirectUrl
                        }
                    );


            if (error) {

                throw error;
            }


            showMessage(
                "Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư và cả thư rác (Spam).",
                "success"
            );


        } catch (error) {

            console.error(
                "Lỗi gửi email khôi phục:",
                error
            );


            showMessage(
                error.message ||
                "Không thể gửi email đặt lại mật khẩu."
            );

        } finally {

            setRecoveryLoading(false);
        }
    }
);


/* ==========================
   KIỂM TRA ĐÃ ĐĂNG NHẬP CHƯA
========================== */

async function checkExistingSession() {

    try {

        const {
            data: {
                user
            }
        } =
            await supabase.auth
                .getUser();


        if (!user) {
            return;
        }


        const {
            data: admin
        } =
            await supabase
                .from("admins")
                .select("user_id")
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (admin) {

            window.location.href =
                "../admin/index.html";

        }

    } catch (error) {

        console.log(
            "Chưa có phiên đăng nhập."
        );

    }
}


checkExistingSession();