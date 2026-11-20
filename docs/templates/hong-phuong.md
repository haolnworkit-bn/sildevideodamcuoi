# Hồng Phượng Ăn Hỏi (`hong-phuong`)

Trạng thái: đã duyệt 2026-11-20 (B1 + B1.1) · asset B3 bản nháp đã tích hợp, chờ thay bản độ phân giải gốc
Loại lễ phù hợp: ăn hỏi (chính), dạm ngõ, đính hôn, vu quy, thành hôn
Phiếu yêu cầu: [docs/asset-requests/HP-hong-phuong.md](../asset-requests/HP-hong-phuong.md) · Phương án A (nền sạch, trang trí tách riêng)

## Concept — "Hồng Đào Giao Duyên"
Không khí lễ ăn hỏi truyền thống miền Bắc: sắc hồng đào, mẫu đơn, nón lá, đèn lồng — sum vầy, trang trọng mà gần gũi.
Màu nước thủ công trên giấy sáng; hoa và vật trang trí dồn về các góc như khu vườn bao quanh đôi uyên ương.
Điểm nhận diện: góc hoa chăm chút tinh xảo đối lập với khoảng trống thanh lịch ở trung tâm.
Hợp cả LED rạp cưới lẫn điện thoại: tránh đỏ gắt, hoạ tiết quá nhỏ, hiệu ứng cầu kỳ.

## Bảng màu
| Vai trò | Hex |
|---|---|
| Nền giấy sáng chủ đạo | `#FFF6F2` |
| Nền hồng đào phụ / loang | `#FBE6E6` / `#F4CFD7` |
| Mẫu đơn / cánh đào | `#E8A0B2` / `#EBAFBE` |
| Lá xanh xám | `#91A89A` |
| Vàng champagne (tiết chế) | `#D7B27D` |
| Đỏ son tiết chế | `#B94D60` |
| **Tiêu đề / tên (cố định)** | **`#A8324C`** |
| **Nội dung (cố định)** | **`#6B2D3C`** |
| **Nhấn (cố định)** | **`#C46A82`** |
| Đường kẻ | `rgba(196,106,130,0.6)` |

## Chất liệu & phong cách
Giấy mỹ thuật thớ mịn + loang màu nước; hoa màu nước bán hiện thực; nón lá Việt đúng dáng; đèn lồng lụa không chữ;
lụa hồng mỏng bán trong suốt. Tránh: 3D bóng nhựa, viền trắng quanh vật, đỏ-vàng rực, chữ giả do AI.

## Font
Tiêu đề & tên: `great-vibes` · Nội dung & ngày: `cormorant` (đúng mặc định của engine).

## Bố cục & bảng đặt asset
Viền khung code 2 nét (38px / 50px từ mép) nằm DƯỚI mọi lớp trang trí. Chữ 囍 chìm ở giữa do code vẽ.

**Ngang 1920×1080** — vùng nội dung x 170–1750, y 100–990; hoa đậm chỉ ở x<170, x>1750, y<100, y>990.

| Mã | File | Neo | Hiển thị | Chuyển động |
|---|---|---|---|---|
| HP-01 | `backgrounds/landscape.webp` | phủ kín | 1920×1080 | zoom 1% |
| HP-03 | `decorations/goc-tren-trai.webp` | tl (0,0) | 400×280 | sway 0.008, 2 chu kỳ |
| HP-06 | `decorations/canh-tren-phai.webp` | tr (1920,0) | 320×180 | sway 0.008, lệch pha |
| HP-04 | `decorations/goc-duoi-trai.webp` | bl (0,1080) | 410×280 | breathe 0.005 |
| HP-05 | `decorations/goc-duoi-phai.webp` | br (1920,1080) | 410×290 | breathe 0.005, lệch pha |
| HP-08 | `decorations/dai-lua-day.webp` (front) | bc (960,1080) | 980×80 | driftX ~6px |
| HP-07 | đèn lồng | — | không dùng ở khổ ngang | — |

**Dọc 1080×1920** — vùng chữ y 1070–1630 phải sạch; hoạ tiết chính ở dải đáy; góc trên cao ≤260px.

| Mã | File | Neo | Hiển thị | Chuyển động |
|---|---|---|---|---|
| HP-02 | `backgrounds/portrait.webp` | phủ kín | 1080×1920 | đứng yên (`portraitZoom: 0`) |
| HP-03 | dùng chung | tl (0,0) | 260×182 | sway 0.008 |
| HP-06 | dùng chung | tr (1080,0) | 204×115 | sway 0.008 |
| HP-07 | `decorations/den-long.webp` | tc (970,0) | 84×230 | sway 0.012 quanh đỉnh dây |
| HP-04-P | `decorations/goc-duoi-trai-portrait.webp` | bl (0,1920) | ~482×380 * | breathe 0.004 |
| HP-05-P | `decorations/goc-duoi-phai-portrait.webp` | br (1080,1920) | ~477×390 * | breathe 0.004 |
| HP-08 | dùng chung (front) | bc (540,1920) | 940×77 | driftX ~4px |

\* B1.1 đề xuất 330×260 / 330×270; khi chụp thử thấy dải đáy trống, chủ dự án duyệt phóng to (phần cao của cụm nằm sát mép ngoài, không chạm chữ — kiểm bằng tên dài).

Hạt rơi: `petal-pink-01`, `canh-hong-02` (cánh đào), `canh-hong-03` (cánh mẫu đơn), 16–36px, rơi thưa + xoay.
Asset cũ giữ lại chưa dùng: `lantern-red`, `lotus-main`, `lotus-secondary`, `phoenix-pink`. `silk-ribbon` vẫn là ornament cảnh "Lời cảm ơn".

## Nghiệm thu
| Ngày | Ai | Kết quả | Ghi chú |
|---|---|---|---|
| 2026-11-20 | ChatGPT | B1, B1.1 | Hồ sơ concept/bố cục; bảng đặt asset |
| 2026-11-20 | Chủ dự án | Duyệt B1.1 | Bỏ qua B2 (ảnh tham chiếu) |
| 2026-11-20 | Claude | Tích hợp B3 (bản nháp) | /dev/layout 0 lỗi; MP4 9:16 3 vòng có nhạc = 83.4s, 16:9 2 vòng = 40.0s |

**Còn nợ:** các trang trí và nền dọc được ChatGPT cắt từ một ảnh ghép rồi upscale ~3× (nền dọc ~6×) → có thể mềm trên TV Full HD,
quầng sáng nhẹ quanh mép, HP-05/HP-06 dính mẩu vật bên cạnh ở mép trái. Cần tạo lại từng vật ở độ phân giải gốc (giữ nguyên tên file → không phải sửa code).
Giấy phép mọi asset mới: `unverified` cho tới khi chủ dự án xác nhận.
