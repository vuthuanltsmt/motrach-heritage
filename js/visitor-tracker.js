// Thong ke luot truy cap: khong luu IP, vi tri hoac thong tin danh tinh.
// Mot phien ket thuc sau 30 phut khong hoat dong; refresh khong tinh phien moi.
import { supabase } from './supabase-client.js';

const SESSION_IDLE_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = 'motrach-analytics-v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function newUuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readLocal(key) {
    try { return window.localStorage.getItem(key); }
    catch (_) { return null; }
}

function writeLocal(key, value) {
    try { window.localStorage.setItem(key, value); }
    catch (_) { /* Trinh duyet tu choi luu tru: khong lam loi website. */ }
}

function getIds() {
    let visitorId = readLocal(`${STORAGE_PREFIX}-visitor`);
    if (!visitorId || !UUID_PATTERN.test(visitorId)) {
        visitorId = newUuid();
        writeLocal(`${STORAGE_PREFIX}-visitor`, visitorId);
    }

    const now = Date.now();
    const lastActive = Number(readLocal(`${STORAGE_PREFIX}-last-active`) || '0');
    let sessionId = readLocal(`${STORAGE_PREFIX}-session`);
    if (!sessionId || !UUID_PATTERN.test(sessionId)
        || now - lastActive > SESSION_IDLE_MS || now < lastActive) {
        sessionId = newUuid();
        writeLocal(`${STORAGE_PREFIX}-session`, sessionId);
    }
    writeLocal(`${STORAGE_PREFIX}-last-active`, String(now));
    return { visitorId, sessionId };
}

function normalizedPage() {
    const path = window.location.pathname;
    const match = path.match(/\/pages\/([a-z0-9-]+\.html)$/i);
    if (match) return `/pages/${match[1].toLowerCase()}`;
    return '/index.html';
}

async function trackVisit() {
    if (window.location.protocol === 'file:') return;
    const { visitorId, sessionId } = getIds();
    const { error } = await supabase.rpc('record_site_visit', {
        p_page_path: normalizedPage(),
        p_visitor_id: visitorId,
        p_session_id: sessionId
    });
    if (error) console.warn('Chua ghi nhan duoc luot truy cap:', error.message);
}

async function updatePublicCounter() {
    const counter = document.getElementById('publicVisitCount');
    if (!counter) return;
    const { data, error } = await supabase.rpc('get_public_visit_total');
    if (error) {
        counter.textContent = '—';
        counter.title = 'Cần cài đặt SQL trong Supabase để kích hoạt thống kê';
        return;
    }
    counter.textContent = Number(data || 0).toLocaleString('vi-VN');
}

(async function bootAnalytics() {
    try {
        await trackVisit();
        await updatePublicCounter();
    } catch (error) {
        console.warn('Thong ke khong kha dung:', error);
        await updatePublicCounter().catch(() => {});
    }
})();
