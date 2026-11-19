# TaoSlideVideo

Tạo video nền chiếu TV/máy chiếu cho **lễ dạm ngõ, ăn hỏi, đính hôn, vu quy, thành hôn**.
Người dùng nhập tên, ngày (tự đổi âm lịch), lời cảm ơn, ảnh → xem trước trực tiếp → dùng theo 3 cách:

- **Trình chiếu** toàn màn hình ngay trên trình duyệt (laptop cắm HDMI vào TV/máy chiếu), giữ màn hình luôn sáng.
- **Xuất MP4** 1920×1080, độ dài 20 giây / 1 / 3 / 5 phút. Chỉ encode 1 vòng 20 giây rồi ghép lặp nên bản 5 phút xuất mất khoảng 15 giây. Có hướng dẫn chép USB để chiếu trên TV, và nút chia sẻ (Zalo…) trên điện thoại.
- **Ảnh PNG** 1920×1080 để in phông hoặc gửi tin nhắn.

7 mẫu: Hoa Đào Xuân, Trầu Cau, Hỷ Sự Đỏ Vàng, Sen Ngọc, Mẫu Đơn, Thanh Lịch, Hoàng Kim.
Mẫu nào cũng có bản không ảnh và bản có ảnh (ảnh xuất hiện ở cảnh mở đầu và ở cảnh tên + ngày).

## Chạy

```bash
npm install
cp .env.example .env.local   # tuỳ chỉnh cờ kiếm tiền
npm run dev                  # http://localhost:3000
npm run test:lunar           # kiểm tra đổi lịch âm
```

Trang dev (chỉ chạy khi `npm run dev`):
- `/dev/frames`: xem mọi mẫu ở 6 thời điểm, có/không ảnh, tên dài. Dùng khi thiết kế mẫu mới.
- `/dev/export?template=<id>`: thử xuất MP4, báo dung lượng & thời gian.

## Kiến trúc

```
src/
  config/features.ts        ← CỜ BẬT/TẮT KIẾM TIỀN (đọc từ env)
  lib/
    project.ts              ← schema dữ liệu 1 video + dữ liệu dẫn xuất (ngày, âm lịch)
    events.ts               ← các loại lễ, tiêu đề & lời cảm ơn mẫu
    lunar.ts                ← đổi dương → âm lịch Việt Nam
    render/
      engine.ts             ← renderFrame(ctx, t, input): dùng chung cho preview/thumbnail/xuất
      helpers.ts            ← timeline cảnh, hạt lặp tuần hoàn, chữ, ảnh, watermark
      scenes.ts             ← cảnh "Lời cảm ơn" & "Tên + ngày" dùng chung, tuỳ biến bằng style
      templates/*.ts        ← mỗi file 1 mẫu; đăng ký trong templates/index.ts
    export/video.ts         ← WebCodecs H.264 + mp4-muxer → MP4 (fallback WebM)
    billing/entitlements.ts ← quyền: watermark? được xuất sạch? giá?
  app/api/checkout          ← tạo phiên thanh toán (hiện có mock)
  components/               ← Editor, PreviewPlayer, Gallery, TemplateThumb
```

**Nguyên tắc cốt lõi:** template là *hàm thuần* `render(t)`, nên cùng `t` luôn cho cùng một hình.
- Preview và file xuất giống hệt nhau (thấy gì nhận nấy).
- Mọi chuyển động có chu kỳ là ước của 20 giây, nên vòng lặp nối liền không bị giật.
- Sau này có thể render trên server bằng chính code này (headless Chrome).

### Thêm mẫu mới
1. Copy `templates/hoa-dao.ts` → đổi `id`, `name`, màu, `background()`, `intro()`.
2. Khai báo `photoFrame` trong style để cảnh tên + ngày chuyển sang bố cục ảnh bên trái.
3. Hoạ tiết phức tạp (hoa nhiều lớp…) thì vẽ 1 lần bằng `sprite()` rồi `drawSprite()`, để preview mượt.
4. Thêm vào mảng `TEMPLATES` trong `templates/index.ts`.
5. Mở `/dev/frames?t=<id>` (thêm `&long=1` để thử tên dài) để kiểm tra mọi thời điểm, có/không ảnh.

## Bật/tắt kiếm tiền

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_MONETIZATION=off` | Miễn phí hoàn toàn, không watermark |
| `NEXT_PUBLIC_MONETIZATION=on` | Preview có watermark; xuất bản sạch phải trả tiền theo video |
| `NEXT_PUBLIC_PRICE_PER_VIDEO` / `NEXT_PUBLIC_PRICE_PREMIUM` | Giá mẫu thường / mẫu premium |
| `NEXT_PUBLIC_FREE_EXPORT_WATERMARK` | Khi bật kiếm tiền, cho tải bản có watermark miễn phí |
| `PAYMENT_PROVIDER` | `mock` (giả lập đã trả tiền, để test). Production chưa đặt thì mặc định **chặn** |

Mọi chỗ trong UI chỉ hỏi `computeEntitlement()`. Đổi mô hình giá (gói tháng, credit…) thì chỉ cần sửa file đó.

> ⚠️ **Giới hạn hiện tại:** watermark và trạng thái "đã mua" đều xử lý trên trình duyệt (localStorage).
> Người rành kỹ thuật có thể vượt qua. Đủ dùng để thử thị trường, nhưng khi thu tiền thật thì cần làm bước 2 bên dưới.

## Lộ trình thành sản phẩm hoàn chỉnh

1. **Thanh toán thật**: PayOS (chuyển khoản QR, phí thấp, dễ tích hợp) hoặc VNPay/MoMo. Thêm `/api/payment/webhook` để xác nhận đơn.
2. **Tài khoản + DB** (ví dụ Postgres/Neon + Auth): lưu project, ảnh (object storage) và quyền đã mua theo user thay vì localStorage.
3. **Chống lách**: bản sạch render trên server (headless Chrome chạy chính `renderFrame`) và chỉ trả file khi đã thanh toán. Trình duyệt chỉ dùng để preview có watermark.
4. **Link chiếu online**: trang `/v/<id>` phát video toàn màn hình, chiếu thẳng lên Smart TV không cần USB.
5. Thêm mẫu, nhạc nền (bản cho link online), nhiều ảnh, tuỳ chỉnh font/màu, bố cục 9:16 cho mạng xã hội.
