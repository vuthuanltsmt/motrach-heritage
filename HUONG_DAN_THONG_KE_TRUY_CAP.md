# MỘ TRẠCH HERITAGE – HƯỚNG DẪN BỔ SUNG THỐNG KÊ TRUY CẬP

## 1. Bản cập nhật có gì?

- **Trang chủ (`index.html`):** có bộ đếm "Lượt truy cập / Visits" ở cuối trang.
- **Trang quản trị (`admin/index.html`):** có 6 chỉ số: lượt truy cập hôm nay, tổng lượt truy cập, 7 ngày gần nhất, thiết bị ước tính hôm nay, thiết bị ước tính tổng cộng, tổng lượt xem trang không tính F5 trong cùng phiên; thêm biểu đồ 7 ngày và 5 trang được xem nhiều nhất.
- **16 trang công khai:** tự ghi nhận khi được mở.
- **Supabase:** lưu dữ liệu tập trung; chỉ tài khoản có trong bảng `public.admins` được xem báo cáo chi tiết.

## 2. Việc cần làm đầu tiên – tạo dữ liệu trong Supabase

> Quan trọng: Chép tệp mã nguồn lên website **chưa đủ**. Bạn phải thực hiện bước SQL này để bộ đếm hoạt động.

1. Mở trang **https://supabase.com/dashboard** và đăng nhập tài khoản sở hữu dự án Supabase hiện tại của Mộ Trạch Heritage.
2. Mở dự án chứa dữ liệu của website (đúng dự án đang dùng trong `js/supabase-client.js`).
3. Ở menu trái, chọn **SQL Editor → New query**.
4. Trong Visual Studio Code, mở tệp `sql/001_visit_statistics.sql`, nhấn **Ctrl+A**, rồi **Ctrl+C**.
5. Dán toàn bộ vào SQL Editor của Supabase và nhấn **Run**. Nếu SQL chạy thành công, các bảng và hàm thống kê đã được tạo.
6. Không dán khóa `service_role` hay mật khẩu quản trị vào mã nguồn hoặc vào cuộc trò chuyện.

Tệp SQL thiết kế để chạy lại được (CREATE IF NOT EXISTS / CREATE OR REPLACE) và không xóa dữ liệu thống kê cũ.

## 3. Đưa mã nguồn đã cập nhật lên dự án

**Cách A – dùng gói `MoTrach_ThongKe_CapNhat.zip` (khuyên dùng để giữ Git cũ):**

1. Sao lưu toàn bộ thư mục gốc hiện tại.
2. Giải nén ZIP cập nhật. Vào thư mục `motrach-heritage` bên trong.
3. Chép các tệp/thư mục bên trong vào **đúng thư mục gốc cũ** của dự án, cho phép **ghi đè những tệp cùng tên**.
4. **Không xóa** thư mục `.git`, `images`, `audio`, `videos` và dữ liệu có sẵn.

**Cách B – dùng gói `MoTrach_Heritage_DaThemThongKe_DayDu.zip`:**

Gói này có mã nguồn và những ảnh/âm thanh/video thực tế xuất hiện trong bản sao lưu. Giải nén để xem hoặc triển khai một bản độc lập. Gói đầy đủ không kèm lịch sử Git `.git`; để tiếp tục nhánh Git/Vercel hiện có nên dùng **Cách A**.

## 4. Chạy thử trên máy tính

1. Mở thư mục dự án trong Visual Studio Code.
2. Chạy bằng Live Server (VS Code) hoặc mở Terminal tại thư mục gốc và gõ: `python -m http.server 5500`.
3. Mở **http://localhost:5500/**. Kéo xuống cuối trang xem "Lượt truy cập / Visits".
4. Nhấn **F5** vài lần: **không tăng lượt truy cập** trong một phiên.
5. Mở website bằng cửa sổ ẩn danh: số phiên truy cập sẽ tăng nếu đây là phiên mới.
6. Vào **http://localhost:5500/admin/login.html**, đăng nhập tài khoản quản trị hiện có, sau đó vào **`/admin/index.html`** để xem thống kê và biểu đồ.

Nếu bộ đếm vẫn hiện **—** hoặc trang quản trị báo không tải được, kiểm tra SQL đã chạy thành công trong **đúng dự án Supabase** và trình duyệt có kết nối mạng hay chưa. Bấm F12 → Console để xem chi tiết lỗi.

## 5. Cập nhật website đang dùng

Nếu bạn đang triển khai bằng GitHub + Vercel, lưu các thay đổi vào dự án Git hiện tại, **commit** và **push** lên nhánh đang liên kết với Vercel; Vercel sẽ triển khai lại theo cấu hình dự án. Nếu dùng dịch vụ khác, tải các tệp đã sửa lên đúng thư mục web.

Sau khi triển khai thành công, hãy truy cập website thực tế và kiểm tra bộ đếm tại chân trang và thống kê tại `/admin/index.html`.

## 6. Cách hiểu số liệu

- **Lượt truy cập:** đếm số **phiên truy cập**, không phải số người. Phiên mới hình thành sau **30 phút không hoạt động** trên trình duyệt đó. F5 và chuyển trang trong cùng phiên không làm tăng số phiên.
- **Lượt xem trang:** mỗi trang được tính **tối đa một lần trong một phiên**. Các lần F5 trang đó không tính thêm.
- **Thiết bị ước tính:** dựa vào mã ngẫu nhiên lưu trên trình duyệt; cùng một người dùng nhiều thiết bị hay trình duyệt có thể được đếm nhiều lần; xóa bộ nhớ trình duyệt hoặc dùng chế độ ẩn danh cũng có thể tăng số ước tính.
- **Ngày:** theo múi giờ Việt Nam `Asia/Ho_Chi_Minh` (UTC+7).
- **Giới hạn:** số liệu chỉ phát sinh **sau khi kích hoạt**, không hồi cứu; mã đếm phía trình duyệt không chống gian lận/bot hoàn toàn; hệ thống không định danh người truy cập và không chủ động thu thập địa chỉ IP.

## 7. Các tệp được bổ sung/sửa

- Mới: `sql/001_visit_statistics.sql`, `js/visitor-tracker.js`, `HUONG_DAN_THONG_KE_TRUY_CAP.md`.
- Sửa: `index.html`, `css/style.css`, `admin/index.html`, `js/admin-dashboard.js`.
- Sửa: toàn bộ `pages/*.html` (15 trang, để ghi lượt truy cập).

**Trạng thái:** mã đã thêm vào bản sao lưu. **Chưa** thực thi SQL trên Supabase thật hoặc cập nhật bản website trực tuyến; các bước 2 và 5 phải do người quản trị dự án thực hiện.
