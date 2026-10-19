# Banner điện ảnh – Di sản Mộ Trạch

Bản bổ sung không ghi đè `index.html`, `css/style.css`, `js/i18n.js`, `js/visitor-tracker.js`, hay tệp quản trị. Giữ nguyên bản hiện tại đã triển khai trên GitHub.

## 1. Sao lưu
Trong thư mục dự án hiện tại, tạo bản sao riêng của `index.html` trước khi sửa. Có thể kiểm tra trạng thái bằng `git status -sb`.

## 2. Chép hai tệp mới
Sao chép nội dung hai thư mục `css/`, `js/` trong tệp ZIP này vào đúng thư mục tương ứng của dự án:

- `css/cinematic-banner.css`
- `js/cinematic-banner.js`

Ảnh được sử dụng từ thư mục hiện hữu:

- `images/gallery/lang-than 2.jpg`
- `images/van-mieu.jpg`
- `images/dinh-lang.jpg`
- `images/chua-dien-phuc.jpg`

Đảm bảo 4 ảnh này vẫn tồn tại trong dự án. Ảnh Văn Miếu hiện có độ phân giải thấp hơn, có thể thay sau.

## 3. Chỉ thêm HAI dòng vào `index.html`
**A. Trong `<head>`**, ngay sau dòng `<link rel="stylesheet" href="css/i18n.css">`, thêm:

```html
<link rel="stylesheet" href="css/cinematic-banner.css?v=1">
```

**B. Cuối file**, ngay trước `</body>`, thêm:

```html
<script defer src="js/cinematic-banner.js?v=1"></script>
```

Không cần sửa thẻ `<section class="hero">`, không xóa banner cũ, không sửa các tệp khác. JavaScript chỉ tự thêm ảnh chuyển động khi trang chủ có `.hero`; banner tĩnh cũ vẫn là nền dự phòng.

## 4. Chạy thử
- Mở `index.html` qua Live Server trong VS Code.
- Kiểm tra ảnh tự chuyển sau khoảng 6,5 giây; có mờ dần và phóng to chậm.
- Thử nút qua lại, dấu chấm, tạm dừng/tiếp tục.
- Thử chuyển ngôn ngữ VI/EN, menu, nút Khám phá di tích, Bản đồ di sản, bộ đếm lượt truy cập và trang quản trị.
- Kiểm tra trên điện thoại hoặc chế độ responsive của trình duyệt.
- Nếu ảnh không hiện, kiểm tra tên tệp, đặc biệt khoảng trắng trong `lang-than 2.jpg`.

## 5. Khi chạy thử ổn định, mới cập nhật GitHub Pages
Trong Terminal ở thư mục dự án:

```powershell
git status -sb
git diff --check
git add index.html css/cinematic-banner.css js/cinematic-banner.js
git diff --cached --stat
git commit -m "Add cinematic homepage banner"
git fetch origin
git status -sb
```

Nếu thấy `behind` hoặc xung đột, dừng lại và kiểm tra trước khi push; KHÔNG dùng `git push --force`. Nếu nhánh không bị chậm so với `origin/main`, dùng `git push origin main`.

Sau khi workflow GitHub Pages hoàn thành, truy cập:
https://vuthuanltsmt.github.io/motrach-heritage/

Nhấn Ctrl+F5 để làm mới bộ nhớ đệm.

## Hoàn tác
Xóa 2 dòng vừa thêm trong `index.html`. Có thể giữ nguyên hai tệp CSS/JS không được gọi đến; website sẽ quay về banner tĩnh như cũ. KHÔNG phải sửa Supabase hay thống kê.
