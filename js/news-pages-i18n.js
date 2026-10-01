(() => {
  "use strict";

  const STORAGE_KEY = "motrach-language";
  let currentLanguage = "vi";
  let mutating = false;

  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();

  const exact = new Map([
    ["🏛️ Di sản Mộ Trạch", "🏛️ Mo Trach Heritage"],
    ["← Trang chủ", "← Home"],
    ["← Bài viết", "← Articles"],

    ["📰 Tin tức – Bài viết", "📰 News & Articles"],
    ["Những câu chuyện, tư liệu, hình ảnh và thông tin về lịch sử, văn hóa và di sản làng Mộ Trạch.", "Stories, documents, images and information about the history, culture and heritage of Mo Trach."],
    ["Bài viết mới", "Latest Articles"],
    ["Nội dung được cập nhật từ Di sản Mộ Trạch.", "Content updated by Mo Trach Heritage."],
    ["Đang tải bài viết...", "Loading articles..."],
    ["Hiện chưa có bài viết nào được xuất bản.", "No articles have been published yet."],
    ["Không thể tải danh sách bài viết lúc này.", "Unable to load the article list at this time."],
    ["Đọc bài →", "Read article →"],
    ["© Di sản Mộ Trạch", "© Mo Trach Heritage"],

    ["📷 Hình ảnh", "📷 Images"],
    ["🎧 Thuyết minh", "🎧 Audio Guide"],
    ["🎬 Video", "🎬 Video"],
    ["← Quay lại danh sách bài viết", "← Back to article list"],
    ["Không tìm thấy đường dẫn bài viết.", "Article link not found."],
    ["Bài viết không tồn tại hoặc chưa được xuất bản.", "This article does not exist or has not been published."],
    ["Không thể tải bài viết lúc này.", "Unable to load this article at this time."],
    ["Ảnh bài viết", "Article image"],

    ["Di sản Mộ Trạch", "Mo Trach Heritage"]
  ]);

  const attrExact = new Map([
    ["Ảnh bài viết", "Article image"]
  ]);

  function normalize(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function translateValue(value) {
    const raw = String(value ?? "");
    const key = normalize(raw);

    if (exact.has(key)) {
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      return leading + exact.get(key) + trailing;
    }

    return raw
      .replace(/ - Di sản Mộ Trạch$/g, " - Mo Trach Heritage")
      .replace(/ - ảnh (\d+)$/g, " - image $1");
  }

  function ensureOriginalAttr(el, attr) {
    let map = originalAttrs.get(el);
    if (!map) {
      map = new Map();
      originalAttrs.set(el, map);
    }
    if (!map.has(attr)) {
      map.set(attr, el.getAttribute(attr));
    }
    return map;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!originalText.has(node)) {
        originalText.set(node, node.nodeValue);
      }

      const vi = originalText.get(node);
      const next =
        currentLanguage === "en"
          ? translateValue(vi)
          : vi;

      if (node.nodeValue !== next) {
        node.nodeValue = next;
      }

      return;
    }

    if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }

    const processElement = (el) => {
      ["alt", "title", "aria-label"].forEach(attr => {
        if (!el.hasAttribute || !el.hasAttribute(attr)) return;

        const originals = ensureOriginalAttr(el, attr);
        const vi = originals.get(attr);
        if (vi == null) return;

        const next =
          currentLanguage === "en"
            ? (attrExact.get(normalize(vi)) ?? translateValue(vi))
            : vi;

        if (el.getAttribute(attr) !== next) {
          el.setAttribute(attr, next);
        }
      });
    };

    if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node);
    }

    if (node.querySelectorAll) {
      node.querySelectorAll("*").forEach(processElement);
    }

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(translateNode);
  }

  function injectStyle() {
    if (document.getElementById("news-i18n-style")) return;

    const style = document.createElement("style");
    style.id = "news-i18n-style";
    style.textContent = `
      .news-language-switcher {
        display:flex;
        align-items:center;
        gap:6px;
        flex-shrink:0;
        margin-left:8px;
      }
      .news-language-switcher button {
        border:1px solid rgba(255,255,255,.78);
        background:transparent;
        color:#fff;
        font-size:14px;
        font-weight:800;
        padding:7px 10px;
        border-radius:7px;
        cursor:pointer;
      }
      .news-language-switcher button.active,
      .news-language-switcher button:hover {
        background:#fff;
        color:#800000;
      }
      @media(max-width:600px) {
        .news-language-switcher {
          margin-left:auto;
        }
        .news-language-switcher button {
          font-size:12px;
          padding:6px 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createSwitcher() {
    if (document.querySelector(".news-language-switcher")) return;

    const host = document.querySelector(".topbar .topbar-inner");
    if (!host) return;

    const switcher = document.createElement("div");
    switcher.className = "news-language-switcher";
    switcher.setAttribute("aria-label", "Language selector");

    switcher.innerHTML = `
      <button type="button" data-lang="vi" aria-pressed="false">VI</button>
      <button type="button" data-lang="en" aria-pressed="false">EN</button>
    `;

    switcher.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        applyLanguage(button.dataset.lang);
      });
    });

    host.appendChild(switcher);
  }

  function updateSwitcher() {
    document
      .querySelectorAll(".news-language-switcher [data-lang]")
      .forEach(button => {
        const active = button.dataset.lang === currentLanguage;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
  }

  function updateTitle() {
    const raw = document.title;

    if (currentLanguage === "en") {
      if (raw === "Tin tức - Bài viết | Di sản Mộ Trạch") {
        document.title = "News & Articles | Mo Trach Heritage";
      } else if (raw === "Bài viết - Di sản Mộ Trạch") {
        document.title = "Article - Mo Trach Heritage";
      } else if (raw.endsWith(" - Di sản Mộ Trạch")) {
        document.title =
          raw.slice(0, -" - Di sản Mộ Trạch".length) +
          " - Mo Trach Heritage";
      }
    } else {
      if (raw === "News & Articles | Mo Trach Heritage") {
        document.title = "Tin tức - Bài viết | Di sản Mộ Trạch";
      } else if (raw === "Article - Mo Trach Heritage") {
        document.title = "Bài viết - Di sản Mộ Trạch";
      } else if (raw.endsWith(" - Mo Trach Heritage")) {
        document.title =
          raw.slice(0, -" - Mo Trach Heritage".length) +
          " - Di sản Mộ Trạch";
      }
    }
  }

  function applyLanguage(lang) {
    currentLanguage = lang === "en" ? "en" : "vi";
    localStorage.setItem(STORAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage;

    mutating = true;
    translateNode(document.body);
    updateTitle();
    updateSwitcher();
    mutating = false;
  }

  function startObserver() {
    const observer = new MutationObserver(mutations => {
      if (mutating) return;

      mutating = true;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          translateNode(node);
        });
      }

      updateTitle();
      updateSwitcher();
      mutating = false;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function startTitleSync() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      updateTitle();

      if (tries >= 20) {
        clearInterval(timer);
      }
    }, 300);
  }

  function init() {
    injectStyle();
    createSwitcher();

    currentLanguage =
      localStorage.getItem(STORAGE_KEY) === "en"
        ? "en"
        : "vi";

    startObserver();
    applyLanguage(currentLanguage);
    startTitleSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
