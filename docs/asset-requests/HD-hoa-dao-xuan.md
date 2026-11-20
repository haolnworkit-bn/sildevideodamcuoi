# Phiếu yêu cầu asset HD — Hoa Đào Xuân (`hoa-dao-xuan`)

Đợt 1 · Ưu tiên **3** · Quy cách chung: [00-QUY-CACH-CHUNG.md](00-QUY-CACH-CHUNG.md)

## Hiện trạng

- Chỉ có **nền ngang** `backgrounds/landscape.webp`: 1672×941, chưa rõ nguồn (`unverified`), hai cành đào **vẽ liền** trong nền.
- **Chưa có nền dọc.** Khổ dọc đang dùng gradient + cành đào vẽ bằng canvas.
- Đang vẽ bằng code, cần thay: 2 cành đào góc (khi không có ảnh nền), hoạ tiết phân cách (cụm 3 bông đào), 2 bông đào trang trí ở góc dưới trái khung ảnh cưới, cánh đào rơi (4 màu) và thỉnh thoảng một bông nguyên rơi.
- Giữ lại bằng code: khung ảnh hình vòm màu trắng, quầng sáng.
- Màu chữ: tiêu đề/tên `#b0385a`, nội dung `#6b2d3c`, nhấn `#c46a82`.

## Vấn đề định hướng cần ChatGPT xử lý

**Hoa Đào Xuân và Hồng Phượng hiện quá giống nhau** (cùng nền hồng màu nước, cùng cành đào). Cần một bản sắc riêng. Gợi ý: Hoa Đào Xuân thiên về **Tết, mùa xuân miền Bắc**, nền sáng hơn (trắng ngà, hồng rất nhạt), cành đào thân gỗ nâu sẫm nét mực, có thể thêm thoáng vàng/đỏ Tết. Hồng Phượng giữ hồng đào đậm, lễ ăn hỏi. ChatGPT quyết phương án cuối.

## Danh sách yêu cầu

| Mã | File | Nội dung | Lớp | Gợi ý đặt (ngang / dọc) | Chuyển động |
|---|---|---|---|---|---|
| HD-01 | `backgrounds/landscape.webp` | Nền giấy sáng, loang nhẹ, **không** cành đào (cành tách riêng ở HD-03/04) | nền | phủ kín | phóng nhẹ (code) |
| HD-02 | `backgrounds/portrait.webp` | Như HD-01, bố cục dọc | nền | phủ kín | — |
| HD-03 | `decorations/canh-dao-tren.webp` | Cành đào lớn vươn từ góc trên trái, gốc cành chạm mép trên/trái | back | neo `tl` (0,0), cao ~0.38 / dọc cao ~0.14 | sway nhẹ quanh gốc |
| HD-04 | `decorations/canh-dao-duoi.webp` | Cành đào từ góc dưới phải, dáng khác HD-03 | back | neo `br` (1,1), cao ~0.34 / dọc cao ~0.16 | sway nhẹ, lệch pha |
| HD-05 | `decorations/ornament-cum-hoa-dao.webp` | 1 bông đào lớn + 2 bông nhỏ hai bên, nằm ngang, làm hoạ tiết phân cách | hoạ tiết | hiển thị rộng ~260px phía trên "Lời cảm ơn" | — |
| HD-06 | `decorations/hoa-goc-khung.webp` | Cụm 2 bông đào + nụ, đặt ở góc dưới trái khung ảnh cưới | khung ảnh | hiển thị ~160×120px, đè lên viền khung | — |
| HD-07 | `particles/canh-dao-01.webp` … `-03.webp` | 3 cánh đào khác dáng và độ hồng | rơi | 128–256px | rơi + xoay (code) |
| HD-08 | `particles/bong-dao-01.webp` | Một bông đào nguyên (rơi hiếm) | rơi | 192–256px | rơi + xoay (code) |

Ghi chú:
- HD-06 cần Claude thêm một chút code (khung ảnh hiện vẽ bông đào bằng code). Việc này thuộc phần của Claude, ChatGPT chỉ cần giao file.
- Cảnh mở đầu có ảnh ở khổ ngang: khung vòm nằm ở x 174–826 (hoặc 1094–1746). HD-03 ở góc trên trái sẽ nằm phía sau khung, nên phần cành trong vùng x > 170 phải nhạt và thoáng.
- Khổ dọc: HD-04 nằm trong dải đáy (cao ≤ 320px tính từ đáy).

## Kiểm kê asset cũ

| File | Đề xuất của Claude |
|---|---|
| `backgrounds/landscape.webp` (cũ, chưa rõ nguồn) | Thay bằng HD-01. File cũ chỉ giữ để rollback tới khi HD-01 được duyệt |

## Tiêu chí nghiệm thu riêng

- Đặt cạnh Hồng Phượng trong thư viện mẫu, người xem phân biệt được ngay hai mẫu.
- Cánh hoa rơi không quá to so với chữ (cỡ hiển thị khoảng 15–60px).
