# NÂNG CẤP QR DI TÍCH – MỘ TRẠCH HERITAGE V2

## Những gì được bổ sung
- 4 QR mới trỏ đến đường dẫn GitHub Pages **ổn định** `/motrach-heritage/qr/?site=...`.
- Trang trung gian `qr/index.html`: tra cứu trang đích bằng Supabase, tự chuyển về trang trạm đang có; mất mạng/Supabase có dự phòng trang đích cho 4 di tích.
- Bảng `public.heritage_qr_sites`, bảng sự kiện `private.heritage_qr_open_events`, RPC ghi nhận và thống kê. Không ghi IP hay thông tin định danh cá nhân.
- Quản trị `admin/qr.html`: sửa tên, đổi trang đích, bật/tắt, xem lượt mở, sao chép URL, thử QR.
- Trang in A4 `qr/in.html`; ảnh PNG mới nằm tại `images/qr/v2/`.
- Giữ nguyên tệp QR cũ, Banner V2, thống kê truy cập, các trang chi tiết, thuyết minh và bản đồ; các trang di tích chỉ cập nhật đường dẫn ảnh QR hiển thị mới.

## THẬN TRỌNG
**QR cũ đã in chứa miền `motrach-heritage.vercel.app`. Không thể sửa nội dung mã đã in bằng cách cập nhật GitHub.** Chỉ đổi bảng QR giấy sau khi thử quét QR mới trên website chính thức. Nếu còn quản lý Vercel, có thể thiết lập chuyển hướng phía Vercel riêng.

**Số lượt mở URL QR ≠ số lần máy ảnh quét QR được xác minh**. Là số lần mở đường dẫn, có khử trùng theo một mã phiên trình duyệt trong 30 phút. Không cần thu IP.

**Mốc hiện tại:** Dự án đã có 4 trạm QR trong `data/heritage.json`; Banner thứ 5 (Miếu thờ Thần tổ) chưa có trang trạm riêng, nên không tự tạo QR cho nó.

## Cài đặt từng bước (ưu tiên an toàn)
1. Sao lưu repo hoặc tạo nhánh sao lưu trước khi sửa.
2. Vào Supabase dự án `motrach-heritage` → SQL Editor → New query → dán toàn bộ `sql/003_qr_management.sql` → Run. Kiểm tra cuối Results có 4 dòng. Lệnh không chỉnh sửa các bảng hiện có.
3. Sao chép **chỉ các tệp trong gói** vào đúng vị trí cùng tên trong repo đang dùng. Các tệp cùng tên chỉ khác ở dòng đổi đường dẫn QR hoặc bổ sung menu, nhưng vẫn cần so sánh nếu repo đã thay đổi sau thời điểm tải ZIP.
4. Mở Live Server: `http://127.0.0.1:5500/admin/qr.html`. Đăng nhập admin; kiểm tra 4 QR và số liệu.
5. Kiểm tra `http://127.0.0.1:5500/qr/?site=lang-than` → trang Lăng Thần; tương tự 3 di tích.
6. Kiểm tra trang `pages/heritage.html` và 4 trang `pages/tram-*.html` hiển thị hình QR mới; kiểm tra banner, thống kê truy cập, chức năng audio/video/bản đồ.
7. Kiểm tra Git: `git status -sb`, `git diff --check`; stage **đúng các tệp** trong gói (không stage SQL và hướng dẫn), commit, fetch, push lên `main` khi không behind; chờ Actions xanh.
8. Thử QR trên điện thoại qua `https://vuthuanltsmt.github.io/motrach-heritage/qr/in.html`. Nếu hoạt động hãy in QR mới.
9. Chỉnh trang đích trong `admin/qr.html` (ví dụ dùng `pages/detail.html?id=lang-than`). QR ảnh PNG không phải đổi; nhấn tải lại màn hình để thấy kết quả mới.

## Quy tắc đường dẫn trong quản trị
Chỉ chấp nhận đường dẫn nội bộ như `pages/tram-lang-than.html` hoặc `pages/detail.html?id=lang-than`. Không cho chuyển hướng ra ngoài, không cho `javascript:` hoặc `../`.

## Bảo mật và lưu ý
- Trang quản trị yêu cầu Supabase Auth và có bản ghi trong bảng `public.admins`.
- RLS cho phép công khai chỉ đọc các QR bật; mọi thay đổi đều kiểm tra quyền admin tại Supabase.
- Người truy cập không có quyền đọc bảng sự kiện `private.heritage_qr_open_events`.
- QR `qr/index.html` có URL ổn định, nhưng **nếu đổi hẳn tên miền Github Pages**, QR mới cũng cần chuyển hướng miền cũ hoặc thay bằng domain độc lập.
- Quy trình vận hành public RPC không ngăn được mọi truy cập tự động/bot. Không dùng số lượt mở làm chứng cứ tuyệt đối về số người quét mã thực tế.
- Có thể triển khai trước chỉ SQL + gateway + trang quản trị và ảnh QR, chưa thay các tệp có sẵn nếu muốn thử nghiệm theo từng giai đoạn.
