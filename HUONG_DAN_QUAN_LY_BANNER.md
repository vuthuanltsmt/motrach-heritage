# MỘ TRẠCH HERITAGE – QUẢN LÝ BANNER ĐIỆN ẢNH (V2)

**Mục tiêu:** Quản trị viên có thể thêm ảnh, sửa thông tin VI/EN, thay thứ tự, ẩn/hiện, xóa Banner và thay thời gian chuyển ảnh **mà không cần Push GitHub cho mỗi lần chỉnh nội dung**.

**Kiến trúc:** GitHub Pages (HTML/CSS/JS) + Supabase Auth + bảng `public.site_banners` với RLS + Storage bucket công khai `banner-images` (đọc ảnh công khai; chỉ tài khoản nằm trong bảng `public.admins` được ghi).

## A. CÁC TỆP CỦA BẢN CẬP NHẬT

```
admin/banners.html           (mới)
css/banner-admin.css         (mới)
css/cinematic-banner.css     (thay bản Banner v1 đã có)
js/admin-banners.js          (mới)
js/cinematic-banner.js       (thay bản Banner v1 đã có)
sql/002_banner_management.sql (chỉ dùng tại Supabase, không cần Commit)
```

**Không ghi đè `index.html`, `admin/index.html`, `js/supabase-client.js`, `js/visitor-tracker.js`, các tệp mã QR hoặc các trang di tích.** Hai dòng link CSS/JS trong `index.html` đã có từ bản Banner v1 nên giữ nguyên. Trong JS mới, bộ slide gốc vẫn được dùng dự phòng nếu truy vấn Supabase lỗi.

## B. TRIỂN KHAI TỪNG BƯỚC

### 1. Sao lưu mã nguồn

Trong Terminal Visual Studio Code, ở thư mục gốc `motrach-heritage`:

```
git status -sb
git branch backup-before-banner-manager
```

Nếu đang có tệp chỉnh sửa chưa Commit khác, sao lưu trước và **chưa được ghi đè** các tệp đang sửa.

### 2. Cài đặt cơ sở dữ liệu và vùng lưu ảnh

- Mở Supabase của dự án **motrach-heritage** → **SQL Editor** → **New query**.
- Mở tệp `sql/002_banner_management.sql` trong bộ cập nhật; sao chép toàn bộ → dán vào SQL Editor → **Run**.
- Kiểm tra sau khi chạy: Supabase → Table Editor → schema **public** → bảng **site_banners** (4 dòng ảnh có sẵn); Supabase → Storage → bucket **banner-images**.
- Bảng `admins`, `posts` và dữ liệu thống kê được giữ nguyên. Chỉ tài khoản đang có quyền `admins` mới có quyền chỉnh Banner.
- Nếu SQL báo lỗi, **dừng lại, không chạy lại tùy tiện**, gửi ảnh lỗi để kiểm tra.

### 3. Chép mã nguồn vào dự án gốc

Giải nén rồi chép 5 tệp HTML/CSS/JS ở mục A vào đúng thư mục tương ứng của dự án trên máy tính.

Hai tệp `css/cinematic-banner.css`, `js/cinematic-banner.js` **thay đúng bản Banner điện ảnh đã cài trước đây**. Ba tệp còn lại là tệp mới. Không chép đè thư mục dự án gốc cả gói.

Trong `index.html`, hai dòng dưới đây **giữ nguyên** nếu đã có (không tạo dòng thứ hai):

```html
<link rel="stylesheet" href="css/cinematic-banner.css?v=1">
<script defer src="js/cinematic-banner.js?v=1"></script>
```

Nếu cần xóa cache để dùng JS/CSS v2, chỉ đổi `?v=1` thành `?v=2` trong hai dòng trên. Khuyên đổi thành v2 và nhấn Ctrl+S.

### 4. Thêm mục menu trong trang quản trị (thay đổi 1 dòng)

Mở `admin/index.html`, tìm menu `<nav class="sidebar">`, thêm một dòng **ngay sau mục Tổng quan**:

```html
<a href="banners.html">🎞️ Quản lý Banner</a>
```

Không thay toàn bộ file `admin/index.html`. Nếu VS Code báo `Failed to save: content of file is newer`, dùng **Compare / Revert**, không nhấn Overwrite vội.

### 5. Chạy thử trên máy

- Bật **Live Server** trong VS Code.
- Mở `http://127.0.0.1:5500/admin/banners.html` (đổi số cổng nếu khác), đăng nhập quản trị.
- Kiểm tra 4 ảnh gốc đã được nạp; thử đổi tên Banner, nhấn Lưu rồi tải lại trang chủ.
- Thử đổi thứ tự bằng ↑ / ↓, thử tắt rồi bật một ảnh, thử thêm một ảnh JPEG nhỏ.
- Mở trang chủ và đợi 20–30 giây kiểm tra ảnh, chuyển ngôn ngữ, nút điều hướng, thống kê lượt truy cập.
- Nếu chưa có bảng `site_banners`, trang chủ sẽ chạy Banner mặc định; quản trị sẽ báo lỗi cho đến khi chạy SQL.

### 6. Commit và Push sau khi kiểm tra ổn

Chỉ chọn các tệp cần triển khai (không dùng `git add .`):

```
git add admin/banners.html admin/index.html css/banner-admin.css css/cinematic-banner.css js/admin-banners.js js/cinematic-banner.js index.html
git diff --cached --stat
git diff --cached --check
git commit -m "Add Supabase banner management to Mo Trach Heritage"
git fetch origin
git status -sb
```

Nếu trạng thái `behind` hoặc `diverged`, **dừng lại và gửi ảnh** để đồng bộ an toàn, tuyệt đối không `git push --force`.

Nếu chỉ `ahead 1` và không `behind`, tiếp tục:

```
git push origin main
```

Mở GitHub Actions để chờ GitHub Pages xuất bản thành công. Sau đó kiểm tra:

- Website: https://vuthuanltsmt.github.io/motrach-heritage/
- Quản trị Banner: https://vuthuanltsmt.github.io/motrach-heritage/admin/banners.html

## C. GIỚI HẠN VÀ BẢO MẬT

- GitHub Pages là website tĩnh. Nội dung ảnh mới và thông tin Banner nằm trên Supabase, thay vì ghi vào các tệp trên GitHub. Không cần server backend riêng.
- Quyền thao tác được kiểm tra bằng RLS trong Supabase, không chỉ dựa vào việc ẩn trang quản trị. Không dùng `service_role` key trên website.
- Chỉ tải JPG/PNG/WebP, tối đa 5 MB/ảnh. Chỉ ảnh muốn công khai mới nên tải lên bucket `banner-images` vì đây là bucket công khai.
- Nút “Xóa” xóa một dòng Banner khỏi danh sách, **không xóa tệp ảnh gốc** trong GitHub hay Supabase Storage. Đây là lựa chọn bảo toàn tư liệu; có thể bổ sung dọn ảnh không sử dụng trong phiên bản sau.
- Bản JS có 4 ảnh gốc dự phòng khi không đọc được Supabase. Nếu tất cả ảnh bị tắt trong CSDL, Banner chuyển về nền tĩnh hiện hữu.
- Đổi ảnh/tên/thứ tự sau khi hệ thống được xuất bản không đòi hỏi chỉnh code hoặc Push GitHub. **Các nâng cấp mã nguồn mới** vẫn cần triển khai GitHub như bình thường.
- Bộ cập nhật đã kiểm tra cú pháp JS; **chưa được chạy SQL và thử với tài khoản Supabase thực tế của bạn**. Hãy làm từng bước và xác nhận giao diện trước khi Push.
