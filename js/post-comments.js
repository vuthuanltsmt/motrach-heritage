export function mountPostComments(postId, createReaderClient) {
    const root = document.getElementById("postComments");
    if (!root || postId == null) return;

    const reader = createReaderClient();
    const dialog = root.querySelector("dialog");
    const form = root.querySelector("[data-form=comment]");
    const authForm = root.querySelector("[data-form=auth]");
    const prompt = root.querySelector("[data-action=login]");
    const logout = root.querySelector("[data-action=logout]");
    const names = form.elements.namedItem("display_name");
    const body = form.elements.namedItem("body");
    const email = authForm.elements.namedItem("email");
    const password = authForm.elements.namedItem("password");
    const submit = authForm.querySelector("[type=submit]");
    const status = root.querySelector("[data-status=comment]");
    const authStatus = root.querySelector("[data-status=auth]");
    const list = root.querySelector("ul");
    const count = root.querySelector("[data-count]");
    const tabs = [...dialog.querySelectorAll("[data-mode]")];
    const forgot = dialog.querySelector("[data-action=forgot]");
    const returnUrl = new URL(window.location.pathname, window.location.origin);
    returnUrl.searchParams.set("slug", new URLSearchParams(location.search).get("slug") ?? "");

    const labels = {
        login: "Đăng nhập",
        signup: "Đăng ký",
        forgot: "Gửi liên kết đặt lại",
        recovery: "Lưu mật khẩu mới"
    };
    let mode = "login";

    function setMode(next) {
        mode = next;
        authStatus.textContent = "";
        email.parentElement.hidden = email.disabled = next === "recovery";
        password.parentElement.hidden = password.disabled = next === "forgot";
        password.minLength = next === "login" ? 1 : 8;
        password.autocomplete = next === "login" ? "current-password" : "new-password";
        for (const tab of tabs) {
            tab.hidden = next === "recovery";
            tab.setAttribute("aria-pressed", String(tab.dataset.mode === next));
        }
        forgot.hidden = next !== "login";
        submit.textContent = labels[next];
    }

    function renderSession(session, recovering = false) {
        const canComment = Boolean(session) && !recovering;
        form.hidden = logout.hidden = !canComment;
        prompt.hidden = canComment || recovering;
    }

    async function loadComments() {
        try {
            const { data, count: total, error } = await reader.from("article_comments")
                .select("id,display_name,body,created_at", { count: "exact" })
                .eq("post_id", String(postId))
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .limit(50);
            if (error) throw error;
            count.textContent = "(" + total + ")";
            const items = data.map((comment) => {
                const row = document.createElement("li");
                const name = document.createElement("strong");
                const text = document.createElement("p");
                name.textContent = comment.display_name;
                text.textContent = comment.body;
                row.append(name, text);
                return row;
            });
            list.replaceChildren(...items);
            root.querySelector("[data-status=list]").textContent = total > items.length
                ? "Đang hiển thị 50 bình luận mới nhất." : "";
        } catch {
            root.querySelector("[data-status=list]").textContent = "Chưa tải được bình luận. Bạn có thể tải lại trang để thử lại.";
        }
    }

    root.hidden = false;
    prompt.addEventListener("click", () => {
        setMode("login");
        dialog.showModal();
    });
    dialog.querySelector("[data-action=close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
        password.value = "";
        if (mode === "recovery") {
            setMode("login");
            void reader.auth.signOut({ scope: "local" }).catch(() => {});
        }
    });
    for (const tab of tabs) {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    }
    forgot.addEventListener("click", () => setMode("forgot"));
    reader.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            setMode("recovery");
            if (!dialog.open) dialog.showModal();
        }
        renderSession(session, mode === "recovery");
    });
    logout.addEventListener("click", async () => {
        logout.disabled = true;
        try {
            const { error } = await reader.auth.signOut({ scope: "local" });
            if (error) throw error;
            form.reset();
            status.textContent = "Bạn đã đăng xuất.";
        } catch {
            status.textContent = "Chưa thể đăng xuất. Vui lòng thử lại.";
        } finally {
            logout.disabled = false;
        }
    });

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (submit.disabled) return;
        const action = mode;
        const credentials = { email: email.value.trim(), password: password.value };
        setAuthPending(true);
        authStatus.textContent = "Đang xử lý…";
        try {
            const result = await submitAuth(action, credentials);
            if (result.error) throw result.error;
            if (action === "forgot") {
                authStatus.textContent = "Nếu email đã đăng ký, hãy mở liên kết đặt lại trong hộp thư trên trình duyệt này.";
            } else if (action === "signup" && !result.data.session) {
                authStatus.textContent = "Hãy mở email xác nhận trên trình duyệt này để hoàn tất đăng ký.";
            } else {
                if (action === "recovery") {
                    setMode("login");
                    renderSession({ recovered: true });
                    status.textContent = "Đã lưu mật khẩu mới.";
                }
                dialog.close();
                body.focus();
            }
        } catch {
            authStatus.textContent = action === "login"
                ? "Chưa đăng nhập được. Hãy kiểm tra email, mật khẩu và xác nhận email."
                : "Chưa hoàn tất thao tác. Vui lòng kiểm tra thông tin và thử lại.";
        } finally {
            setAuthPending(false);
        }
    });

    function setAuthPending(pending) {
        submit.disabled = forgot.disabled = pending;
        for (const tab of tabs) tab.disabled = pending;
    }

    function submitAuth(action, credentials) {
        switch (action) {
            case "signup":
                return reader.auth.signUp({
                    ...credentials, options: { emailRedirectTo: returnUrl.href }
                });
            case "forgot":
                return reader.auth.resetPasswordForEmail(credentials.email, { redirectTo: returnUrl.href });
            case "recovery":
                return reader.auth.updateUser({ password: credentials.password });
            default:
                return reader.auth.signInWithPassword(credentials);
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const send = form.querySelector("[type=submit]");
        if (send.disabled) return;
        const displayName = names.value.trim();
        const message = body.value.trim();
        if (displayName.length < 2 || !message) {
            status.textContent = "Nhập tên hiển thị và nội dung bình luận.";
            return;
        }
        send.disabled = true;
        try {
            const { error } = await reader.from("article_comments").insert({
                post_id: String(postId), display_name: displayName, body: message
            });
            if (error) throw error;
            body.value = "";
            status.textContent = "Đã gửi bình luận. Bình luận sẽ hiện sau khi được duyệt.";
        } catch {
            status.textContent = "Chưa gửi được bình luận. Nội dung của bạn vẫn còn trong ô nhập.";
        } finally {
            send.disabled = false;
        }
    });

    void loadComments();
}
