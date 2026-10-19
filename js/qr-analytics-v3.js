
/* ==========================================
   MO TRACH HERITAGE - QR ANALYTICS V3
   Version: V5.2A-5D
========================================== */

import { supabase } from './supabase-client.js';

import { renderQRAnalyticsV4 } from './qr-analytics-v4.js';

const el = id => document.getElementById(id);

let reportRows = [];
let initialized = false;

// Lay ngay hien tai theo gio Viet Nam
function vietnamToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = type =>
    parts.find(p => p.type === type).value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Tinh ngay bat dau, bao gom ngay hom nay
function dateRange(days) {
  const end = vietnamToday();

  const startDate = new Date(
    `${end}T00:00:00Z`
  );

  startDate.setUTCDate(
    startDate.getUTCDate() - days + 1
  );

  return {
    from: startDate.toISOString().slice(0, 10),
    to: end
  };
}

function setStatus(message, error = false) {
  const target = el('qrReportStatus');
  if (!target) return;

  target.textContent = message;
  target.style.color = error ? '#a00000' : '#555';
}

// Tai du lieu tu Supabase
async function loadReport() {
  const refresh = el('qrReportRefresh');
  const exportBtn = el('qrReportExport');

  if (refresh) refresh.disabled = true;
  if (exportBtn) exportBtn.disabled = true;

  setStatus('Đang tải dữ liệu từ Supabase...');

  try {
    const days = Number(el('qrReportRange').value);

    if (![7, 30, 90].includes(days)) {
      throw new Error('Khoảng thời gian không hợp lệ');
    }

    const { from, to } = dateRange(days);

    const { data, error } = await supabase.rpc(
      'get_qr_daily_report',
      {
        p_from: from,
        p_to: to
      }
    );

    if (error) throw error;

    if (!Array.isArray(data)) {
      throw new Error('Dữ liệu trả về không hợp lệ');
    }

    reportRows = data;

console.log(
  '[QR V3] RPC trả về:',
  reportRows.length,
  'dòng'
);

console.table(
  reportRows.slice(0, 8).map(row => ({
    site_slug: row.site_slug,
    opens: row.opens,
    opens_type: typeof row.opens
  }))
);

    renderTable(reportRows);
    renderChart(reportRows);

try {
  renderQRAnalyticsV4(reportRows);
} catch (v4Error) {
  console.error('QR Analytics V4:', v4Error);
}

    setStatus(
      `Đã tải ${reportRows.length} dòng dữ liệu ` +
      `từ ${from} đến ${to}.`
    );

    if (exportBtn) exportBtn.disabled = false;

  } catch (error) {
    console.error('QR Analytics V3:', error);
    console.error(
  '[QR V3] Chi tiết lỗi:',
  error?.name,
  error?.message,
  error?.stack
);
console.log(
  '[QR V3] Đã vào khối xử lý lỗi:',
  error?.message
);
    reportRows = [];
    renderTable([]);
    renderChart([]);

    setStatus(
      'Không tải được thống kê: ' +
      (error.message || 'Lỗi không xác định'),
      true
    );

  } finally {
    if (refresh) refresh.disabled = false;
  }
}

// Hien thi bang thong ke
function renderTable(rows) {
  const tbody = el('qrReportTable')
    ?.querySelector('tbody');

  if (!tbody) return;

  tbody.replaceChildren();

  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = 'Không có dữ liệu.';
    tr.append(td);
    tbody.append(tr);
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach(item => {
    const tr = document.createElement('tr');

    const values = [
      item.report_date,
      item.title_vi || item.site_slug,
      item.opens ?? 0
    ];

    values.forEach(value => {
      const td = document.createElement('td');
      td.textContent = String(value);
      td.style.padding = '9px 12px';
      td.style.borderBottom = '1px solid #e5ded4';
      tr.append(td);
    });

    fragment.append(tr);
  });

  tbody.append(fragment);
}

// Bieu do cot tong luot mo theo ngay
function renderChart(rows) {
  const chart = el('qrReportChart');
  if (!chart) return;

  chart.replaceChildren();

  if (!rows.length) {
    chart.textContent = 'Không có dữ liệu biểu đồ.';
    return;
  }

  const totals = new Map();

  rows.forEach(item => {
    const day = item.report_date;
    const count = Number(item.opens) || 0;

    totals.set(
      day,
      (totals.get(day) || 0) + count
    );
  });

  const entries = [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]));

  const max = Math.max(
    1,
    ...entries.map(item => item[1])
  );

  chart.style.display = 'flex';
  chart.style.alignItems = 'flex-end';
  chart.style.gap = '6px';
  chart.style.height = '260px';
  chart.style.overflowX = 'auto';
  chart.style.padding = '20px 10px 8px';
  chart.style.borderBottom = '2px solid #c69c2d';
  chart.style.margin = '20px 0';

  entries.forEach(([day, count]) => {
    const column = document.createElement('div');

    column.style.flex =
      `0 0 ${entries.length > 35 ? 20 : 34}px`;
    column.style.height = '100%';
    column.style.display = 'flex';
    column.style.flexDirection = 'column';
    column.style.justifyContent = 'flex-end';
    column.style.alignItems = 'center';

    const value = document.createElement('span');
    value.textContent = count;
    value.style.fontSize = '11px';

    const bar = document.createElement('div');
    bar.style.width = '75%';
    bar.style.height =
      `${Math.max(2, count / max * 175)}px`;
    bar.style.background = '#800000';
    bar.style.borderRadius = '4px 4px 0 0';
    bar.title = `${day}: ${count} lượt mở`;

    const label = document.createElement('small');
    label.textContent = day.slice(8);
    label.title = day;
    label.style.fontSize = '10px';

    column.append(value, bar, label);
    chart.append(column);
  });
}

// Bao ve gia tri CSV khi mo bang Excel
function csvCell(value) {
  let text = String(value ?? '');

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

// Xuat CSV UTF-8 cho Excel
function exportCSV() {
  if (!reportRows.length) return;

  const csvRows = [
    ['Ngày', 'Mã di tích', 'Tên di tích', 'Lượt mở'],
    ...reportRows.map(item => [
      item.report_date,
      item.site_slug,
      item.title_vi,
      item.opens
    ])
  ];

  const csv = '\uFEFF' + csvRows
    .map(row => row.map(csvCell).join(','))
    .join('\r\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download =
    `motrach-qr-report-${vietnamToday()}.csv`;

  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Chi duoc goi sau khi admin da xac thuc
export async function initQRAnalyticsV3() {
  if (initialized) return;
  if (!el('qrAnalyticsV3')) return;

  initialized = true;

  el('qrReportRefresh')
    ?.addEventListener('click', loadReport);

  el('qrReportRange')
    ?.addEventListener('change', loadReport);

  el('qrReportExport')
    ?.addEventListener('click', exportCSV);

  await loadReport();
}
