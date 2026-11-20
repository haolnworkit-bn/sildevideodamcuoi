# TaoSlideVideo

Tạo video nền cho **lễ dạm ngõ, ăn hỏi, đính hôn, vu quy, thành hôn**: chiếu TV/máy chiếu hoặc đăng mạng xã hội.

## Tính năng

- **16 mẫu**, lọc được theo màu trang trí rạp (đỏ, hồng, tím, xanh dương, xanh lá, vàng, trắng/kem):
  Hoa Đào Xuân · Trầu Cau · Hỷ Sự Đỏ Vàng · Sen Ngọc · Mẫu Đơn · Tử Đằng · Cẩm Tú Cầu · Thu Vàng · Ngọc Trai · Thanh Lịch · Hoàng Kim ·
  Tết Đoàn Viên · Dừa Xanh Miền Tây · Tối Giản Đêm Xanh · Quan Họ Kinh Bắc · Hồng Phượng Ăn Hỏi.
- **Ngang 16:9** (TV, máy chiếu) và **dọc 9:16** (TikTok, Reels, Story). Mẫu nào cũng chạy được cả hai tỉ lệ.
- **Nội dung**: loại lễ, tiêu đề, lời chào, họ tên (hiện tên gọi hoặc họ tên đầy đủ), ngày dương và âm lịch tự đổi, giờ, địa điểm, lời cảm ơn. Bật/tắt từng cảnh.
- **Tối đa 6 ảnh**. Ảnh đầu là ảnh chính; từ 2 ảnh trở lên có thêm cảnh **Khoảnh khắc** trình chiếu lần lượt. Mỗi ảnh căn dọc riêng được, ảnh đặt bên trái hoặc phải.
- **Kiểu chữ**: 11 font tiêu đề, 9 font nội dung (đều hỗ trợ tiếng Việt). Chỉnh được màu tiêu đề, màu chữ, màu nhấn.
- **Hiệu ứng**: mật độ hạt (tắt / ít / vừa / nhiều), chuyển cảnh (mờ dần / phóng nhẹ / trượt lên).
- **Nhạc nền**: tải file nhạc lên hoặc chọn nhạc có sẵn (do ứng dụng tự tổng hợp, không vướng bản quyền); nhạc phát khi trình chiếu và được ghép vào video (mờ dần ở cuối).
- **Dùng thực tế**:
  - Trình chiếu toàn màn hình qua HDMI, giữ màn hình luôn sáng.
  - Xuất MP4 Full HD dài 1 vòng / 1 / 3 / 5 phút. Chỉ encode 1 vòng rồi ghép lặp nên bản 5 phút xuất mất vài giây.
  - Trình duyệt không có WebCodecs (vd Firefox, Safari cũ): xuất **WebM theo thời gian thực** (video 5 phút = chờ 5 phút, phải để nguyên tab), vẫn có nhạc. Hộp thoại xuất báo trước điều này.
  - Tải ảnh PNG; chia sẻ thẳng sang Zalo trên điện thoại; có hướng dẫn chép USB để chiếu trên TV.
- Dải phân cảnh dưới khung xem trước: thấy thời gian từng cảnh, bấm vào để tua tới.
- Nội dung, ảnh và nhạc tự lưu trên trình duyệt (localStorage + IndexedDB).

## Chạy

```bash
npm install
cp .env.example .env.local   # tuỳ chỉnh cờ kiếm tiền
npm run dev                  # http://localhost:8080
npm run typecheck            # kiểm tra kiểu TypeScript
npm run test:lunar           # kiểm tra đổi lịch âm
npm run check:assets         # kiểm tra ảnh trang trí: file tồn tại, getAsset đã khai báo, ảnh thừa
```

Trang dev (chỉ chạy khi `npm run dev`):

- `/dev/frames?t=<id,id>&aspect=9:16&photos=3&long=1&tf=dancing&hc=2c4a73`: xem mẫu ở mọi cảnh và điểm nối vòng lặp; thử khung dọc, nhiều ảnh, tên dài, font và màu.
- `/dev/export?template=<id>&aspect=9:16&photos=3&audio=1&loops=15`: thử xuất MP4; báo dung lượng, thời gian, kích thước và có âm thanh hay không. Thêm `&webm=1` để thử nhánh WebM thời gian thực.

> Nếu trang `/dev/*` báo 404 sau khi chạy `npm run build`, xoá thư mục `.next` rồi chạy lại `npm run dev`.

## Kiến trúc

