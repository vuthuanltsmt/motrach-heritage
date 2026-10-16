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

        await loadVisitAnalytics();

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

// Bao cao chi duoc truy van SAU KHI checkAdmin() xac minh bang admins.
async function loadVisitAnalytics() {
    const status = document.getElementById('analyticsStatus');
    if (!status) return;
    try {
        const { data, error } = await supabase.rpc('get_admin_visit_summary');
        if (error) throw error;
        const report = data || {};
        const fields = {
            visitsToday: report.visits_today,
            visitsTotal: report.visits_total,
            visits7Days: report.visits_7days,
            visitorsToday: report.visitors_today,
            visitorsTotal: report.visitors_total,
            pageviewsTotal: report.pageviews_total
        };
        const numberFormat = new Intl.NumberFormat('vi-VN');
        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.textContent = numberFormat.format(Number(value || 0));
        }
        renderDailyChart(Array.isArray(report.daily) ? report.daily : []);
        renderTopPages(Array.isArray(report.top_pages) ? report.top_pages : []);
        status.textContent = 'Số liệu đã cập nhật';
    } catch (error) {
        console.error('Loi tai bao cao truy cap:', error);
        status.className = 'analytics-error';
        status.textContent = 'Chưa tải được thống kê. Hãy chạy tệp sql/001_visit_statistics.sql trong Supabase SQL Editor và kiểm tra quyền quản trị.';
    }
}

function renderDailyChart(days) {
    const chart = document.getElementById('visitsDailyChart');
    if (!chart) return;
    chart.replaceChildren();
    const max = Math.max(1, ...days.map(d => Number(d.visits || 0)));
    const format = new Intl.NumberFormat('vi-VN');
    days.forEach(d => {
        const value = Number(d.visits || 0);
        const item = document.createElement('div');
        item.className = 'day';
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = format.format(value);
        const bar = document.createElement('span');
        bar.className = 'bar';
        bar.style.height = `${Math.max(4, 140 * value / max)}px`;
        const date = document.createElement('span');
        date.className = 'date';
        date.textContent = String(d.date || '');
        item.setAttribute('title', `${date.textContent}: ${value} lượt truy cập`);
        item.append(count, bar, date);
        chart.append(item);
    });
}

function renderTopPages(pages) {
    const list = document.getElementById('visitsTopPages');
    if (!list) return;
    list.replaceChildren();
    const labels = {
        '/index.html': 'Trang chủ',
        '/pages/heritage.html': 'Di tích',
        '/pages/map.html': 'Bản đồ',
        '/pages/map-tour.html': 'Tuyến tham quan',
        '/pages/bai-viet.html': 'Tin tức',
        '/pages/gioi-thieu.html': 'Giới thiệu',
        '/pages/tim-kiem.html': 'Tìm kiếm',
        '/pages/donate.html': 'Ủng hộ',
        '/pages/hoi-dap.html': 'Hỏi đáp',
        '/pages/lien-he.html': 'Liên hệ'
    };
    if (!pages.length) {
        const li = document.createElement('li');
        li.textContent = 'Chưa có lượt xem trang nào.';
        list.append(li);
    }
    pages.forEach(p => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = labels[p.path] || String(p.path).split('/').pop();
        name.title = String(p.path);
        const value = document.createElement('strong');
        value.textContent = Number(p.views || 0).toLocaleString('vi-VN');
        li.append(name, value);
        list.append(li);
    });
}
