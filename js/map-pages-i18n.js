(() => {
  "use strict";

  const STORAGE_KEY = "motrach-language";
  const VI = "vi";
  const EN = "en";

  const heritage = {
    "lang-than": {
      vi: {
        name: "Lăng Thần",
        type: "Di tích lịch sử",
        description: "Quần thể lăng mộ gắn với Đức Thần Tổ Vũ Hồn, nhân vật được cộng đồng Mộ Trạch tôn kính và gắn với nguồn cội lịch sử của làng."
      },
      en: {
        name: "Vu Hon Ancestral Tomb",
        type: "Historical heritage site",
        description: "A tomb complex associated with Ancestor Vu Hon, a revered figure in the Mo Trach community and closely connected with the village's historical origins."
      }
    },
    "van-mieu-mo-trach": {
      vi: {
        name: "Văn Miếu Mộ Trạch",
        type: "Di tích văn hóa",
        description: "Không gian gắn với truyền thống khoa bảng, hiếu học và những giá trị văn hóa đặc sắc của làng Mộ Trạch."
      },
      en: {
        name: "Mo Trach Temple of Literature",
        type: "Cultural heritage site",
        description: "A place associated with Mo Trach's tradition of scholarship, learning and distinctive cultural values."
      }
    },
    "dinh-lang-mo-trach": {
      vi: {
        name: "Đình làng Mộ Trạch",
        type: "Di tích kiến trúc",
        description: "Đình làng Mộ Trạch là công trình kiến trúc lịch sử tiêu biểu, gắn với đời sống văn hóa và sinh hoạt cộng đồng của người dân địa phương."
      },
      en: {
        name: "Mo Trach Communal House",
        type: "Architectural heritage site",
        description: "Mo Trach Communal House is a notable historical architectural work associated with local cultural life and community activities."
      }
    },
    "chua-dien-phuc": {
      vi: {
        name: "Chùa Diên Phúc",
        type: "Di tích tôn giáo",
        description: "Chùa Diên Phúc là một công trình văn hóa, tín ngưỡng của làng Mộ Trạch, gắn với đời sống tinh thần của cộng đồng và không gian di sản truyền thống của địa phương."
      },
      en: {
        name: "Dien Phuc Pagoda",
        type: "Religious heritage site",
        description: "Dien Phuc Pagoda is a cultural and religious site in Mo Trach, associated with the spiritual life of the community and the village's traditional heritage landscape."
      }
    }
  };

  const viToEn = {
    "🏛️ DI SẢN MỘ TRẠCH": "🏛️ MO TRACH HERITAGE",
    "DI SẢN MỘ TRẠCH": "MO TRACH HERITAGE",
    "KHÔNG GIAN DI SẢN SỐ": "DIGITAL HERITAGE SPACE",
    "🏠 Giới thiệu": "🏠 Home",
    "🏠 Trang chủ": "🏠 Home",
    "🏛️ Di tích": "🏛️ Heritage Sites",
    "🗺️ Bản đồ": "🗺️ Map",
    "🧭 Tuyến tham quan": "🧭 Heritage Tour",

    "🗺️ Bản đồ di sản Mộ Trạch": "🗺️ Mo Trach Heritage Map",
    "Khám phá vị trí các di tích tiêu biểu trong không gian văn hóa Mộ Trạch.": "Explore notable heritage sites across the cultural landscape of Mo Trach.",
    "Chọn một địa điểm để xem vị trí trên bản đồ.": "Select a heritage site to view its location on the map.",
    "🔎 Tìm tên di tích...": "🔎 Search heritage sites...",
    "🏛️ Tất cả loại di tích": "🏛️ All heritage types",
    "⏳ Đang tải dữ liệu...": "⏳ Loading data...",
    "⏳ Đang tải danh sách di tích...": "⏳ Loading heritage sites...",
    "🗺️ Xem tất cả": "🗺️ Show all",
    "📍 Vị trí tôi": "📍 My location",
    "🗺️ Toàn bộ": "🗺️ Show all",
    "🧭 Tuyến tham quan Mộ Trạch": "🧭 Mo Trach Heritage Tour",
    "Hành trình khám phá các điểm di sản tiêu biểu của Mộ Trạch theo một tuyến tham quan thống nhất.": "Explore Mo Trach's notable heritage sites along a connected visitor route.",
    "điểm": "stops",
    "📏 Tổng tuyến:": "📏 Total route:",
    "🧭 Trạng thái:": "🧭 Status:",
    "Chưa mở tuyến": "Route not shown",
    "▶️ Bắt đầu tuyến": "▶️ Start route",
    "🗺️ Xem toàn bộ tuyến": "🗺️ View full route",
    "✕ Xóa tuyến": "✕ Clear route",

    "BƯỚC 7": "STEP 7",
    "🧭 Tuyến tham quan thông minh": "🧭 Smart Heritage Tour",
    "Khám phá các di tích Mộ Trạch theo trình tự của tuyến tham quan. Bạn có thể lần lượt di chuyển qua từng điểm ngay trên bản đồ.": "Explore Mo Trach heritage sites in route order and move through each stop directly on the map.",
    "📍 Số điểm tham quan": "📍 Number of stops",
    "📏 Tổng khoảng cách": "📏 Total distance",
    "🚶 Thời gian đi bộ": "🚶 Walking time",
    "🛵 Thời gian xe máy": "🛵 Motorbike time",
    "Tiến trình tham quan": "Tour progress",
    "Chưa bắt đầu": "Not started",
    "⏳ Đang chuẩn bị tuyến tham quan...": "⏳ Preparing the heritage tour...",
    "▶️ Bắt đầu tham quan": "▶️ Start tour",
    "▶️ Xem lại từ đầu": "▶️ Restart from beginning",
    "⬅️ Điểm trước": "⬅️ Previous stop",
    "Điểm tiếp theo ➡️": "Next stop ➡️",
    "↺ Làm lại": "↺ Reset",
    "💡 Hướng dẫn: Nhấn “Bắt đầu tham quan” để bắt đầu từ điểm số 1. Sau đó sử dụng “Điểm tiếp theo” để lần lượt khám phá các di tích. Chức năng này không yêu cầu GPS.": "💡 Guide: Select “Start tour” to begin at stop 1. Then use “Next stop” to explore each heritage site in order. This feature does not require GPS.",
    "Hướng dẫn:": "Guide:",
    "“Bắt đầu tham quan”": "“Start tour”",
    "“Điểm tiếp theo”": "“Next stop”",

    "📖 Xem chi tiết": "📖 View details",
    "Xem chi tiết": "View details",
    "📖 Chi tiết": "📖 Details",
    "📍 Xem vị trí": "📍 View location",
    "📍 Xem điểm này": "📍 View this stop",
    "📍 Xem": "📍 View",
    "🏛️ Trạm tham quan": "🏛️ Visitor station",
    "🧭 Chỉ đường": "🧭 Directions",
    "🎧 Thuyết minh": "🎧 Audio guide",
    "🎬 Video": "🎬 Video",

    "✅ Đã tham quan": "✅ Visited",
    "✓ Đã tham quan": "✓ Visited",
    "🚩 Điểm bắt đầu": "🚩 Starting point",
    "Đang hiển thị": "Showing route",
    "Đã hoàn thành tuyến": "Route completed",
    "Đã hoàn thành": "Completed",
    "Chưa có dữ liệu": "No data",
    "Chưa có dữ liệu tuyến tham quan.": "No tour data available.",
    "Không tìm thấy di tích phù hợp.": "No matching heritage sites found.",

    "⏳ Đang xác định...": "⏳ Locating...",
    "📍 Vị trí hiện tại của bạn": "📍 Your current location",
    "Thiết bị hoặc trình duyệt không hỗ trợ xác định vị trí.": "This device or browser does not support location services.",
    "Không thể xác định vị trí hiện tại.": "Unable to determine your current location.",
    "Trình duyệt chưa được cấp quyền vị trí.": "Location permission has not been granted in your browser.",
    "Không nhận được vị trí. Máy tính có thể không có GPS hoặc dịch vụ định vị.": "Unable to obtain your location. This computer may not have GPS or location services.",
    "Quá thời gian xác định vị trí. Hãy thử lại.": "Location request timed out. Please try again.",
    "Bạn vẫn có thể sử dụng đầy đủ bản đồ và tuyến tham quan Mộ Trạch.": "You can still use the Mo Trach map and heritage tour without location access.",
    "Cần ít nhất 2 di tích để tạo tuyến tham quan.": "At least two heritage sites are required to create a tour route.",

    "✅ Đã tải": "✅ Loaded",
    "di tích": "heritage sites",
    "❌ Không thể tải dữ liệu di tích.": "❌ Unable to load heritage data.",
    "❌ Không thể tải dữ liệu di tích. Kiểm tra file: data/heritage.json": "❌ Unable to load heritage data. Check file: data/heritage.json",
    "Kiểm tra:": "Check:",
    "Hãy chạy website bằng": "Please run the website using",
    "Không có dữ liệu di tích hợp lệ.": "No valid heritage data is available.",

    "🧭 BẢN ĐỒ THAM QUAN MỘ TRẠCH": "🧭 MO TRACH HERITAGE TOUR MAP",
    "Khám phá các di tích tiêu biểu của làng Mộ Trạch": "Explore the notable heritage sites of Mo Trach village",
    "🏛️ Tuyến tham quan": "🏛️ Heritage Tour",
    "TUYẾN KHÁM PHÁ DI SẢN": "HERITAGE DISCOVERY ROUTE",
    "Không gian di sản số – Làng Tiến sĩ Mộ Trạch": "Digital Heritage Space – Mo Trach, Village of Scholars",
    "Không tải được heritage.json": "Unable to load heritage.json",
    "heritage.json không có dữ liệu": "heritage.json contains no data",

    "Lăng Thần": "Vu Hon Ancestral Tomb",
    "Văn Miếu Mộ Trạch": "Mo Trach Temple of Literature",
    "Đình làng Mộ Trạch": "Mo Trach Communal House",
    "Chùa Diên Phúc": "Dien Phuc Pagoda",
    "Di tích lịch sử": "Historical heritage site",
    "Di tích văn hóa": "Cultural heritage site",
    "Di tích kiến trúc": "Architectural heritage site",
    "Di tích tôn giáo": "Religious heritage site",

    "Quần thể lăng mộ gắn với Đức Thần Tổ Vũ Hồn, nhân vật được cộng đồng Mộ Trạch tôn kính và gắn với nguồn cội lịch sử của làng.": "A tomb complex associated with Ancestor Vu Hon, a revered figure in the Mo Trach community and closely connected with the village's historical origins.",
    "Không gian gắn với truyền thống khoa bảng, hiếu học và những giá trị văn hóa đặc sắc của làng Mộ Trạch.": "A place associated with Mo Trach's tradition of scholarship, learning and distinctive cultural values.",
    "Đình làng Mộ Trạch là công trình kiến trúc lịch sử tiêu biểu, gắn với đời sống văn hóa và sinh hoạt cộng đồng của người dân địa phương.": "Mo Trach Communal House is a notable historical architectural work associated with local cultural life and community activities.",
    "Chùa Diên Phúc là một công trình văn hóa, tín ngưỡng của làng Mộ Trạch, gắn với đời sống tinh thần của cộng đồng và không gian di sản truyền thống của địa phương.": "Dien Phuc Pagoda is a cultural and religious site in Mo Trach, associated with the spiritual life of the community and the village's traditional heritage landscape."
  };

  const enToVi = Object.fromEntries(
    Object.entries(viToEn).map(([vi, en]) => [en, vi])
  );

  let currentLanguage =
    localStorage.getItem(STORAGE_KEY) === EN ? EN : VI;

  let mutationLock = false;
  let retryTimer = null;

  function getMap(lang) {
    return lang === EN ? viToEn : enToVi;
  }

  function translateString(value, lang) {
    if (value == null) return value;

    let text = String(value);
    const mapping = getMap(lang);

    const keys = Object.keys(mapping)
      .sort((a, b) => b.length - a.length);

    for (const from of keys) {
      if (text.includes(from)) {
        text = text.split(from).join(mapping[from]);
      }
    }

    if (lang === EN) {
      text = text
        .replace(/✅\s*Đã tải\s+(\d+)\s+heritage sites/g, "✅ Loaded $1 heritage sites")
        .replace(/Đã tham quan\s+(\d+)\s*\/\s*(\d+)/g, "Visited $1 / $2")
        .replace(/(\d+(?:\.\d+)?)\s*km từ điểm trước/g, "$1 km from previous stop")
        .replace(/(\d+)\s*phút/g, "$1 min")
        .replace(/Di tích\s+(\d+)/g, "Heritage Site $1");
    } else {
      text = text
        .replace(/✅\s*Loaded\s+(\d+)\s+heritage sites/g, "✅ Đã tải $1 di tích")
        .replace(/Visited\s+(\d+)\s*\/\s*(\d+)/g, "Đã tham quan $1 / $2")
        .replace(/(\d+(?:\.\d+)?)\s*km from previous stop/g, "$1 km từ điểm trước")
        .replace(/(\d+)\s*min/g, "$1 phút")
        .replace(/Heritage Site\s+(\d+)/g, "Di tích $1");
    }

    return text;
  }

  function translateTextNode(node, lang) {
    const original = node.nodeValue;
    const translated = translateString(original, lang);
    if (translated !== original) {
      node.nodeValue = translated;
    }
  }

  function translateElement(root, lang) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, lang);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE &&
        root.nodeType !== Node.DOCUMENT_NODE &&
        root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      if (root.hasAttribute("placeholder")) {
        const oldValue = root.getAttribute("placeholder");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) {
          root.setAttribute("placeholder", newValue);
        }
      }

      if (root.hasAttribute("title")) {
        const oldValue = root.getAttribute("title");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) {
          root.setAttribute("title", newValue);
        }
      }

      if (root.hasAttribute("alt")) {
        const oldValue = root.getAttribute("alt");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) {
          root.setAttribute("alt", newValue);
        }
      }
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => translateTextNode(node, lang));

    if (root.querySelectorAll) {
      root.querySelectorAll("[placeholder]").forEach(el => {
        const oldValue = el.getAttribute("placeholder");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) el.setAttribute("placeholder", newValue);
      });

      root.querySelectorAll("[title]").forEach(el => {
        const oldValue = el.getAttribute("title");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) el.setAttribute("title", newValue);
      });

      root.querySelectorAll("[alt]").forEach(el => {
        const oldValue = el.getAttribute("alt");
        const newValue = translateString(oldValue, lang);
        if (newValue !== oldValue) el.setAttribute("alt", newValue);
      });
    }
  }

  function getItemId(item) {
    if (!item) return "";

    const direct = String(item.id || item.slug || "").trim();
    if (heritage[direct]) return direct;

    const name = String(item.name || "").toLowerCase();

    if (name.includes("lăng thần") || name.includes("vu hon")) {
      return "lang-than";
    }
    if (name.includes("văn miếu") || name.includes("temple of literature")) {
      return "van-mieu-mo-trach";
    }
    if (name.includes("đình làng") || name.includes("communal house")) {
      return "dinh-lang-mo-trach";
    }
    if (name.includes("diên phúc") || name.includes("dien phuc")) {
      return "chua-dien-phuc";
    }

    return "";
  }

  function localizeMapData(lang) {
    try {
      if (typeof heritageData === "undefined" ||
          !Array.isArray(heritageData) ||
          heritageData.length === 0) {
        return false;
      }

      heritageData.forEach(item => {
        const id = getItemId(item);
        const source = heritage[id]?.[lang];

        if (!source) return;

        item.name = source.name;
        item.type = source.type;
        item.description = source.description;
      });

      const search = document.getElementById("searchInput");
      const filter = document.getElementById("typeFilter");

      if (search) search.value = "";
      if (filter) filter.value = "";

      if (typeof createTypeFilter === "function") {
        createTypeFilter();
      }

      if (typeof renderMarkers === "function") {
        renderMarkers();
      }

      if (typeof renderHeritageList === "function") {
        renderHeritageList();
      }

      if (typeof renderTourStops === "function") {
        renderTourStops();
      }

      if (typeof renderSmartTour === "function") {
        renderSmartTour();
      }

      if (typeof updateSmartTourSummary === "function") {
        updateSmartTourSummary();
      }

      if (typeof updateSmartTourProgress === "function") {
        updateSmartTourProgress();
      }

      if (typeof updateSmartTourButtons === "function") {
        updateSmartTourButtons();
      }

      return true;
    } catch (error) {
      console.warn("Map language sync:", error);
      return false;
    }
  }

  function updateDocumentTitle(lang) {
    const isTourMap =
      /map-tour\.html/i.test(window.location.pathname);

    if (isTourMap) {
      document.title =
        lang === EN
          ? "Mo Trach Heritage Tour Map"
          : "Bản đồ tham quan Mộ Trạch";
    } else {
      document.title =
        lang === EN
          ? "Mo Trach Heritage Map"
          : "Bản đồ di sản Mộ Trạch";
    }
  }

  function updateButtons(lang) {
    document
      .querySelectorAll(".language-switcher [data-lang]")
      .forEach(button => {
        const active = button.dataset.lang === lang;
        button.classList.toggle("active", active);
        button.setAttribute(
          "aria-pressed",
          active ? "true" : "false"
        );
      });
  }

  function applyLanguage(lang, options = {}) {
    currentLanguage = lang === EN ? EN : VI;
    localStorage.setItem(STORAGE_KEY, currentLanguage);

    document.documentElement.lang = currentLanguage;
    updateDocumentTitle(currentLanguage);
    updateButtons(currentLanguage);

    if (!options.skipData) {
      localizeMapData(currentLanguage);
    }

    mutationLock = true;
    translateElement(document.body, currentLanguage);
    mutationLock = false;

    scheduleDataSync();
  }

  function scheduleDataSync() {
    if (retryTimer) {
      clearTimeout(retryTimer);
    }

    let attempts = 0;

    const trySync = () => {
      attempts += 1;

      const ready = localizeMapData(currentLanguage);

      mutationLock = true;
      translateElement(document.body, currentLanguage);
      mutationLock = false;

      if (!ready && attempts < 30) {
        retryTimer = setTimeout(trySync, 300);
      }
    };

    retryTimer = setTimeout(trySync, 100);
  }

  function injectStyles() {
    if (document.getElementById("map-language-switcher-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "map-language-switcher-style";

    style.textContent = `
      .map-language-switcher-wrap {
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        flex-shrink:0;
      }

      .language-switcher {
        display:flex;
        align-items:center;
        gap:6px;
      }

      .language-switcher button {
        border:1px solid rgba(255,255,255,.78);
        background:transparent;
        color:#fff;
        font-size:14px;
        font-weight:800;
        padding:7px 10px;
        border-radius:7px;
        cursor:pointer;
      }

      .language-switcher button.active,
      .language-switcher button:hover {
        background:#fff;
        color:#850000;
      }

      body.map-tour-language-ready > header {
        position:relative;
        padding-left:120px;
        padding-right:120px;
      }

      body.map-tour-language-ready > header .map-language-switcher-wrap {
        position:absolute;
        right:24px;
        top:50%;
        transform:translateY(-50%);
      }

      .site-header .map-language-switcher-wrap {
        margin-left:auto;
      }

      @media(max-width:800px) {
        body.map-tour-language-ready > header {
          padding-left:20px;
          padding-right:20px;
          padding-top:62px;
        }

        body.map-tour-language-ready > header .map-language-switcher-wrap {
          right:50%;
          top:15px;
          transform:translateX(50%);
        }

        .site-header .header-inner {
          flex-wrap:wrap;
        }

        .site-header .map-language-switcher-wrap {
          width:100%;
          margin:8px 0 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createSwitcher() {
    if (document.querySelector(".map-language-switcher-wrap")) {
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "map-language-switcher-wrap";

    wrap.innerHTML = `
      <div class="language-switcher" aria-label="Language selector">
        <button type="button" data-lang="vi" aria-pressed="false">VI</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </div>
    `;

    const mapHeaderInner =
      document.querySelector(".site-header .header-inner");

    if (mapHeaderInner) {
      mapHeaderInner.appendChild(wrap);
    } else {
      const tourHeader =
        document.querySelector("body > header");

      if (tourHeader) {
        document.body.classList.add(
          "map-tour-language-ready"
        );
        tourHeader.appendChild(wrap);
      }
    }

    wrap
      .querySelectorAll("[data-lang]")
      .forEach(button => {
        button.addEventListener("click", () => {
          applyLanguage(button.dataset.lang);
        });
      });
  }

  const originalAlert = window.alert.bind(window);

  window.alert = function (message) {
    originalAlert(
      translateString(message, currentLanguage)
    );
  };

  function startObserver() {
    const observer = new MutationObserver(mutations => {
      if (mutationLock) return;

      mutationLock = true;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          translateElement(node, currentLanguage);
        });

        if (mutation.type === "characterData") {
          translateTextNode(
            mutation.target,
            currentLanguage
          );
        }
      }

      mutationLock = false;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function init() {
    injectStyles();
    createSwitcher();
    startObserver();

    currentLanguage =
      localStorage.getItem(STORAGE_KEY) === EN
        ? EN
        : VI;

    applyLanguage(currentLanguage);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