```text
src/
  config/features.ts        ← cờ bật/tắt kiếm tiền (đọc từ env)
  lib/
    project.ts              ← schema dữ liệu 1 video + dữ liệu dẫn xuất (ngày, âm lịch, tên)
    events.ts / lunar.ts    ← loại lễ; đổi dương → âm lịch
    fonts.ts                ← thư viện font (tải theo nhu cầu)
    media.ts                ← ảnh & nhạc trong IndexedDB
    render/
      engine.ts             ← renderFrame(ctx, t, input): dùng chung cho preview/thumbnail/trình chiếu/xuất
      timeline.ts           ← dựng dòng thời gian theo cảnh bật/tắt & số ảnh
      scenes.ts             ← BỐ CỤC các cảnh (giới thiệu, lời cảm ơn, khoảnh khắc, tên & ngày), tự xếp ngang/dọc
      theme.ts              ← áp màu/font người dùng chọn lên mẫu
      helpers.ts            ← hạt lặp tuần hoàn, chuyển cảnh, chữ, ảnh, sprite, watermark
      templates/*.ts        ← mỗi file 1 mẫu: chỉ khai báo phong cách
      layers.ts / assets.ts ← vẽ & nạp ảnh trang trí khai báo trong config/template-assets.ts
    export/video.ts         ← WebCodecs H.264 + AAC + mp4-muxer → MP4 (fallback WebM + Opus, thời gian thực)
  config/template-assets.ts ← ẢNH trang trí của từng mẫu (nền ngang/dọc, lớp có chuyển động, ảnh rơi, preload)
    billing/entitlements.ts ← quyền: watermark? được xuất sạch? giá?
  components/               ← Editor, EditorPanels, PreviewPlayer, Presenter, Gallery, TemplateThumb
```

**Nguyên tắc:**

1. Mọi thứ vẽ bằng hàm thuần `renderFrame(t)`, nên preview và file xuất giống hệt nhau. Mọi chuyển động có chu kỳ là ước của độ dài video, nên vòng lặp nối liền.
2. **Mẫu chỉ khai báo phong cách, không lo bố cục.** Bố cục ngang/dọc nằm chung trong `scenes.ts`. Một mẫu gồm:
   - `theme`: màu tiêu đề, tên, chữ, màu nhấn.
   - `background(rc)`, `foreground(rc)`: nền và lớp hạt. Dùng `rc.W`, `rc.H`, `rc.D` để chạy được ở cả 2 tỉ lệ và mọi độ dài.
   - `photoFrame`: khung ảnh (vòm, tròn, polaroid, viền ngọc trai…).
   - `intro`: kiểu tiêu đề (`script`/`caps`), cách hiện ảnh ở cảnh mở đầu (`frame`/`emblem`/`fullbleed`/`faded`), biểu tượng `emblem`, nền tiêu đề `titleBacking` (vd dải lụa).
   - `ornament`, `colors` (nhóm màu rạp).

### Thêm mẫu mới

> **Hình minh hoạ (hoa, lá, người, đồ vật, nền giấy) dùng ẢNH, không vẽ bằng code.** Code chỉ lo chữ, chuyển động, hạt đơn giản, khung hình học, gradient. Xem `public/assets/README.md`.

1. Copy một file trong `templates/` gần giống nhất (vd `hong-phuong.ts`), đổi `id`, `name`, `colors`, `theme`, `photoFrame`.
2. Thả ảnh vào `public/assets/<id>/` và khai báo trong `src/config/template-assets.ts`; ảnh mà code mẫu tự vẽ (ornament…) khai báo ở `preload`. Chạy `npm run check:assets`.
3. Hạt: tạo bằng `makeLoopParticles()`, vẽ qua `particlesFor(rc, arr)` để theo tuỳ chọn mật độ.
4. Thêm vào `TEMPLATES` trong `templates/index.ts`.
5. Kiểm tra bằng `/dev/frames?t=<id>` và `/dev/frames?t=<id>&aspect=9:16&photos=3`.

## Bật/tắt kiếm tiền

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_MONETIZATION=off` | Miễn phí hoàn toàn, không watermark |
| `NEXT_PUBLIC_MONETIZATION=on` | Preview có watermark; xuất bản sạch phải trả tiền theo video |
| `NEXT_PUBLIC_PRICE_PER_VIDEO` / `NEXT_PUBLIC_PRICE_PREMIUM` | Giá mẫu thường / mẫu premium |
| `NEXT_PUBLIC_FREE_EXPORT_WATERMARK` | Khi bật kiếm tiền, cho tải bản có watermark miễn phí |
| `PAYMENT_PROVIDER` | `mock` (giả lập đã trả tiền, để test). Production chưa đặt thì mặc định **chặn** |

> ⚠️ Watermark và trạng thái "đã mua" đang xử lý trên trình duyệt, người rành kỹ thuật có thể vượt qua. Khi thu tiền thật, làm bước 2–3 dưới đây.

## Lộ trình

1. Thanh toán thật (PayOS / VNPay / MoMo) + webhook xác nhận.
2. Tài khoản + DB (vd Postgres/Neon): lưu project; lưu ảnh và nhạc lên object storage thay cho IndexedDB.
3. Render bản sạch trên server (headless Chrome chạy chính `renderFrame`), chỉ trả file khi đã thanh toán.
4. Link chiếu online `/v/<id>` cho Smart TV, không cần USB.
5. Thư viện nhạc có bản quyền; thêm mẫu theo mùa và theo vùng miền.
