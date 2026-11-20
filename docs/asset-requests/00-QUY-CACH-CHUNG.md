# Quy cách kỹ thuật chung cho asset — TaoSlideVideo

Áp dụng cho mọi phiếu yêu cầu asset (`HP-*`, `QH-*`, `HD-*`). Phiếu riêng của từng mẫu chỉ ghi thêm phần khác biệt.
Người soạn: Claude (kỹ thuật). Người thiết kế: ChatGPT Image. Người duyệt: chủ dự án.

## 1. Engine vẽ thế nào (để thiết kế đúng lớp)

Mỗi khung hình được vẽ theo thứ tự (dưới → trên):

```
1. Nền code của mẫu (gradient dự phòng)
2. Ảnh nền (background)       — phủ kín khung kiểu "cover", có thể phóng nhẹ +1–2% theo vòng lặp
3. Backdrop code              — viền hình học, chữ chìm (vd 囍) — vẽ bằng code
4. Lớp BACK (ảnh trong suốt)  — trang trí phía SAU chữ và ảnh cưới
5. Cảnh nội dung              — chữ, tên, ngày, ảnh cưới trong khung (code)
6. Lớp FRONT (ảnh trong suốt) — trang trí phía TRƯỚC nội dung (dùng rất tiết chế)
7. Ảnh rơi (falling)          — cánh hoa/lá rơi, xoay
8. Hạt code                   — chấm lấp lánh đơn giản
```

**Chuyển động engine làm được** (chỉ biến đổi ảnh tĩnh, lặp liền mạch):
`sway` (đung đưa quanh điểm neo), `bob` (nhấp nhô), `driftX` (trôi ngang), `breathe` (phóng/thu nhẹ), ảnh rơi + xoay.
**Không hỗ trợ:** GIF/APNG/sprite sheet, ảnh động, video. Một vật cần cử động riêng (vd cành cây đung đưa) thì phải là **một file riêng, nền trong suốt**.

## 2. Khổ hình & vùng an toàn

Hai khổ: **ngang 16:9 = 1920×1080** và **dọc 9:16 = 1080×1920**.

### Khổ ngang 1920×1080
```
┌──────────────────────────────────────────────┐
│ GÓC         dải trên ~100px          GÓC     │
│ ≤420×300                             ≤420×300│
│     ┌──────────────────────────────────┐     │
│     │  VÙNG NỘI DUNG  x 170–1750       │     │
│     │                 y 100–990        │     │
│     │  chữ, tên, ngày, khung ảnh cưới  │     │
│     └──────────────────────────────────┘     │
│ GÓC                                  GÓC     │
│ ≤420×300    dải dưới ~90px           ≤420×300│
└──────────────────────────────────────────────┘
```
- Khung ảnh cưới (cảnh mở đầu có ảnh) nằm ở **x 174–826** hoặc **x 1094–1746**, y 134–946; cột chữ ở nửa còn lại. Cảnh "Khoảnh khắc": khung ảnh x 234–966, y 94–986, chữ ở x≈1400.
- Không có ảnh thì chữ căn giữa, rộng tối đa ~1500px.
- **Lớp BACK** ở góc: tối đa khoảng **420×300 px** mỗi góc. Được phép lấn nhẹ vào vùng nội dung nếu nhạt; phải trông vẫn ổn khi bị chữ/khung ảnh che một phần.
- **Lớp FRONT**: chỉ ở rìa và góc, tối đa khoảng **240×200 px**, tuyệt đối không vào vùng nội dung.

### Khổ dọc 1080×1920
```
┌────────────────────────┐
│ dải trên ~140px        │
│ ┌────────────────────┐ │
│ │ VÙNG NỘI DUNG      │ │
│ │ x 80–1000          │ │
│ │ y 140–1600         │ │
│ │ (ảnh trên, chữ dưới)│ │
│ └────────────────────┘ │
│ DẢI ĐÁY ~320px         │  ← chỗ chính cho hoạ tiết
└────────────────────────┘
```
- Hai bên gần như **không có chỗ** (chỉ ~80px). Hoạ tiết chính đặt ở **dải đáy (y > 1600)** và góc trên (cao ≤ 260px, nhạt).
- Cảnh mở đầu có ảnh: khung ảnh x 174–906, y 134–1026; chữ y 1070–1630.

