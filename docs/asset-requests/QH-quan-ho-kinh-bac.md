# Phiếu yêu cầu asset QH — Quan Họ Kinh Bắc (`quan-ho-kinh-bac`)

Đợt 1 · Ưu tiên **2** · Quy cách chung: [00-QUY-CACH-CHUNG.md](00-QUY-CACH-CHUNG.md)

## Hiện trạng

Hiện gần như **toàn bộ hình minh hoạ đang vẽ bằng canvas**, trái quy tắc mới. Cần thay hết các phần sau:

| Phần đang vẽ bằng code | Vị trí |
|---|---|
| Giấy điệp (nền kem có vân) | nền |
| Khung viền kiểu tranh Đông Hồ (đỏ son / chàm / vàng nghệ), cách mép 44px | nền |
| Liền anh (khăn xếp, áo the, ô) và liền chị (nón quai thao, áo mớ ba mớ bảy) đứng hai bên, cao ~46% khung | sau chữ |
| Hai khóm luỹ tre ở hai mép | sau chữ |
| Ao sen ở chân khung: nước, lá sen, bông sen | sau chữ |
| Nón quai thao nhỏ làm hoạ tiết phân cách cảnh "Lời cảm ơn" | hoạ tiết |
| Cánh sen hồng và lá tre vàng/đỏ rơi | ảnh rơi |

Phần **giữ lại bằng code** vì là hình học hoặc ánh sáng: vầng mặt trời mờ sau chữ, vệt sáng quét chéo trên giấy điệp, sóng nước lan (vòng elip), 2 vạch "mái đình" đỏ/chàm ở mép trên, khung ảnh cưới hình chữ nhật.

Asset cũ (đều `unverified`): `sen-bong` đang dùng (2 bông sen đứng 2 bên). Còn `hoa-sen-01/02`, `hoa-sen-hong(-1)`, `dai-lua-hong`, `long-den` không dùng. Ảnh sen cũ trông giống ảnh trong mẫu của cinelove, **không nên dùng thương mại**.

Màu của mẫu: đỏ son `#b3261e` (tiêu đề/tên), chàm `#1f3a5f`, vàng nghệ `#e0a526`, mực `#2a2320`, giấy điệp `#f7efd9`.

## Định hướng mỹ thuật

- **ĐÃ CHỐT (chủ dự án duyệt 2026-11-20): toàn bộ theo Đông Hồ / khắc gỗ dân gian**: màu phẳng, nét viền đen, chất giấy điệp. Không trộn sen màu nước như hiện nay.
- Văn hoá: liền anh mặc áo the (dài, đen hoặc chàm), khăn xếp, quần trắng, cầm ô đen. Liền chị đội nón quai thao, chít khăn mỏ quạ, mặc áo mớ ba mớ bảy, yếm đỏ, thắt lưng xanh, có thể cầm nón hoặc quạt. Hai người đứng nghiêng ¾ **quay vào giữa** như đang hát đối.
- **Không** dùng hình người thật hay khuôn mặt chân dung chi tiết. Phong cách dân gian cách điệu.

## Danh sách yêu cầu

| Mã | File | Nội dung | Lớp | Gợi ý đặt (ngang / dọc) | Chuyển động |
|---|---|---|---|---|---|
| QH-01 | `backgrounds/landscape.webp` | Giấy điệp có ánh xà cừ nhẹ + khung viền Đông Hồ cách mép ~44px; giữa trống, không người/tre/sen | nền | phủ kín | — |
| QH-02 | `backgrounds/portrait.webp` | Như QH-01, bố cục dọc | nền | phủ kín | — |
| QH-03 | `decorations/lien-anh.webp` | Liền anh toàn thân, chân chạm mép dưới ảnh | back | neo `bc`, x ~0.12, y ~0.93, cao ≤ 0.46 / dọc: x ~0.2, cao ≤ 0.17 | sway rất nhẹ quanh chân |
| QH-04 | `decorations/lien-chi.webp` | Liền chị toàn thân (nón rộng không vượt quá ~55% chiều cao người) | back | neo `bc`, x ~0.88, y ~0.93, cao ≤ 0.46 / dọc: x ~0.8, cao ≤ 0.17 | sway rất nhẹ |
| QH-05 | `decorations/luy-tre.webp` | Khóm tre cao, gốc chạm mép dưới; dùng cho cả 2 bên (bên phải lật) | back | neo `bl`, x ~0.02, cao ~0.55 / dọc: ẩn hoặc cao ~0.25 | sway nhẹ quanh gốc |
| QH-06 | `decorations/ao-sen-ngang.webp` | Dải ao sen: nước chàm + lá sen nằm, mép trên mờ dần trong suốt | back | neo `bc`, rộng ~0.95, cao ~0.22 | bob rất nhẹ |
| QH-07 | `decorations/ao-sen-doc.webp` | Như QH-06 cho khổ dọc (dải đáy ~320px) | back | neo `bc`, rộng ~0.92 | bob rất nhẹ |
| QH-08 | `decorations/sen-bong-01.webp`, `-02`, `-03` | Bông sen nở, nụ sen, đài sen, có cuống chạm mép dưới; cùng phong cách với QH-03/04 | back | 3–5 bông đứng trong ao, cao ~0.12–0.2 | sway + breathe |
| QH-09 | `ornaments/non-quai-thao.webp` | Nón quai thao nhỏ, có quai thao vàng, nhìn chính diện hơi nghiêng | hoạ tiết | hiển thị rộng ~220px phía trên tiêu đề "Lời cảm ơn" | — |
| QH-10 | `particles/canh-sen-01.webp`, `-02`; `particles/la-tre-01.webp`, `-02` | Cánh sen hồng, lá tre vàng/đỏ | rơi | 128–256px | rơi + xoay (code) |

Ghi chú:
- **Lỗi đang có:** ở cảnh mở đầu có ảnh, chữ tên đè lên liền chị (ngang) và lên cả hai nhân vật (dọc). Nhân vật phải nằm trọn **ngoài x 174–1746** ở khổ ngang, tức bề ngang người ≤ ~170px nếu đứng sát mép. Nếu không được thì chấp nhận chữ đè lên phần dưới người và cho người nhạt hơn. ChatGPT chọn.
- Khổ dọc rất chật: đề xuất chỉ giữ ao sen + 1–2 bông sen ở dải đáy, nhân vật thật nhỏ hoặc ẩn. ChatGPT quyết và ghi rõ.
- Sóng nước (code) sẽ vẽ **trên** dải ao sen. Claude tự đổi thứ tự lớp, ChatGPT không cần vẽ sóng.

## Kiểm kê asset cũ

| File | Trạng thái |
|---|---|
| `hoa-sen-01/02`, `hoa-sen-hong`, `hoa-sen-hong-1`, `dai-lua-hong`, `long-den` | **Đã xoá** (2026-11-20, chủ dự án duyệt; khôi phục được từ git) |
| `sen-bong` | Còn dùng tạm, sẽ xoá khi QH-08 được duyệt |

## Tiêu chí nghiệm thu riêng

- Nhìn tổng thể ra chất tranh dân gian Kinh Bắc, không lẫn phong cách.
- Không nhân vật nào bị khung viền nền cắt mất nón hoặc ô.
