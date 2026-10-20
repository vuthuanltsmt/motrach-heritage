
/*
  MO TRACH HERITAGE
  V5.3B - QR ANALYTICS V4
  So sanh 4 di tich, xep hang va ty trong.
  Su dung du lieu that tu QR Analytics V3.
*/

const sites = [
  { slug: 'lang-than', name: 'Lăng Thần' },
  { slug: 'van-mieu-mo-trach', name: 'Văn Miếu Mộ Trạch' },
  { slug: 'dinh-lang-mo-trach', name: 'Đình làng Mộ Trạch' },
  { slug: 'chua-dien-phuc', name: 'Chùa Diên Phúc' }
];

const formatNumber = value =>
  new Intl.NumberFormat('vi-VN').format(value);

function create(tag, text = '', className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function prepareSection() {
  let section = document.getElementById('qrAnalyticsV4');
  if (section) return section;

  const v3 = document.getElementById('qrAnalyticsV3');
  if (!v3) return null;

  section = create('section', '', 'panel');
  section.id = 'qrAnalyticsV4';
  section.style.marginTop = '24px';

  const heading = create(
    'h2',
    '📊 QR Analytics V4 – Phân tích theo di tích'
  );

  const description = create(
    'p',
    'So sánh, xếp hạng và tỷ trọng lượt mở QR ' +
    'của bốn di tích trong khoảng thời gian đã chọn.'
  );
  description.className = 'muted';

  const content = create('div');
  content.id = 'qrV4Content';

  section.append(heading, description, content);
  v3.insertAdjacentElement('afterend', section);

  return section;
}

export function renderQRAnalyticsV4(rows = []) {
    console.trace('[QR V4] Nguồn gọi hàm');
    console.log('[QR V4] Số dòng nhận được:', rows?.length);
console.table(
  Array.isArray(rows)
    ? rows.slice(0, 8).map(row => ({
        site_slug: row.site_slug,
        opens: row.opens,
        opens_type: typeof row.opens
      }))
    : []
);
  const section = prepareSection();
  if (!section) return;

  const content = document.getElementById('qrV4Content');
  if (!content) return;
  content.replaceChildren();

  if (!Array.isArray(rows)) {
    content.append(
      create('p', 'Dữ liệu thống kê không hợp lệ.')
    );
    return;
  }

  const totals = new Map(
    sites.map(site => [site.slug, 0])
  );

  for (const row of rows) {
    if (!totals.has(row.site_slug)) continue;

    const opens = Number(row.opens);
    if (!Number.isFinite(opens) || opens < 0) continue;

    totals.set(
      row.site_slug,
      totals.get(row.site_slug) + opens
    );
  }

  const ranking = sites.map(site => ({
    ...site,
    opens: totals.get(site.slug)
  })).sort((a, b) => b.opens - a.opens);

  const total = ranking.reduce(
    (sum, item) => sum + item.opens, 0
  );

  const summary = create(
    'p',
    `Tổng lượt mở QR trong kỳ: ${formatNumber(total)}`
  );
  summary.style.fontWeight = 'bold';
  summary.style.fontSize = '18px';
  content.append(summary);

  if (total === 0) {
    content.append(
      create('p', 'Chưa có lượt mở QR trong khoảng thời gian này.')
    );
    return;
  }

  const max = Math.max(...ranking.map(item => item.opens), 1);

  const chartHeading = create(
    'h3',
    '1. Biểu đồ so sánh lượt mở QR'
  );
  content.append(chartHeading);

  const chart = create('div');
  chart.style.display = 'grid';
  chart.style.gap = '14px';
  chart.style.margin = '18px 0 28px';

  ranking.forEach(item => {
    const row = create('div');

    const label = create(
      'div',
      `${item.name}: ${formatNumber(item.opens)} lượt`
    );
    label.style.marginBottom = '5px';

    const track = create('div');
    track.style.background = '#f0e5de';
    track.style.borderRadius = '6px';
    track.style.height = '20px';
    track.style.overflow = 'hidden';

    const bar = create('div');
    bar.style.width = `${item.opens / max * 100}%`;
    bar.style.height = '100%';
    bar.style.background = '#800000';
    bar.style.borderRadius = '6px';

    track.append(bar);
    row.append(label, track);
    chart.append(row);
  });

  content.append(chart);

  content.append(
    create('h3', '2. Bảng xếp hạng và tỷ trọng')
  );

  const table = create('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '12px';

  const thead = create('thead');
  const headRow = create('tr');

  ['Hạng', 'Di tích', 'Lượt mở', 'Tỷ trọng'].forEach(text => {
    const th = create('th', text);
    th.style.padding = '10px';
    th.style.borderBottom = '2px solid #c89b2f';
    th.style.textAlign = 'left';
    headRow.append(th);
  });

  thead.append(headRow);

  const tbody = create('tbody');

  ranking.forEach((item, index) => {
    const percentage = item.opens / total * 100;
    const tr = create('tr');

    [
      String(index + 1),
      item.name,
      formatNumber(item.opens),
      percentage.toLocaleString('vi-VN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + '%'
    ].forEach(value => {
      const td = create('td', value);
      td.style.padding = '10px';
      td.style.borderBottom = '1px solid #e8ddd4';
      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(thead, tbody);
  content.append(table);

  const note = create(
    'p',
    'Lưu ý: Đây là số lượt mở đường dẫn QR, ' +
    'không phải số khách tham quan thực tế.'
  );
  note.style.fontSize = '13px';
  note.style.marginTop = '18px';
  content.append(note);
}