### Nền (background)
- Phần giữa ~70% rộng × 75% cao phải **yên tĩnh, độ tương phản thấp**, để chữ màu đậm của mẫu đọc rõ.
- Chừa ~3% sát mép không đặt chi tiết quan trọng (engine cắt kiểu cover và phóng nhẹ).

## 3. Quy cách file

| Loại | Thư mục | Định dạng | Kích thước | Dung lượng gợi ý |
|---|---|---|---|---|
| Nền ngang | `backgrounds/landscape.webp` | WebP, không alpha | đúng 1920×1080 | ≤ 400 KB |
| Nền dọc | `backgrounds/portrait.webp` | WebP, không alpha | đúng 1080×1920 | ≤ 400 KB |
| Trang trí (back/front) | `decorations/` | WebP có alpha (hoặc PNG) | cạnh dài ≈ 2× cỡ hiển thị lớn nhất, ≤ 1600px | ≤ 300 KB |
| Hoạ tiết phân cách | `ornaments/` | WebP alpha | rộng ≈ 2× cỡ hiển thị | ≤ 150 KB |
| Ảnh rơi | `particles/` | WebP alpha | 128–256 px, vật ở chính giữa | ≤ 20 KB |
| Chất liệu lặp | `textures/` | WebP | ghi rõ có lặp (tile) liền mép không | ≤ 300 KB |

Yêu cầu bắt buộc:
- **Nền trong suốt sạch**: không viền trắng/xám, không quầng, không nền ô cờ giả. Cắt sát vật (chừa ≤ 8px).
- **Vật có đung đưa** (cành, hoa có cuống, đèn treo): gốc/cuống/dây treo phải **chạm mép ảnh** ở phía điểm neo và vẽ dư ra (bleed) để khi xoay không lộ chỗ cụt.
- **Không có chữ** trong ảnh: không tên, ngày, chữ Hán, chữ ký, watermark, chữ giả do AI sinh. Chữ chìm (vd 囍) do code vẽ.
- Tên file: chữ thường, không dấu, nối bằng `-` (vd `canh-dao-goc-tren.webp`).
- Nếu ảnh gốc nhỏ hơn kích thước xuất (ảnh AI thường 1536×1024) thì ghi rõ **kích thước gốc**; upscale bằng công cụ chất lượng, không phóng thô.

## 4. Mẫu bàn giao (bắt buộc cho mỗi file)

Gửi kèm bảng sau và một đoạn JSON cho `manifest.json`:

| File | Mục đích | Kích thước | Lớp | Neo | x, y | Cỡ hiển thị | Chuyển động | Ngang/Dọc |
|---|---|---|---|---|---|---|---|---|
| `decorations/vd.webp` | cành đào góc trên trái | 1200×900 | back | tl | 0, 0 | cao 0.30 | sway nhẹ, 2 chu kỳ | cả hai (dọc: cao 0.14) |

- **Neo**: `tl tc tr cl c cr bl bc br` (trên/giữa/dưới + trái/giữa/phải).
- **x, y**: toạ độ điểm neo, tỉ lệ 0–1 của khung.
- **Cỡ hiển thị**: `height` = tỉ lệ chiều cao khung, hoặc `width` = tỉ lệ chiều rộng.
- **Chuyển động**: mô tả bằng lời là đủ (nhẹ/vừa, mấy chu kỳ mỗi vòng). Claude sẽ chuyển sang thông số.

```json
{
  "file": "decorations/vd.webp",
  "source": "chatgpt-image",
  "licenseStatus": "pending-owner-confirmation",
  "reviewStatus": "visual-qa-pending",
  "origin": "ChatGPT Image — <tên mẫu> <năm>",
  "originalFileName": "<tên file gốc>",
  "nativeDimensions": [1536, 1024],
  "outputDimensions": [1200, 900],
  "alpha": true,
  "notes": "<ghi chú vùng an toàn / cách dùng>"
}
```

`licenseStatus` chỉ ghi `commercial-use` khi **chủ dự án xác nhận**. Claude không tự đổi trạng thái này.

## 5. Sau khi bàn giao, Claude sẽ

1. Đặt file vào `public/assets/<id-mẫu>/`, cập nhật `manifest.json` và `src/config/template-assets.ts`.
2. Gỡ phần vẽ bằng code đã được asset thay thế.
3. Chụp mọi cảnh ở 16:9 và 9:16, có ảnh và không ảnh; thử xuất MP4. Gửi ảnh chụp để ChatGPT nghiệm thu mỹ thuật.
4. Làm trên branch riêng và mở PR. Không tự merge.
