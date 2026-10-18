/**
 * Mộ Trạch Heritage V5.1.1 – Latest published news on homepage.
 * Read-only: reuses existing Supabase public.posts and public post URLs.
 * No schema changes, no browser-side privileged credentials.
 */
import { supabase } from './supabase-client.js';

const section = document.getElementById('homeLatestNews');
const grid = document.getElementById('homeLatestNewsGrid');
const heading = document.getElementById('homeLatestNewsHeading');
const description = document.getElementById('homeLatestNewsDescription');
const allLink = document.getElementById('homeLatestNewsAll');
let publishedPosts = [];

const translations = {
  vi: {
    heading: 'Tin tức mới nhất',
    description: 'Cập nhật hoạt động, câu chuyện và tư liệu mới về di sản Mộ Trạch.',
    all: 'Xem tất cả tin tức →',
    read: 'Đọc bài viết →',
    new: 'MỚI',
    imageFallback: 'Di sản Mộ Trạch',
  },
  en: {
    heading: 'Latest news',
    description: 'Recent updates, stories and discoveries about Mo Trach heritage.',
    all: 'All news →',
    read: 'Read article →',
    new: 'NEW',
    imageFallback: 'Mo Trach Heritage',
  },
};

function language() {
  const current = window.MoTrachI18n?.getLanguage?.();
  if (current === 'vi' || current === 'en') return current;
  try { return localStorage.getItem('motrach-language') === 'en' ? 'en' : 'vi'; }
  catch { return 'vi'; }
}

function localized(post, field, lang) {
  const english = post[`${field}_en`];
  return String(lang === 'en' && typeof english === 'string' && english.trim()
    ? english.trim() : post[field] || '').trim();
}

function urlForImage(value) {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}

function displayDate(post, lang) {
  const raw = post.published_at || post.created_at;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date);
}

function isNew(post) {
  if (!post.published_at) return false;
  const time = new Date(post.published_at).getTime();
  return Number.isFinite(time) && time <= Date.now() && Date.now() - time <= 7 * 86400000;
}

function createElement(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined) el.textContent = value;
  return el;
}

function card(post, index, lang) {
  const label = translations[lang];
  const title = localized(post, 'title', lang);
  const excerpt = localized(post, 'excerpt', lang);
  const href = `pages/post.html?slug=${encodeURIComponent(post.slug)}`;

  const article = createElement('article', `home-news-card ${index === 0 ? 'home-news-featured' : ''}`);
  const mediaLink = createElement('a', 'home-news-media');
  mediaLink.href = href;
  mediaLink.setAttribute('aria-label', title);
  const imageUrl = urlForImage(post.cover_image_url);
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = title;
    image.loading = 'lazy';
    image.decoding = 'async';
    mediaLink.appendChild(image);
  } else {
    const placeholder = createElement('span', 'home-news-image-placeholder', '📰');
    placeholder.setAttribute('aria-label', label.imageFallback);
    mediaLink.appendChild(placeholder);
  }
  article.appendChild(mediaLink);

  const body = createElement('div', 'home-news-body');
  const meta = createElement('div', 'home-news-meta');
  if (isNew(post)) meta.appendChild(createElement('span', 'home-news-badge', label.new));
  const date = displayDate(post, lang);
  if (date) meta.appendChild(createElement('time', 'home-news-date', `📅 ${date}`));
  body.appendChild(meta);

  const h3 = document.createElement('h3');
  h3.className = 'home-news-card-title';
  const titleLink = document.createElement('a');
  titleLink.href = href;
  titleLink.textContent = title;
  h3.appendChild(titleLink);
  body.appendChild(h3);

  if (excerpt) {
    const paragraph = createElement('p', 'home-news-excerpt', excerpt);
    body.appendChild(paragraph);
  }
  const more = createElement('a', 'home-news-read-more', label.read);
  more.href = href;
  body.appendChild(more);
  article.appendChild(body);
  return article;
}

function render() {
  if (!section || !grid) return;
  if (!publishedPosts.length) {
    section.hidden = true;
    grid.replaceChildren();
    return;
  }
  const lang = language();
  const t = translations[lang];
  heading.textContent = t.heading;
  description.textContent = t.description;
  allLink.textContent = t.all;
  grid.replaceChildren(...publishedPosts.map((post, index) => card(post, index, lang)));
  section.hidden = false;
}

async function loadLatestNews() {
  if (!section || !grid) return;
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('title,title_en,slug,excerpt,excerpt_en,cover_image_url,published_at,created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    if (error) throw error;
    publishedPosts = (data || []).filter(post => post.title && post.slug);
    render();
  } catch (error) {
    console.error('Không tải được tin mới trên trang chủ:', error);
    // Do not break or shift the homepage if Supabase cannot be reached.
    section.hidden = true;
  }
}

// Homepage language switch emits this event on document (not on window).
document.addEventListener('motrach:languagechange', render);
loadLatestNews();
