(() => {
  "use strict";

  const STORAGE_KEY = "motrach-language";

  const COMMON = {
    vi: {
      introTitle: "📖 Giới thiệu",
      historyTitle: "📜 Lịch sử",
      audioTitle: "🎧 THUYẾT MINH DI TÍCH",
      videoTitle: "🎬 Video giới thiệu",
      qrTitle: "📱 Quét mã tham quan",
      detailBtn: "📖 XEM ĐẦY ĐỦ THÔNG TIN DI TÍCH",
      homeBtn: "🏠 VỀ TRANG CHỦ",
      brand: "🏛️ DI SẢN MỘ TRẠCH",
      footerSpace: "Không gian di sản số Mộ Trạch"
    },
    en: {
      introTitle: "📖 Introduction",
      historyTitle: "📜 History",
      audioTitle: "🎧 HERITAGE AUDIO GUIDE",
      videoTitle: "🎬 Introduction Video",
      qrTitle: "📱 Scan to Visit",
      detailBtn: "📖 VIEW FULL HERITAGE INFORMATION",
      homeBtn: "🏠 BACK TO HOME",
      brand: "🏛️ MO TRACH HERITAGE",
      footerSpace: "Mo Trach Digital Heritage Space"
    }
  };

  const STATIONS = {
    "tram-lang-than.html": {
      vi: {
        title: "Lăng Thần - Di sản Mộ Trạch",
        h1: "🏛️ LĂNG THẦN",
        subtitle: "Mộ cụ Đức Thủy tổ Vũ Hồn",
        alt: "Lăng Thần - Mộ cụ Vũ Hồn",
        intro: [
          "Lăng Thần là nơi an táng Đức Thủy tổ Vũ Hồn, người khai sáng làng Mộ Trạch.",
          "Lăng Thần là một trong những di tích linh thiêng của Mộ Trạch. Hàng năm con cháu họ Vũ và du khách thập phương đến dâng hương tưởng niệm Đức Thủy tổ Vũ Hồn."
        ],
        audioPrompt: "Bấm nút bên dưới để nghe thuyết minh về Lăng Thần.",
        qrText: "Quét mã QR để mở nhanh Trạm tham quan Lăng Thần.",
        qrAlt: "Mã QR Trạm tham quan Lăng Thần",
        buttons: [
          "🗺️ XEM VỊ TRÍ LĂNG THẦN",
          "📖 XEM ĐẦY ĐỦ THÔNG TIN DI TÍCH",
          "🏠 VỀ TRANG CHỦ"
        ]
      },
      en: {
        title: "Vu Hon Ancestral Tomb - Mo Trach Heritage",
        h1: "🏛️ VU HON ANCESTRAL TOMB",
        subtitle: "Tomb of Ancestor Vu Hon",
        alt: "Vu Hon Ancestral Tomb",
        intro: [
          "The Ancestral Tomb is the burial place of Ancestor Vu Hon, regarded as the founder of Mo Trach village.",
          "The Ancestral Tomb is one of Mo Trach's sacred heritage sites. Each year, descendants of the Vu family and visitors come to offer incense in remembrance of Ancestor Vu Hon."
        ],
        audioPrompt: "Use the player below to listen to the audio guide for the Vu Hon Ancestral Tomb.",
        qrText: "Scan the QR code to quickly open the Vu Hon Ancestral Tomb visitor station.",
        qrAlt: "QR code for the Vu Hon Ancestral Tomb visitor station",
        buttons: [
          "🗺️ VIEW VU HON ANCESTRAL TOMB ON MAP",
          "📖 VIEW FULL HERITAGE INFORMATION",
          "🏠 BACK TO HOME"
        ]
      }
    },

    "tram-van-mieu.html": {
      vi: {
        title: "Văn Miếu Mộ Trạch - Di sản Mộ Trạch",
        h1: "🏛️ VĂN MIẾU MỘ TRẠCH",
        subtitle: "Không gian văn hóa – khoa bảng",
        alt: "Văn Miếu Mộ Trạch",
        intro: [
          "Văn Miếu Mộ Trạch là không gian văn hóa gắn với truyền thống khoa bảng, hiếu học và những giá trị đặc sắc của làng Mộ Trạch.",
          "Mộ Trạch từ lâu được biết đến là vùng đất khoa bảng nổi tiếng, gắn với truyền thống hiếu học và nhiều thế hệ người đỗ đạt."
        ],
        audioPrompt: "Bấm nút bên dưới để nghe thuyết minh về Văn Miếu Mộ Trạch.",
        qrText: "Quét mã QR để mở nhanh Trạm tham quan Văn Miếu Mộ Trạch.",
        qrAlt: "Mã QR Trạm tham quan Văn Miếu Mộ Trạch",
        buttons: [
          "🗺️ XEM VỊ TRÍ VĂN MIẾU MỘ TRẠCH",
          "📖 XEM ĐẦY ĐỦ THÔNG TIN DI TÍCH",
          "🏠 VỀ TRANG CHỦ"
        ]
      },
      en: {
        title: "Mo Trach Temple of Literature - Mo Trach Heritage",
        h1: "🏛️ MO TRACH TEMPLE OF LITERATURE",
        subtitle: "Cultural and Scholarly Space",
        alt: "Mo Trach Temple of Literature",
        intro: [
          "The Mo Trach Temple of Literature is a cultural space associated with the village's tradition of scholarship, learning and distinctive cultural values.",
          "Mo Trach has long been known as a village of scholarship, with a strong tradition of learning and generations of successful scholars."
        ],
        audioPrompt: "Use the player below to listen to the audio guide for the Mo Trach Temple of Literature.",
        qrText: "Scan the QR code to quickly open the Mo Trach Temple of Literature visitor station.",
        qrAlt: "QR code for the Mo Trach Temple of Literature visitor station",
        buttons: [
          "🗺️ VIEW MO TRACH TEMPLE OF LITERATURE ON MAP",
          "📖 VIEW FULL HERITAGE INFORMATION",
          "🏠 BACK TO HOME"
        ]
      }
    },

    "tram-dinh-lang.html": {
      vi: {
        title: "Đình làng Mộ Trạch - Di sản Mộ Trạch",
        h1: "🏛️ ĐÌNH LÀNG MỘ TRẠCH",
        subtitle: "Không gian sinh hoạt cộng đồng",
        alt: "Đình làng Mộ Trạch",
        intro: [
          "Đình làng Mộ Trạch là công trình kiến trúc lịch sử tiêu biểu, gắn với đời sống văn hóa và sinh hoạt cộng đồng của người dân địa phương.",
          "Đình Mộ Trạch là một công trình kiến trúc cổ tiêu biểu của làng. Công trình đã trải qua nhiều lần tu bổ nhưng vẫn giữ nhiều giá trị kiến trúc truyền thống."
        ],
        audioPrompt: "Bấm nút bên dưới để nghe thuyết minh về Đình làng Mộ Trạch.",
        qrText: "Quét mã QR để mở nhanh Trạm tham quan Đình làng Mộ Trạch.",
        qrAlt: "Mã QR Trạm tham quan Đình làng Mộ Trạch",
        buttons: [
          "🗺️ XEM VỊ TRÍ ĐÌNH LÀNG MỘ TRẠCH",
          "📖 XEM ĐẦY ĐỦ THÔNG TIN DI TÍCH",
          "🏠 VỀ TRANG CHỦ"
        ]
      },
      en: {
        title: "Mo Trach Communal House - Mo Trach Heritage",
        h1: "🏛️ MO TRACH COMMUNAL HOUSE",
        subtitle: "Community Cultural Space",
        alt: "Mo Trach Communal House",
        intro: [
          "Mo Trach Communal House is a notable historical architectural work associated with local cultural life and community activities.",
          "Mo Trach Communal House is a notable example of traditional village architecture. It has undergone several restorations while retaining many traditional architectural values."
        ],
        audioPrompt: "Use the player below to listen to the audio guide for Mo Trach Communal House.",
        qrText: "Scan the QR code to quickly open the Mo Trach Communal House visitor station.",
        qrAlt: "QR code for the Mo Trach Communal House visitor station",
        buttons: [
          "🗺️ VIEW MO TRACH COMMUNAL HOUSE ON MAP",
          "📖 VIEW FULL HERITAGE INFORMATION",
          "🏠 BACK TO HOME"
        ]
      }
    },

    "tram-chua-dien-phuc.html": {
      vi: {
        title: "Chùa Diên Phúc - Di sản Mộ Trạch",
        description: "Trạm tham quan Chùa Diên Phúc - Không gian di sản số Di sản Mộ Trạch",
        badge: "TRẠM 04",
        h1: "🏯 CHÙA DIÊN PHÚC",
        subtitle: "Không gian Phật giáo – văn hóa làng Mộ Trạch",
        alt: "Chùa Diên Phúc - Mộ Trạch",
        sectionTitles: [
          "📖 Giới thiệu",
          "📜 Lịch sử",
          "🏛️ Giá trị di sản"
        ],
        intro: [
          "Chùa Diên Phúc là một công trình văn hóa, tín ngưỡng của làng Mộ Trạch, gắn với đời sống tinh thần của cộng đồng và không gian di sản truyền thống của địa phương.",
          "Trong hệ thống các điểm tham quan của Di sản Mộ Trạch, Chùa Diên Phúc là Trạm số 04, góp phần giới thiệu thêm một không gian Phật giáo và văn hóa đặc sắc của làng.",
          "Theo tư liệu địa phương, Chùa Diên Phúc gắn với Đức Thần Tổ Vũ Hồn và được dựng để thờ Phật.",
          "Phía đông nam chùa có Giếng Rồng, một địa điểm gắn với không gian văn hóa truyền thống của làng Mộ Trạch.",
          "Trải qua thời gian, Chùa Diên Phúc đã được nhân dân địa phương gìn giữ và tu tạo, góp phần bảo tồn cảnh quan và giá trị tín ngưỡng của cộng đồng.",
          "Chùa Diên Phúc không chỉ là nơi sinh hoạt tín ngưỡng mà còn là một thành tố trong không gian văn hóa của làng Mộ Trạch.",
          "Việc đưa Chùa Diên Phúc vào tuyến tham quan số giúp người dân và du khách có thêm điều kiện tìm hiểu, tiếp cận và gìn giữ những giá trị văn hóa địa phương."
        ],
        info: [
          "<span class=\"info-label\">📍 Địa điểm:</span> Thôn Mộ Trạch, xã Đường An, thành phố Hải Phòng.",
          "<span class=\"info-label\">🧭 Tọa độ:</span> 20.8652327, 106.1671065",
          "<span class=\"info-label\">🗺️ Tuyến tham quan:</span> Trạm 04 – Chùa Diên Phúc"
        ],
        note: "💡 <strong>Di sản Mộ Trạch</strong> sẽ tiếp tục bổ sung tư liệu, hình ảnh, audio và video về Chùa Diên Phúc trong quá trình hoàn thiện kho di sản số.",
        audioPrompt: "Bấm nút bên dưới để nghe thuyết minh về Chùa Diên Phúc.",
        qrText: "Quét mã QR để mở nhanh Trạm 04 – Chùa Diên Phúc trên điện thoại.",
        qrAlt: "Mã QR Trạm tham quan Chùa Diên Phúc",
        buttons: [
          "🧭 CHỈ ĐƯỜNG ĐẾN CHÙA DIÊN PHÚC",
          "📖 XEM ĐẦY ĐỦ THÔNG TIN DI TÍCH",
          "🗺️ QUAY LẠI TUYẾN THAM QUAN",
          "🏠 VỀ TRANG CHỦ"
        ],
        footerStation: "Trạm 04 – Chùa Diên Phúc"
      },
      en: {
        title: "Dien Phuc Pagoda - Mo Trach Heritage",
        description: "Dien Phuc Pagoda visitor station - Mo Trach Digital Heritage Space",
        badge: "STATION 04",
        h1: "🏯 DIEN PHUC PAGODA",
        subtitle: "Buddhist and Cultural Space of Mo Trach",
        alt: "Dien Phuc Pagoda - Mo Trach",
        sectionTitles: [
          "📖 Introduction",
          "📜 History",
          "🏛️ Heritage Value"
        ],
        intro: [
          "Dien Phuc Pagoda is a cultural and religious site in Mo Trach, associated with the spiritual life of the community and the village's traditional heritage landscape.",
          "Within the Mo Trach Heritage visitor route, Dien Phuc Pagoda is Station 04, introducing visitors to another distinctive Buddhist and cultural space of the village.",
          "According to local materials, Dien Phuc Pagoda is associated with Ancestor Vu Hon and was established for Buddhist worship.",
          "To the southeast of the pagoda is Dragon Well, a place connected with the traditional cultural landscape of Mo Trach.",
          "Over time, Dien Phuc Pagoda has been preserved and restored by local residents, helping maintain its landscape and the community's religious values.",
          "Dien Phuc Pagoda is not only a place of religious practice but also an important element of Mo Trach's cultural landscape.",
          "Including Dien Phuc Pagoda in the digital visitor route gives residents and visitors more opportunities to learn about, access and help preserve local cultural values."
        ],
        info: [
          "<span class=\"info-label\">📍 Location:</span> Mo Trach Hamlet, Duong An Commune, Hai Phong City.",
          "<span class=\"info-label\">🧭 Coordinates:</span> 20.8652327, 106.1671065",
          "<span class=\"info-label\">🗺️ Heritage Tour:</span> Station 04 – Dien Phuc Pagoda"
        ],
        note: "💡 <strong>Mo Trach Heritage</strong> will continue to add documents, images, audio and video about Dien Phuc Pagoda as the digital heritage collection develops.",
        audioPrompt: "Use the player below to listen to the audio guide for Dien Phuc Pagoda.",
        qrText: "Scan the QR code to quickly open Station 04 – Dien Phuc Pagoda on your phone.",
        qrAlt: "QR code for the Dien Phuc Pagoda visitor station",
        buttons: [
          "🧭 DIRECTIONS TO DIEN PHUC PAGODA",
          "📖 VIEW FULL HERITAGE INFORMATION",
          "🗺️ BACK TO HERITAGE TOUR",
          "🏠 BACK TO HOME"
        ],
        footerStation: "Station 04 – Dien Phuc Pagoda"
      }
    }
  };

  function currentFileName() {
    return window.location.pathname.split("/").pop().toLowerCase();
  }

  function setText(element, value) {
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  }

  function setTexts(elements, values) {
    if (!elements || !values) return;
    Array.from(elements).forEach((element, index) => {
      if (values[index] !== undefined) {
        element.textContent = values[index];
      }
    });
  }

  function injectStyle() {
    if (document.getElementById("station-i18n-style")) return;

    const style = document.createElement("style");
    style.id = "station-i18n-style";
    style.textContent = `
      .station-language-switcher {
        position:absolute;
        top:16px;
        right:18px;
        display:flex;
        gap:6px;
        z-index:5;
      }
      .station-language-switcher button {
        border:1px solid rgba(255,255,255,.78);
        background:transparent;
        color:#fff;
        font-size:14px;
        font-weight:800;
        padding:7px 10px;
        border-radius:7px;
        cursor:pointer;
      }
      .station-language-switcher button.active,
      .station-language-switcher button:hover {
        background:#fff;
        color:#850000;
      }
      .header.station-i18n-header {
        position:relative;
        padding-left:115px;
        padding-right:115px;
      }
      @media(max-width:650px) {
        .header.station-i18n-header {
          padding-top:64px;
          padding-left:12px;
          padding-right:12px;
        }
        .station-language-switcher {
          top:14px;
          right:50%;
          transform:translateX(50%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createSwitcher() {
    const header = document.querySelector(".header");
    if (!header || header.querySelector(".station-language-switcher")) return;

    header.classList.add("station-i18n-header");

    const switcher = document.createElement("div");
    switcher.className = "station-language-switcher";
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

    header.appendChild(switcher);
  }

  function updateSwitcher(lang) {
    document.querySelectorAll(".station-language-switcher button").forEach(button => {
      const active = button.dataset.lang === lang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyStandardStation(data, common) {
    setText(document.querySelector(".header h1"), data.h1);
    setText(document.querySelector(".header > p"), data.subtitle);

    const image = document.querySelector(".hero > img");
    if (image) image.alt = data.alt;

    const directTitles = document.querySelectorAll(".content > h2");
    if (directTitles[0]) setText(directTitles[0], common.introTitle);
    if (directTitles[1]) setText(directTitles[1], common.historyTitle);

    setTexts(document.querySelectorAll(".content > p.intro"), data.intro);

    setText(document.querySelector(".audio-title"), common.audioTitle);
    setText(document.querySelector(".audio-box > p"), data.audioPrompt);
    setText(document.querySelector(".video-box h2"), common.videoTitle);

    const qr = document.querySelector(".station-qr");
    if (qr) {
      setText(qr.querySelector("h2"), common.qrTitle);
      setText(qr.querySelector("p"), data.qrText);
      const qrImage = qr.querySelector("img");
      if (qrImage) qrImage.alt = data.qrAlt;
    }

    setTexts(document.querySelectorAll(".buttons .btn"), data.buttons);

    setText(document.querySelector(".footer strong"), common.brand);
    setText(document.querySelector(".footer p"), common.footerSpace);
  }

  function applyPagodaStation(data, common) {
    setText(document.querySelector(".station-badge"), data.badge);
    setText(document.querySelector(".header h1"), data.h1);
    setText(document.querySelector(".header > p"), data.subtitle);

    const image = document.querySelector(".hero-image");
    if (image) image.alt = data.alt;

    setTexts(document.querySelectorAll(".content > h2"), data.sectionTitles);
    setTexts(document.querySelectorAll(".content > p.intro"), data.intro);

    const infoRows = document.querySelectorAll(".info-box .info-row");
    infoRows.forEach((row, index) => {
      if (data.info[index] !== undefined) {
        row.innerHTML = data.info[index];
      }
    });

    const note = document.querySelector(".heritage-note");
    if (note) note.innerHTML = data.note;

    const audioBox = document.querySelector(".audio-box");
    if (audioBox) {
      const title = audioBox.querySelector(":scope > div");
      setText(title, common.audioTitle);
      setText(audioBox.querySelector(":scope > p"), data.audioPrompt);
      setText(audioBox.querySelector(".video-box h2"), common.videoTitle);
    }

    const qr = document.querySelector(".station-qr");
    if (qr) {
      setText(qr.querySelector("h2"), common.qrTitle);
      setText(qr.querySelector("p"), data.qrText);
      const qrImage = qr.querySelector("img");
      if (qrImage) qrImage.alt = data.qrAlt;
    }

    setTexts(document.querySelectorAll(".buttons .btn"), data.buttons);

    const footer = document.querySelector(".footer");
    if (footer) {
      setText(footer.querySelector("strong"), common.brand);
      const ps = footer.querySelectorAll("p");
      if (ps[0]) setText(ps[0], data.footerStation);
      if (ps[1]) setText(ps[1], common.footerSpace);
    }
  }

  function applyLanguage(lang) {
    lang = lang === "en" ? "en" : "vi";

    const file = currentFileName();
    const station = STATIONS[file];
    if (!station) return;

    const data = station[lang];
    const common = COMMON[lang];

    document.documentElement.lang = lang;
    document.title = data.title;

    const meta = document.querySelector('meta[name="description"]');
    if (meta && data.description) {
      meta.setAttribute("content", data.description);
    }

    if (file === "tram-chua-dien-phuc.html") {
      applyPagodaStation(data, common);
    } else {
      applyStandardStation(data, common);
    }

    localStorage.setItem(STORAGE_KEY, lang);
    updateSwitcher(lang);
  }

  function init() {
    const file = currentFileName();
    if (!STATIONS[file]) return;

    injectStyle();
    createSwitcher();

    const saved = localStorage.getItem(STORAGE_KEY);
    applyLanguage(saved === "en" ? "en" : "vi");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
