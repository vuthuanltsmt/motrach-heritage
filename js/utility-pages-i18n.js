(() => {
  "use strict";

  // FIX v2: tránh vòng lặp MutationObserver làm trang bị treo.

  const STORAGE_KEY = "motrach-language";
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let currentLanguage = "vi";
  let mutating = false;

  const exact = new Map([
    ["Tìm kiếm - Di sản Mộ Trạch", "Search - Mo Trach Heritage"],
    ["Hỏi đáp - Di sản Mộ Trạch", "Q&A - Mo Trach Heritage"],
    ["Liên hệ - Di sản Mộ Trạch", "Contact - Mo Trach Heritage"],
    ["Ủng hộ phát triển - Di sản Mộ Trạch", "Support Development - Mo Trach Heritage"],

    ["🏛️ DI SẢN MỘ TRẠCH", "🏛️ MO TRACH HERITAGE"],
    ["🏛️ Di sản Mộ Trạch", "🏛️ Mo Trach Heritage"],
    ["🏠 Trang chủ", "🏠 Home"],
    ["← Trang chủ", "← Home"],
    ["🏛️ Di tích", "🏛️ Heritage Sites"],
    ["🗺️ Bản đồ", "🗺️ Map"],
    ["🧭 Tuyến tham quan", "🧭 Heritage Tour"],
    ["📰 Tin tức", "📰 News"],
    ["❓ Hỏi đáp", "❓ Q&A"],
    ["📬 Liên hệ", "📬 Contact"],

    ["🔎 Tìm kiếm di sản", "🔎 Search Mo Trach Heritage"],
    ["Tìm đồng thời trong tên di tích, lịch sử, mô tả, địa điểm và toàn bộ nội dung các bài viết đã xuất bản.", "Search heritage names, history, descriptions, locations and published articles."],
    ["🔎 Tìm kiếm", "🔎 Search"],
    ["Có hỗ trợ tìm không dấu và tìm gần đúng khi gõ sai nhẹ.", "Supports accent-insensitive and approximate matching for minor typing errors."],
    ["Tất cả", "All"],
    ["📰 Bài viết", "📰 Articles"],
    ["Nhập từ khóa để bắt đầu tìm kiếm.", "Enter a keyword to start searching."],
    ["Công cụ tìm kiếm toàn văn", "Full-text search"],

    ["Hỏi đáp & Hướng dẫn", "Q&A & Guide"],
    ["Tìm câu trả lời nhanh về cách sử dụng Di sản Mộ Trạch, tham quan di tích, nghe thuyết minh, xem video, sử dụng bản đồ và quản trị nội dung.", "Find quick answers about using Mo Trach Heritage, visiting heritage sites, listening to audio guides, watching videos, using the map and managing content."],
    ["Xem di tích", "Explore Heritage Sites"],
    ["Khám phá các điểm di sản", "Discover heritage sites"],
    ["Tuyến tham quan", "Heritage Tour"],
    ["Đi theo các trạm di sản", "Follow the heritage stations"],
    ["Bản đồ", "Map"],
    ["Xem vị trí và chỉ đường", "View locations and directions"],
    ["Tin tức", "News"],
    ["Đọc bài viết mới", "Read the latest articles"],
    ["👥 Hướng dẫn khách tham quan", "👥 Visitor Guide"],
    ["Những câu hỏi thường gặp khi sử dụng website.", "Frequently asked questions about using the website."],

    ["🏛️ Làm thế nào để xem các di tích?", "🏛️ How can I view the heritage sites?"],
    ["Bạn vào mục", "Go to"],
    ["Di tích", "Heritage Sites"],
    ["để xem danh sách các địa điểm đang được giới thiệu trên Di sản Mộ Trạch.", "to see the places currently featured on Mo Trach Heritage."],
    ["Bạn cũng có thể chọn trực tiếp một địa điểm trên Bản đồ.", "You can also select a location directly on the Map."],
    ["🧭 Tuyến tham quan sử dụng như thế nào?", "🧭 How do I use the Heritage Tour?"],
    ["Vào mục", "Open"],
    ["để xem các điểm di sản theo thứ tự gợi ý.", "to view the heritage sites in the suggested order."],
    ["Tuyến hiện gồm: Lăng Thần → Văn Miếu Mộ Trạch → Đình làng Mộ Trạch → Chùa Diên Phúc.", "The current route is: Vu Hon Ancestral Tomb → Mo Trach Temple of Literature → Mo Trach Communal House → Dien Phuc Pagoda."],

    ["🎧 Làm thế nào để nghe thuyết minh?", "🎧 How can I listen to the audio guide?"],
    ["Mở một Trạm tham quan, tìm mục", "Open a Visitor Station and find"],
    ["🎧 Thuyết minh di tích", "🎧 Heritage Audio Guide"],
    ["rồi bấm nút Play trên trình phát âm thanh.", "then press Play in the audio player."],
    ["🎬 Làm thế nào để xem video?", "🎬 How can I watch a video?"],
    ["Trong trang Trạm tham quan, kéo đến mục", "On a Visitor Station page, scroll to"],
    ["🎬 Video giới thiệu", "🎬 Introduction Video"],
    ["và bấm Play.", "and press Play."],
    ["Nếu mạng chậm, hãy chờ một vài giây để video tải dữ liệu.", "If your connection is slow, wait a few seconds for the video to load."],

    ["📱 Mã QR tại mỗi trạm dùng để làm gì?", "📱 What is the QR code at each station for?"],
    ["Mỗi trạm có mã QR riêng. Dùng camera điện thoại hoặc ứng dụng quét QR để mở nhanh đúng trang của điểm tham quan.", "Each station has its own QR code. Use your phone camera or a QR scanning app to quickly open the correct visitor page."],
    ["🗺️ Làm thế nào để chỉ đường tới di tích?", "🗺️ How can I get directions to a heritage site?"],
    ["Bấm nút", "Select"],
    ["🧭 Chỉ đường", "🧭 Directions"],
    ["tại điểm tham quan.", "at the heritage site."],
    ["Website sẽ mở Google Maps với vị trí của di tích để bạn lựa chọn tuyến đường.", "The website will open Google Maps with the heritage site's location so you can choose a route."],

    ["📰 Tôi có thể đọc các bài viết mới ở đâu?", "📰 Where can I read new articles?"],
    ["để xem các bài viết đã được xuất bản.", "to view published articles."],
    ["❤️ Tôi muốn ủng hộ dự án thì làm thế nào?", "❤️ How can I support the project?"],
    ["Bạn có thể mở trang", "You can open the"],
    ["❤️ Ủng hộ", "❤️ Support"],
    ["để xem thông tin và mã QR.", "page to view the information and QR code."],
    ["Việc ủng hộ hoàn toàn tự nguyện và nhằm góp phần duy trì, bổ sung tư liệu và phát triển Di sản Mộ Trạch.", "Support is completely voluntary and helps maintain the website, enrich its resources and develop Mo Trach Heritage."],

    ["📱 Website có dùng được trên điện thoại không?", "📱 Can I use the website on a phone?"],
    ["Có. Các trang chính của Di sản Mộ Trạch đã được thiết kế để sử dụng trên điện thoại, máy tính bảng và máy tính.", "Yes. The main Mo Trach Heritage pages are designed for phones, tablets and computers."],
    ["🔄 Audio hoặc video không chạy thì làm gì?", "🔄 What should I do if audio or video does not play?"],
    ["Trước tiên hãy kiểm tra kết nối Internet.", "First, check your Internet connection."],
    ["Nếu vẫn chưa được, hãy tải lại trang. Trên máy tính có thể dùng", "If it still does not work, reload the page. On a computer you can use"],
    ["Trên điện thoại, hãy đóng trang rồi mở lại.", "On a phone, close the page and open it again."],

    ["🔐 Hướng dẫn quản trị", "🔐 Administration Guide"],
    ["Dành cho người quản lý nội dung website.", "For website content managers."],
    ["🔑 Quản trị viên đăng nhập ở đâu?", "🔑 Where do administrators sign in?"],
    ["Truy cập trang đăng nhập quản trị:", "Go to the administrator login page:"],
    ["Chỉ tài khoản được cấp quyền mới có thể sử dụng khu vực quản trị.", "Only authorized accounts can use the administration area."],
    ["✍️ Làm thế nào để đăng bài mới?", "✍️ How do I publish a new article?"],
    ["Sau khi đăng nhập, vào Dashboard rồi chọn", "After signing in, open the Dashboard and select"],
    ["Viết bài", "Write Article"],
    ["Nhập tiêu đề, nội dung, ảnh và các media cần thiết, sau đó chọn", "Enter the title, content, images and required media, then select"],
    ["Lưu bản nháp", "Save Draft"],
    ["hoặc", "or"],
    ["Đăng bài", "Publish"],

    ["📝 Làm thế nào để sửa hoặc xóa bài?", "📝 How do I edit or delete an article?"],
    ["Danh sách bài viết", "Article List"],
    ["Tại từng bài có các nút Xem, Sửa và Xóa.", "Each article has View, Edit and Delete controls."],
    ["🖼️ Làm thế nào để tải ảnh lên?", "🖼️ How do I upload images?"],
    ["Vào Dashboard →", "Go to Dashboard →"],
    ["Quản lý ảnh", "Image Management"],
    ["→ chọn", "→ select"],
    ["Tải file lên", "Upload File"],
    ["Hệ thống hỗ trợ JPEG, PNG và WebP.", "The system supports JPEG, PNG and WebP."],
    ["🎧🎬 Quản lý Audio và Video ở đâu?", "🎧🎬 Where do I manage Audio and Video?"],
    ["Dashboard có khu vực riêng cho", "The Dashboard has separate sections for"],
    ["Audio", "Audio"],
    ["và", "and"],
    ["Video", "Video"],
    ["Bạn có thể tải file mới, xem trước và xóa những file không còn sử dụng.", "You can upload new files, preview them and delete files that are no longer used."],
    ["⚠️ Vì sao có file media không xóa được?", "⚠️ Why can some media files not be deleted?"],
    ["Nếu file đang được một bài viết sử dụng, hệ thống sẽ chặn thao tác xóa để tránh làm hỏng nội dung trên website.", "If a file is being used by an article, the system blocks deletion to prevent broken website content."],
    ["Hãy sửa hoặc xóa liên kết media trong bài viết trước, rồi mới xóa file.", "Edit or remove the media reference from the article first, then delete the file."],
    ["💡 Lưu ý:", "💡 Note:"],
    ["Nội dung và chức năng của Di sản Mộ Trạch sẽ tiếp tục được cập nhật. Trang Hỏi đáp cũng sẽ được bổ sung khi xuất hiện những câu hỏi mới trong quá trình sử dụng.", "Mo Trach Heritage content and features will continue to be updated. The Q&A page will also be expanded as new questions arise during use."],
    ["Bắt đầu khám phá Mộ Trạch", "Start Exploring Mo Trach"],
    ["Sử dụng Tuyến tham quan để khám phá các điểm di sản, nghe thuyết minh, xem video và tìm đường tới từng địa điểm.", "Use the Heritage Tour to explore heritage sites, listen to audio guides, watch videos and get directions to each location."],
    ["🧭 Mở tuyến tham quan", "🧭 Open Heritage Tour"],

    ["Liên hệ", "Contact"],
    ["Kết nối với Di sản Mộ Trạch, gửi góp ý, đóng góp tư liệu hoặc chia sẻ những câu chuyện, hình ảnh và ký ức về quê hương Mộ Trạch.", "Connect with Mo Trach Heritage, send feedback, contribute materials, or share stories, images and memories of Mo Trach."],
    ["Thông tin liên hệ", "Contact Information"],
    ["Bạn có thể liên hệ với Di sản Mộ Trạch qua các kênh dưới đây.", "You can contact Mo Trach Heritage through the channels below."],
    ["Điện thoại", "Phone"],
    ["📞 Gọi điện", "📞 Call"],
    ["✉️ Gửi email", "✉️ Send Email"],
    ["📚 Góp tư liệu di sản", "📚 Contribute Heritage Materials"],
    ["Di sản Mộ Trạch mong muốn tiếp tục bổ sung những tư liệu có giá trị về lịch sử và văn hóa địa phương.", "Mo Trach Heritage welcomes valuable materials about local history and culture."],
    ["Bạn có thể chia sẻ:", "You can share:"],
    ["Ảnh Mộ Trạch xưa và nay.", "Photos of Mo Trach, past and present."],
    ["Tài liệu lịch sử, gia phả hoặc văn bản.", "Historical documents, genealogies or written records."],
    ["Hình ảnh các di tích.", "Images of heritage sites."],
    ["Video, audio hoặc lời kể của người cao tuổi.", "Video, audio or oral histories from elders."],
    ["Thông tin về nhân vật, danh nhân và truyền thống khoa bảng.", "Information about notable people and the scholarly tradition."],
    ["Các câu chuyện, ký ức và phong tục địa phương.", "Local stories, memories and customs."],
    ["📎 Gửi tư liệu qua Email", "📎 Send Materials by Email"],
    ["💡 Góp ý phát triển website", "💡 Website Feedback"],
    ["Nếu phát hiện thông tin chưa chính xác, liên kết không hoạt động hoặc có đề xuất chức năng mới, bạn có thể gửi góp ý.", "If you find inaccurate information, broken links or have suggestions for new features, you can send feedback."],
    ["Những phản hồi của cộng đồng là nguồn thông tin quan trọng giúp Di sản Mộ Trạch tiếp tục hoàn thiện.", "Community feedback is an important source of information that helps Mo Trach Heritage continue to improve."],
    ["Email tiếp nhận:", "Contact email:"],
    ["Điện thoại:", "Phone:"],
    ["Zalo:", "Zalo:"],
    ["📌 Lưu ý về tư liệu đóng góp:", "📌 Note on contributed materials:"],
    ["Khi gửi hình ảnh, video hoặc tài liệu, vui lòng cung cấp thêm thông tin về nguồn, thời gian, địa điểm và nội dung liên quan nếu có. Điều này giúp việc xác minh và giới thiệu tư liệu chính xác hơn.", "When sending images, videos or documents, please include source, date, location and related information when available. This helps verify and present the materials more accurately."],
    ["Hỏi đáp", "Q&A"],
    ["Ủng hộ dự án", "Support the Project"],

    ["Ủng hộ phát triển website", "Support Website Development"],
    ["Nếu bạn thấy Di sản Mộ Trạch hữu ích, bạn có thể ủng hộ một khoản tùy tâm để góp phần duy trì và phát triển không gian di sản số này.", "If you find Mo Trach Heritage useful, you may make a voluntary contribution to help maintain and develop this digital heritage space."],
    ["Mỗi sự ủng hộ là một nguồn động viên để website tiếp tục bổ sung tư liệu, hình ảnh, thuyết minh và các nội dung về lịch sử – văn hóa Mộ Trạch.", "Every contribution encourages continued additions of documents, images, audio guides and content about Mo Trach history and culture."],
    ["📱 Quét mã QR để ủng hộ", "📱 Scan the QR Code to Support"],
    ["Mở ứng dụng ngân hàng, chọn quét QR và nhập số tiền bạn muốn ủng hộ.", "Open your banking app, scan the QR code and enter the amount you wish to contribute."],
    ["Ngân hàng", "Bank"],
    ["Chủ tài khoản", "Account Holder"],
    ["Số tài khoản", "Account Number"],
    ["Nội dung gợi ý", "Suggested Transfer Note"],
    ["📋 Sao chép số tài khoản", "📋 Copy Account Number"],
    ["❤️ Xin chân thành cảm ơn!", "❤️ Thank You Very Much!"],
    ["Sự đồng hành của bạn là nguồn động lực để Di sản Mộ Trạch tiếp tục hoàn thiện, lưu giữ và lan tỏa các giá trị lịch sử – văn hóa của quê hương.", "Your support helps Mo Trach Heritage continue to improve, preserve and share the historical and cultural values of the community."],
    ["Việc ủng hộ hoàn toàn tự nguyện. Bạn có thể sử dụng website bình thường mà không cần đóng góp.", "Support is completely voluntary. You can use the website normally without making a contribution."],
    ["© 2026 Di sản Mộ Trạch · Không gian di sản số", "© 2026 Mo Trach Heritage · Digital Heritage Space"],

    ["Không gian di sản số", "Digital Heritage Space"],
    ["Làng Tiến sĩ – Đất học – Đất văn hiến", "Village of Scholars – A Land of Learning and Culture"],
    ["© 2026 Di sản Mộ Trạch", "© 2026 Mo Trach Heritage"],

    ["Lăng Thần", "Vu Hon Ancestral Tomb"],
    ["Văn Miếu Mộ Trạch", "Mo Trach Temple of Literature"],
    ["Đình làng Mộ Trạch", "Mo Trach Communal House"],
    ["Chùa Diên Phúc", "Dien Phuc Pagoda"],
    ["Di tích lịch sử", "Historical heritage site"],
    ["Di tích văn hóa", "Cultural heritage site"],
    ["Di tích kiến trúc", "Architectural heritage site"],
    ["Di tích tôn giáo", "Religious heritage site"],

    ["✅ Đã sao chép số tài khoản.", "✅ Account number copied."],
    ["Không thể tải dữ liệu tìm kiếm lúc này.", "Unable to load search data at this time."],
    ["Đang tải dữ liệu tìm kiếm...", "Loading search data..."],
    ["Chưa tìm thấy nội dung phù hợp.", "No matching content found."],
    ["Thử từ khóa ngắn hơn, bỏ bớt từ hoặc tìm không dấu.", "Try a shorter keyword, remove some words, or search without accents."],
    ["Xem di tích →", "View heritage site →"],
    ["Đọc bài →", "Read article →"]
  ]);

  const attrExact = new Map([
    ["Mở menu", "Open menu"],
    ["Nhập từ khóa tìm kiếm", "Enter a search keyword"],
    ["Lọc kết quả", "Filter results"],
    ["Ví dụ: Vũ Hồn, khoa bảng, Chùa Diên Phúc...", "Example: Vu Hon, scholarship, Dien Phuc Pagoda..."],
    ["Công cụ tìm kiếm toàn văn trên Di sản Mộ Trạch.", "Full-text search across Mo Trach Heritage."],
    ["Hướng dẫn sử dụng và các câu hỏi thường gặp trên website Di sản Mộ Trạch.", "Usage guide and frequently asked questions for Mo Trach Heritage."],
    ["Liên hệ, góp ý và đóng góp tư liệu cho dự án Di sản Mộ Trạch.", "Contact, feedback and heritage material contributions for Mo Trach Heritage."],
    ["Ủng hộ phát triển và duy trì không gian di sản số Di sản Mộ Trạch.", "Support the development and maintenance of the Mo Trach digital heritage space."],
    ["QR ủng hộ phát triển Di sản Mộ Trạch", "QR code to support Mo Trach Heritage"]
  ]);

  function normalize(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function translateDynamic(value) {
    let text = String(value ?? "");

    text = text.replace(
      /Đã lập chỉ mục\s+(\d+)\s+nội dung\./g,
      "Indexed $1 items."
    );
    text = text.replace(
      /Tìm thấy\s+(\d+)\s+kết quả cho\s+“([^”]*)”\./g,
      "Found $1 results for “$2”."
    );
    text = text.replace(
      /Không tìm thấy kết quả phù hợp cho\s+“([^”]*)”\./g,
      "No matching results for “$1”."
    );
    text = text.replace(
      /^Số tài khoản:\s*/g,
      "Account number: "
    );

    return text;
  }

  function translateTextValue(original) {
    const raw = String(original ?? "");
    const collapsed = normalize(raw);
    const translated = exact.get(collapsed);

    if (translated !== undefined) {
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      return leading + translated + trailing;
    }

    return translateDynamic(raw);
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
      const nextValue =
        currentLanguage === "en"
          ? translateTextValue(vi)
          : vi;

      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE &&
        node.nodeType !== Node.DOCUMENT_NODE &&
        node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return;
    }

    const processElement = (el) => {
      ["placeholder", "aria-label", "alt", "title", "content"].forEach(attr => {
        if (!el.hasAttribute || !el.hasAttribute(attr)) return;

        const originals = ensureOriginalAttr(el, attr);
        const vi = originals.get(attr);
        if (vi == null) return;

        if (currentLanguage === "en") {
          const translated =
            attrExact.get(normalize(vi)) ??
            exact.get(normalize(vi)) ??
            translateDynamic(vi);
          el.setAttribute(attr, translated);
        } else {
          el.setAttribute(attr, vi);
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
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
  }

  function updateDocumentTitle() {
    if (!originalAttrs.has(document.documentElement)) {
      originalAttrs.set(document.documentElement, new Map());
    }

    const file = window.location.pathname.split("/").pop().toLowerCase();
    const titles = {
      "tim-kiem.html": ["Tìm kiếm - Di sản Mộ Trạch", "Search - Mo Trach Heritage"],
      "hoi-dap.html": ["Hỏi đáp - Di sản Mộ Trạch", "Q&A - Mo Trach Heritage"],
      "lien-he.html": ["Liên hệ - Di sản Mộ Trạch", "Contact - Mo Trach Heritage"],
      "donate.html": ["Ủng hộ phát triển - Di sản Mộ Trạch", "Support Development - Mo Trach Heritage"]
    };

    if (titles[file]) {
      document.title =
        currentLanguage === "en"
          ? titles[file][1]
          : titles[file][0];
    }
  }

  function createSwitcher() {
    if (document.querySelector(".utility-language-switcher")) return;

    const host =
      document.querySelector(".search-header .header-inner") ||
      document.querySelector(".faq-header .faq-header-inner") ||
      document.querySelector(".contact-header .header-inner") ||
      document.querySelector(".topbar .topbar-inner");

    if (!host) return;

    const switcher = document.createElement("div");
    switcher.className = "utility-language-switcher";
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

  function injectStyle() {
    if (document.getElementById("utility-i18n-style")) return;

    const style = document.createElement("style");
    style.id = "utility-i18n-style";
    style.textContent = `
      .utility-language-switcher {
        display:flex;
        align-items:center;
        gap:6px;
        flex-shrink:0;
        margin-left:8px;
      }
      .utility-language-switcher button {
        border:1px solid rgba(255,255,255,.78);
        background:transparent;
        color:#fff;
        font-size:14px;
        font-weight:800;
        padding:7px 10px;
        border-radius:7px;
        cursor:pointer;
      }
      .utility-language-switcher button.active,
      .utility-language-switcher button:hover {
        background:#fff;
        color:#800000;
      }
      @media(max-width:850px) {
        .utility-language-switcher {
          margin-left:auto;
        }
      }
      @media(max-width:550px) {
        .utility-language-switcher button {
          font-size:12px;
          padding:6px 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function updateSwitcher() {
    document
      .querySelectorAll(".utility-language-switcher [data-lang]")
      .forEach(button => {
        const active = button.dataset.lang === currentLanguage;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
  }

  function applyLanguage(lang) {
    currentLanguage = lang === "en" ? "en" : "vi";
    localStorage.setItem(STORAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage;

    mutating = true;
    translateNode(document.body);
    updateDocumentTitle();
    updateSwitcher();
    mutating = false;
  }

  function startObserver() {
    const observer = new MutationObserver(mutations => {
      if (mutating) return;

      mutating = true;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach(added => {
          translateNode(added);
        });
      }

      updateSwitcher();
      mutating = false;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
