/**
 * Mo Trach Heritage – Cinematic hero v2 (Supabase-managed banners).
 * Works on GitHub Pages. Existing hero, links, translations, and visitor tracking remain intact.
 * If Supabase is temporarily unavailable, use the four original local slides.
 */
(() => {
  'use strict';
  const LOCAL_SLIDES = [
    { image_url: 'images/gallery/lang-than%202.jpg', title_vi: 'Lăng Thần – Mộ cụ Vũ Hồn', title_en: 'Ancestral Shrine – Vu Hon', description_vi: 'Khám phá dấu ấn nguồn cội của làng Mộ Trạch.', description_en: 'Explore the origins of Mo Trach village.', duration_ms: 6500 },
    { image_url: 'images/van-mieu.jpg', title_vi: 'Miếu Mộ Trạch', title_en: 'Mo Trach Temple of Literature', description_vi: 'Truyền thống hiếu học và khoa bảng.', description_en: 'A legacy of learning and scholarship.', duration_ms: 6500 },
    { image_url: 'images/dinh-lang.jpg', title_vi: 'Đình làng Mộ Trạch', title_en: 'Mo Trach Communal House', description_vi: 'Không gian lưu giữ văn hóa cộng đồng.', description_en: 'A place preserving community heritage.', duration_ms: 6500 },
    { image_url: 'images/chua-dien-phuc.jpg', title_vi: 'Chùa Diên Phúc', title_en: 'Dien Phuc Pagoda', description_vi: 'Một điểm đến trong hành trình khám phá di sản.', description_en: 'A stop along the heritage journey.', duration_ms: 6500 }
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function imageUrl(value) {
    try {
      const url = new URL(value, document.baseURI);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }
  function language() {
    const current = document.querySelector('.language-switcher [data-lang][aria-pressed="true"]');
    return current?.dataset.lang || document.documentElement.lang || 'vi';
  }
  function initialize(slides) {
    const hero = document.querySelector('section.hero');
    if (!hero || hero.dataset.cinemaReady === 'true' || !slides.length) return;
    const stage = document.createElement('div'); stage.className = 'cinema-stage'; stage.setAttribute('aria-hidden', 'true');
    const frames = slides.map((slide, index) => {
      const frame = document.createElement('div');
      frame.className = 'cinema-frame' + (index === 0 ? ' is-active' : '');
      frame.style.backgroundImage = `url(${JSON.stringify(slide._imageUrl)})`;
      stage.appendChild(frame); return frame;
    });
    hero.insertBefore(stage, hero.firstChild);
    hero.classList.add('cinema-hero');
    hero.dataset.cinemaReady = 'true';

    const caption = document.createElement('div'); caption.className = 'cinema-caption'; caption.setAttribute('aria-live', 'off');
    const capTitle = document.createElement('strong'); const capDescription = document.createElement('span');
    caption.append(capTitle, capDescription); hero.appendChild(caption);

    const controls = document.createElement('div'); controls.className = 'cinema-controls';
    controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Điều khiển Banner / Banner controls');
    const dots = document.createElement('div'); dots.className = 'cinema-dots';
    function makeButton(cls, text, label) {
      const el = document.createElement('button'); el.type = 'button'; el.className = cls;
      el.textContent = text; el.title = label; el.setAttribute('aria-label', label); return el;
    }
    const prev = makeButton('cinema-arrow', '‹', 'Ảnh trước / Previous');
    const next = makeButton('cinema-arrow', '›', 'Ảnh tiếp / Next');
    const pause = makeButton('cinema-play-toggle', 'Ⅱ', 'Tạm dừng / Pause');
    const dotButtons = slides.map((slide, index) => {
      const dot = makeButton('cinema-dot', '', `Ảnh ${index + 1}: ${slide.title_vi || ''}`);
      dots.appendChild(dot); return dot;
    });
    controls.append(prev, dots, next, pause); hero.appendChild(controls);
    let current = 0;
    let paused = reducedMotion.matches;
    let timeout = null;
    function updateCaption() {
      const slide = slides[current];
      const en = language().toLowerCase().startsWith('en');
      capTitle.textContent = (en && slide.title_en) || slide.title_vi || '';
      capDescription.textContent = (en && slide.description_en) || slide.description_vi || '';
      caption.hidden = !(capTitle.textContent || capDescription.textContent);
    }
    function render(index) {
      current = (index + slides.length) % slides.length;
      frames.forEach((frame, i) => {
        if (i === current) frame.style.animationDuration = `${Number(slides[i].duration_ms) || 6500}ms`;
        frame.classList.toggle('is-active', i === current);
      });
      dotButtons.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-current', active);
        dot.setAttribute('aria-pressed', String(active));
      });
      updateCaption();
    }
    function stop() { if (timeout !== null) window.clearTimeout(timeout); timeout = null; }
    function start() {
      stop();
      if (!paused && !document.hidden && slides.length > 1) {
        const duration = Math.min(20000, Math.max(3000, Number(slides[current].duration_ms) || 6500));
        timeout = window.setTimeout(() => { render(current + 1); start(); }, duration);
      }
    }
    function updatePause() {
      pause.textContent = paused ? '▶' : 'Ⅱ';
      pause.title = paused ? 'Tiếp tục / Resume' : 'Tạm dừng / Pause';
      pause.setAttribute('aria-label', pause.title); pause.setAttribute('aria-pressed', String(paused));
    }
    prev.addEventListener('click', () => { render(current - 1); start(); });
    next.addEventListener('click', () => { render(current + 1); start(); });
    dotButtons.forEach((dot, i) => dot.addEventListener('click', () => { render(i); start(); }));
    pause.addEventListener('click', () => { paused = !paused; updatePause(); start(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    document.addEventListener('click', event => {
      if (event.target.closest('.language-switcher [data-lang]')) {
        window.setTimeout(updateCaption, 0);
      }
    });
    reducedMotion.addEventListener?.('change', event => { paused = event.matches; updatePause(); start(); });
    render(0); updatePause(); start();
  }

  async function getBanners() {
    try {
      const { supabase } = await import('./supabase-client.js');
      const { data, error } = await supabase.from('site_banners')
        .select('image_url,title_vi,title_en,description_vi,description_en,duration_ms')
        .eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Không đọc được Banner Supabase, đang dùng ảnh gốc của website.', error);
      return LOCAL_SLIDES;
    }
  }

  async function boot() {
    const slides = (await getBanners()).map(item => ({ ...item, _imageUrl: imageUrl(item.image_url) }))
      .filter(item => item._imageUrl);
    // No active DB banners: original static hero remains visible, no slideshow.
    initialize(slides);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
