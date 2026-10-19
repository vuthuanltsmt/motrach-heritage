# HƯỚNG DẪN – THỐNG KÊ QR V3 | DI SẢN MỘ TRẠCH

## I. Mục tiêu
Nâng cấp từ QR V2 (tổng lượt mở, hôm nay, 7 ngày) lên bảng điều khiển **thống kê theo ngày/di tích**, biểu đồ 7–30–90 ngày, lọc khoảng ngày tùy chọn (tối đa 366 ngày) và xuất **CSV UTF-8 mở được trong Microsoft Excel**. Lượt mở QR là lượt mở đường dẫn theo cách khử trùng lặp của QR V2 (cùng mã phiên/di tích trong 30 phút), **không phải số người độc lập, khách tham quan, hay số lần camera quét được xác minh**.

## II. Cấu trúc bản cập nhật
```text
admin/qr-stats.html                TRANG MỚI – báo cáo thống kê QR
css/qr-stats.css                  TỆP MỚI – giao diện thống kê
js/admin-qr-stats.js             TỆP MỚI – biểu đồ, lọc, xuất Excel CSV
sql/004_qr_advanced_analytics.sql SQL MỚI – hàm thống kê có phân quyền
```
Không ghi đè tệp cũ. Không cần chép thư mục `sql/` lên GitHub. Chỉ chạy SQL qua Supabase SQL Editor.

## III. Bước 1 – Sao lưu mã nguồn
Mở terminal ở thư mục `motrach-heritage`:
```powershell
git status -sb
```
Nếu không có thay đổi chưa lưu quan trọng, có thể tạo nhánh dự phòng:
```powershell
git branch backup-before-qr-stats-v3
```

## IV. Bước 2 – Cài SQL (chỉ 1 lần)
1. Mở Supabase → dự án `motrach-heritage` → SQL Editor → New query.
2. Mở `sql/004_qr_advanced_analytics.sql`, sao chép **toàn bộ** nội dung và dán vào SQL Editor.
3. Nhấn **Run**. Kết quả mong đợi: `Success. No rows returned`.
4. Không chạy lại tệp `003_qr_management.sql`, không xóa bảng QR V2. Tệp 004 chỉ bổ sung hàm `public.get_qr_daily_report(p_from,p_to)`.
5. Chức năng **chỉ đọc dữ liệu tổng hợp** của `private.heritage_qr_open_events` và giới hạn quản trị viên (`public.admins`, `auth.uid()`). Không cấp quyền cho `anon`. Trên SQL Editor có thể không có `auth.uid()`, nên **không** gọi thử hàm bằng SELECT khi đang ở SQL Editor.

## V. Bước 3 – Chép 3 tệp mới vào Visual Studio Code
Sao chép (KHÔNG ghi đè tệp cũ):
- `admin/qr-stats.html`
- `css/qr-stats.css`
- `js/admin-qr-stats.js`

Mở trang qua **Live Server**, ví dụ:
`http://127.0.0.1:5500/admin/qr-stats.html`
(Đổi cổng nếu Live Server đang dùng cổng khác.)

Đăng nhập quản trị nếu cần. Nếu thành công, giao diện sẽ hiển thị số liệu thực từ Supabase (bao gồm các lượt mở QR đã có). Bấm **7 ngày**, **30 ngày**, **90 ngày**, **Tháng này**, chọn di tích và thử **Xuất Excel (CSV)**.

## VI. Bước 4 – Thêm mục thống kê vào menu (chỉ sau khi kiểm thử thành công)
Mở `admin/index.html`, tìm mục Quản lý QR và chèn sau mục đó:
```html
<a href="qr-stats.html">📊 Thống kê QR</a>
```
Chỉ thêm nếu menu chưa có liên kết `qr-stats.html` để tránh trùng. Sau đó lưu Ctrl+S, tải lại trang quản trị trên Live Server.

Có thể bổ sung nút về báo cáo trong `admin/qr.html` nhưng **không bắt buộc**. Trang mới đã có nút quay lại trang quản lý QR.

## VII. Bước 5 – Chuẩn bị GitHub (sau khi đã kiểm thử)
Trong Terminal:
```powershell
git add admin/qr-stats.html css/qr-stats.css js/admin-qr-stats.js admin/index.html
git diff --cached --name-only
git diff --cached --check
git commit -m "Add QR analytics V3 dashboard"
git fetch origin
git status -sb
```
Nếu `main...origin/main [ahead 1]` và không có `behind`, chạy:
```powershell
git push origin main
```
Nếu có `behind`, DỪNG để đồng bộ an toàn, không dùng `--force`.

Sau khi GitHub Pages báo build thành công, mở:
`https://vuthuanltsmt.github.io/motrach-heritage/admin/qr-stats.html`

## VIII. Kiểm thử/nghiệm thu
- [ ] Hàm SQL tạo thành công.
- [ ] Trang thống kê kiểm tra quyền quản trị (không cho người chưa đăng nhập đọc dữ liệu).
- [ ] Số liệu lịch sử QR trước khi nâng cấp vẫn giữ nguyên, ví dụ 4 lượt thử nghiệm đã ghi nhận.
- [ ] Tùy chọn 7/30/90 ngày cho số liệu đúng trong khoảng chọn.
- [ ] Lọc theo từng di tích và bảng theo ngày đúng.
- [ ] CSV mở bằng Excel hiển thị tiếng Việt có dấu và tổng cộng chính xác.
- [ ] QR V2 vẫn mở đúng, Banner V2 và thống kê website vẫn hoạt động.

## IX. Những lưu ý quan trọng
1. Đây là **thống kê lượt mở đường dẫn** từ ngày triển khai QR V2, không thể tự tái tạo lượt truy cập QR trước đó.
2. Nếu CSV hiển thị trong một cột khi mở bằng Excel, dùng **Data → From Text/CSV**, chọn UTF-8 và dấu phân tách `;`.
3. CSV không phải định dạng `.xlsx`, nhưng mở được trong Excel; bản V3 dùng CSV để không phụ thuộc thư viện bên ngoài.
4. Không chia sẻ `service_role` key, mật khẩu hoặc thông tin đăng nhập khi gửi ảnh màn hình.
