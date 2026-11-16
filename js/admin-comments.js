import { supabase } from "./supabase-client.js";

const queue = document.getElementById("queue");
const notice = document.getElementById("notice");
const refresh = document.getElementById("refresh");
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
let busy = false;

function setBusy(value) {
    busy = value;
    refresh.disabled = value;
    for (const button of queue.querySelectorAll("button")) {
        button.disabled = value;
    }
}

function renderComment(comment) {
    const item = document.createElement("li");
    const title = document.createElement("h2");
    const time = document.createElement("small");
    const message = document.createElement("p");

    title.textContent = comment.display_name;
    time.textContent = dateFormat.format(new Date(comment.created_at));
    message.className = "comment-body";
    message.textContent = comment.body;
    item.append(title, time, message);

    if (comment.post_slug) {
        const linkBlock = document.createElement("p");
        const link = document.createElement("a");
        const url = new URL("../pages/post.html", window.location.href);
        url.searchParams.set("slug", comment.post_slug);
        link.href = url.href;
        link.textContent = comment.post_title || "Mở bài viết";
        linkBlock.append(link);
        item.append(linkBlock);
    }

    for (const [decision, text] of [["approved", "Duyệt"], ["rejected", "Từ chối"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.addEventListener("click", () => void moderate(comment.comment_id, decision));
        item.append(button);
    }

    return item;
}

async function readQueue() {
    const { data, error } = await supabase.rpc("motrach_pending_comments");
    if (error) throw error;
    queue.replaceChildren(...data.map(renderComment));
    return data.length ? "Bình luận đang chờ duyệt, tối đa 50 mục." : "Hiện không có bình luận chờ duyệt.";
}

async function loadQueue() {
    if (busy) return;
    setBusy(true);
    try {
        notice.textContent = await readQueue();
    } catch (error) {
        queue.replaceChildren();
        notice.textContent = error.code === "42501"
            ? "Tài khoản này không có quyền duyệt bình luận."
            : "Chưa tải được danh sách. Hãy thử lại.";
    } finally {
        setBusy(false);
    }
}

async function moderate(id, decision) {
    if (busy) return;
    setBusy(true);
    try {
        const { data: changed, error } = await supabase.rpc("motrach_moderate_comment", {
            p_id: id,
            p_decision: decision
        });
        if (error) throw error;
        const result = changed
            ? (decision === "approved" ? "Đã duyệt bình luận." : "Đã từ chối bình luận.")
            : "Bình luận này đã được xử lý.";
        try {
            notice.textContent = result + " " + await readQueue();
        } catch {
            queue.replaceChildren();
            notice.textContent = result + " Hãy tải lại danh sách.";
        }
    } catch (error) {
        if (error.code === "42501") queue.replaceChildren();
        notice.textContent = error.code === "42501"
            ? "Tài khoản này không có quyền duyệt bình luận."
            : "Chưa lưu được quyết định. Hãy thử lại.";
    } finally {
        setBusy(false);
    }
}

refresh.addEventListener("click", () => void loadQueue());

async function start() {
    try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
            window.location.replace("login.html");
            return;
        }
        await loadQueue();
    } catch {
        notice.textContent = "Chưa kiểm tra được phiên đăng nhập. Hãy tải lại trang.";
    }
}

void start();
