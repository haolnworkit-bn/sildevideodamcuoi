# Phiếu yêu cầu asset HP — Hồng Phượng Ăn Hỏi (`hong-phuong`)

Đợt 1 · Ưu tiên **1** (mẫu tham chiếu đầu tiên) · Quy cách chung: [00-QUY-CACH-CHUNG.md](00-QUY-CACH-CHUNG.md)

## Hiện trạng

- Nền ngang và dọc do ChatGPT tạo (`visual-qa-pending`). Ảnh gốc 1672×941 được upscale lên 1920×1080.
- **Vấn đề chính:** hoa đào, mẫu đơn, đèn lồng, nón lá và dải lụa **vẽ liền vào ảnh nền**. Code có vẽ viền khung 2 nét hồng cách mép 3.5%, nên viền đè lên hoa ở 4 góc. Hiện tôi phải dùng mẹo làm mờ viền theo toạ độ gắn cứng, và chỉ khớp với đúng ảnh nền hiện tại. Hoa nằm trong nền nên cũng không đung đưa được.
- ChatGPT đã tạo nhưng **chưa dùng**: `lantern-red.webp`, `lotus-main.webp`, `lotus-secondary.webp`. Đang dùng: `phoenix-pink.webp` (rìa phải, mờ 20%), `silk-ribbon.webp` (hoạ tiết phân cách), `petal-pink-01.webp` (ảnh rơi).
- Asset cũ chưa rõ nguồn (`unverified`): `dai-lua-hong`, `long-den`, `phuong-hoang`, `sen-doi`, `sen-hong`, `sen-nu`, cộng thêm file lạc `public/assets/phuong_hoang.webp`.
- Màu chữ của mẫu: tiêu đề/tên `#a8324c`, nội dung `#6b2d3c`, nhấn `#c46a82`. Nền phải đủ sáng để các màu này đọc rõ.

## Quyết định — ĐÃ CHỐT: phương án A (chủ dự án duyệt 2026-11-20)

- **A (đã chọn):** nền "sạch" (chỉ giấy + loang màu nước), hoa và vật trang trí tách thành file trong suốt riêng. Cách này cho viền khung nằm đúng dưới hoa, hoa đung đưa được, và bản dọc bố cục lại dễ.
- **B:** giữ nền hiện tại và bỏ viền khung code. Không cần asset mới cho phần góc, nhưng hoa đứng yên và bản dọc vẫn bị cắt từ bố cục ngang.

Các mục dưới đây viết theo **phương án A**.

## Danh sách yêu cầu

| Mã | File | Nội dung | Lớp | Gợi ý đặt (ngang / dọc) | Chuyển động |
|---|---|---|---|---|---|
| HP-01 | `backgrounds/landscape.webp` | Nền giấy màu nước hồng đào, loang nhẹ ở góc, **không** hoa/đèn/nón/lụa | nền | phủ kín | phóng nhẹ (code) |
| HP-02 | `backgrounds/portrait.webp` | Như HP-01, bố cục riêng cho khổ dọc (loang đậm hơn ở đáy) | nền | phủ kín | — |
| HP-03 | `decorations/goc-tren-trai.webp` | Cành đào hồng vươn từ góc trên trái; gốc cành chạm mép trên/trái | back | neo `tl` (0,0), cao ~0.28 / dọc cao ~0.12 | sway nhẹ |
| HP-04 | `decorations/goc-duoi-trai.webp` | Cụm mẫu đơn + nón lá + nụ đào góc dưới trái; chạm mép dưới/trái | back | neo `bl` (0,1), cao ~0.30 / dọc cao ~0.15 | breathe rất nhẹ |
| HP-05 | `decorations/goc-duoi-phai.webp` | Cụm mẫu đơn + cành đào góc dưới phải (khác HP-04, không chỉ là bản lật) | back | neo `br` (1,1), cao ~0.32 / dọc cao ~0.16 | breathe rất nhẹ |
| HP-06 | `decorations/canh-tren-phai.webp` | Cành đào góc trên phải, có chỗ treo đèn | back | neo `tr` (1,0), cao ~0.18 | sway nhẹ |
| HP-07 | `decorations/den-long.webp` | Đèn lồng hồng treo **có dây dài chạm mép trên** (có thể chỉnh `lantern-red.webp` cho hợp tông hồng) | back | neo `tc` treo dưới HP-06, cao ~0.36 / dọc ~0.16 | sway quanh đỉnh dây |
| HP-08 | `decorations/dai-lua-day.webp` | Dải lụa hồng mỏng bay ngang chân khung, trong suốt một phần | front | neo `bc` (0.5,1), rộng ~0.55 / dọc rộng ~0.9 | driftX rất nhẹ |
| HP-09 | `particles/canh-hong-02.webp`, `-03.webp` | 2 biến thể cánh hoa đào/mẫu đơn khác dáng với `petal-pink-01` | rơi | 128–256px | rơi + xoay (code) |

Ghi chú:
- HP-03…HP-07 phải trông ổn khi **viền khung code (2 nét hồng, cách mép 38px)** chạy phía sau. Viền nằm dưới mọi lớp back.
- HP-08 nằm phía trước chữ nên phải thấp: không cao quá ~110px ở khổ ngang, ~140px ở khổ dọc.
- Nếu ChatGPT muốn dùng phượng hoàng (`phoenix-pink`) hoặc sen (`lotus-main/secondary`) thì nêu rõ vị trí. Ở khổ ngang, rìa phải chỉ còn trống từ **x ≥ 1780** (dòng tên dài chạy sát tới đó).

## Kiểm kê asset cũ (ChatGPT/chủ dự án quyết)

| File | Trạng thái |
|---|---|
| `long-den`, `phuong-hoang`, `sen-doi`, `sen-hong`, `sen-nu`, `dai-lua-hong`, `/assets/phuong_hoang.webp` | **Đã xoá** (2026-11-20, chủ dự án duyệt; khôi phục được từ git) |
| `lantern-red`, `lotus-main`, `lotus-secondary` | Còn giữ, ChatGPT quyết dùng hay bỏ |

## Tiêu chí nghiệm thu riêng

- Chữ 囍 chìm ở giữa (code vẽ, đỏ 11% độ đậm) vẫn thấy được trên nền mới, không bị loang màu làm bẩn.
- Ở cảnh mở đầu có ảnh, khổ dọc, chữ y 1070–1630 không đè lên hoa ở dải đáy.
