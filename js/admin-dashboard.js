import { supabase } from "./supabase-client.js";

const adminStatus =
    document.getElementById("adminStatus");

const logoutButton =
    document.getElementById("logoutButton");


async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error
        } =
            await supabase.auth.getUser();

        if (error || !user) {
            window.location.href =
                "../admin/login.html";

            return;
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

            await supabase.auth.signOut();

            window.location.href =
                "../admin/login.html";

            return;
        }


        adminStatus.textContent =
            "Đã đăng nhập: " +
            user.email;

    } catch (error) {

        console.error(
            "Lỗi kiểm tra quản trị:",
            error
        );

        window.location.href =
            "../admin/login.html";
    }
}


logoutButton.addEventListener(
    "click",
    async function () {

        logoutButton.disabled = true;

        logoutButton.textContent =
            "Đang đăng xuất...";

        await supabase.auth.signOut();

        window.location.href =
            "../admin/login.html";
    }
);


checkAdmin();