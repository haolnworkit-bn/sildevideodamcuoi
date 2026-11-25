# Phiếu yêu cầu asset SN — Sen Ngọc (`sen-ngoc`)

Quy cách chung: [00-QUY-CACH-CHUNG.md](00-QUY-CACH-CHUNG.md)

## Hiện trạng (2026-11-25)

- Đã tích hợp bộ ảnh màu nước sen trắng – lá xanh (5 ảnh ChatGPT, `_inbox/tong-hoa-xanh`):
  nền ngang `backgrounds/landscape.webp` (1672×941 → upscale 1920×1080) + 4 cụm `decorations/` tách nền.
- **Chưa có nền dọc.** Khổ dọc đang dùng gradient giấy kem + khung 2 nét vẽ bằng code, đặt sen trắng góc trên trái, sen đôi góc dưới phải, cành lá trên phải.
- Màu chữ: tiêu đề/tên `#4f6b45`, nội dung `#545646`, nhấn `#a68a4a`.

## Danh sách yêu cầu

| Mã | File | Nội dung | Lớp | Ghi chú |
|---|---|---|---|---|
| SN-01 | `backgrounds/landscape.webp` | Bản **1920×1080 gốc** của nền ngang hiện tại (giữ bố cục, khung mảnh, hoạ tiết góc) | nền | Bản hiện tại là upscale ×1.15 |
| SN-02 | `backgrounds/portrait.webp` | Nền dọc 1080×1920 cùng phong cách: giấy kem, khung mảnh 2 nét cách mép ~3.5%, hoạ tiết khoá góc, vệt màu nước xanh nhạt ở góc trên phải và dưới trái. **Không** vẽ hoa (hoa là lớp riêng) | nền | Vùng giữa (y 300–1500) phải sạch để đặt chữ |
| SN-03 | `particles/la-01.webp`, `la-02.webp` | 2 chiếc lá xanh xám đơn lẻ, khác dáng, nền trong suốt, 256px | rơi | Thay hạt bụi vàng bằng lá rơi nhẹ (tuỳ chọn) |

## Tiêu chí nghiệm thu riêng

- Đặt cạnh Quan Họ (cũng là sen) trong thư viện mẫu, người xem vẫn phân biệt được: Sen Ngọc = trắng/xanh, thanh lịch, ít màu; Quan Họ = hồng sen, cảnh làng.
