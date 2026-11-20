# Ảnh trang trí cho mẫu — hướng dẫn

## Nguyên tắc: HÌNH ẢNH dùng ảnh, KHÔNG vẽ bằng code

Hoa, lá, người, đồ vật, nền giấy, khung hoạ tiết… đều phải là **ảnh** (do họa sĩ vẽ / tạo bằng AI / ảnh có giấy phép).
Code chỉ làm những việc sau: chữ, **chuyển động** (đung đưa, nhấp nhô, rơi, quét sáng), hạt sáng đơn giản,
đường kẻ/khung hình học, gradient và quầng sáng. Hình vẽ bằng code (người, hoa) luôn trông thô hơn ảnh thật,
nên mẫu mới **không** viết hàm vẽ hoa/người bằng canvas.

## Quy trình thêm ảnh cho một mẫu

1. **Thả ảnh** vào `public/assets/<id-mẫu>/` (id mẫu = trường `id` của mẫu, vd `hoa-dao-xuan`, `quan-ho-kinh-bac`).
2. **Khai báo** trong `src/config/template-assets.ts` (một nơi duy nhất): ảnh nào, đặt ở đâu, chuyển động ra sao.
3. Mở `/dev/frames?t=<id-mẫu>&aspect=16:9` và `&aspect=9:16` để xem. Không cần sửa code vẽ.

Thiếu file ảnh thì lớp đó bị bỏ qua, mẫu vẫn chạy bình thường.

## Các loại ảnh

| Loại | Dùng cho | Yêu cầu file |
|---|---|---|
| `background` | Nền phủ kín khung | **JPG/WebP không cần trong suốt.** Làm RIÊNG 2 bản: ngang `1920×1080`+ và dọc `1080×1920`+. Thiếu bản nào thì hướng đó dùng nền code. Chừa vùng giữa sáng, ít chi tiết để đặt chữ. |
| `back` | Hoa góc, nhân vật, vật trang trí nằm **sau** chữ | **PNG/WebP nền TRONG SUỐT**, mỗi vật một file riêng. |
| `front` | Lớp phủ **trước** chữ (dùng ít, kẻo che chữ) | Như trên. |
| `falling` | Cánh hoa, lá rơi | Ảnh nhỏ nền trong suốt (~200–400 px), 1 cánh/chiếc lá. Mẫu nên có 2–3 biến thể. |

Chung: không chữ, không logo, không watermark, không bóng đổ dính nền. Cùng một bộ phong cách (vd cùng màu nước).
Mỗi file nên dưới ~3 MB. Nên dùng **WebP** (nhẹ hơn PNG mà vẫn trong suốt).

## Ví dụ khai báo

```ts
"ten-mau": {
  background: { landscape: "/assets/ten-mau/nen-ngang.webp", portrait: "/assets/ten-mau/nen-doc.webp", zoom: 0.02 },
  back: [
    { src: "/assets/ten-mau/hoa.webp", anchor: "bc", x: 0.2, y: 0.95, height: 0.3,
      motion: { sway: 0.018, breathe: 0.012 },        // đung đưa quanh gốc + "thở"
      portrait: { x: 0.5, height: 0.2 } },            // riêng khung dọc
  ],
  falling: [{ src: "/assets/ten-mau/canh.webp", count: 18, size: [0.03, 0.06] }],
}
```

- `x, y` là **tỉ lệ khung** (0..1). `anchor` là điểm của ảnh được đặt tại (x,y): `bc` = giữa-đáy (cho cây mọc từ dưới lên), `tl` = góc trên trái…
- `height` (tỉ lệ chiều cao khung) **hoặc** `width` (tỉ lệ chiều rộng khung).
- `motion`: `sway` (đung đưa, rad), `bob` (nhấp nhô), `driftX` (trôi ngang), `breathe` (phóng thu nhẹ), `phase` (lệch pha), `cycles` (**số nguyên** lần lặp mỗi vòng video).
- `portrait: {...}` ghi đè riêng cho khung dọc; `portrait: { hide: true }` để ẩn ở khung dọc. `only: "landscape" | "portrait"` để chỉ hiện một hướng.
- Chuyển động luôn lặp liền mạch theo vòng video (dùng tần số nguyên), nên xuất MP4 lặp không bị giật.

## Bố cục: chừa chỗ cho chữ

Chữ nằm giữa khung (tên, ngày, lời cảm ơn). Khoảng 30–70% chiều ngang và 20–85% chiều cao là vùng chữ.
Đặt ảnh trang trí ở **mép và góc**; ở khung dọc chừa ~350 px đáy cho hoạ tiết.

## Gợi ý prompt AI

- Hoa/lá riêng: `watercolor <loài hoa>, botanical illustration, isolated on plain white background, high detail, no text`
- Nền: `soft <màu> handmade paper background, subtle <họa tiết> only at the corners and edges, large empty clean center, no text, no people`
- Nhân vật: `<mô tả>, standing full body, watercolor illustration, isolated on plain white background`
- Sau đó tách nền (remove.bg / rembg) → lưu WebP nền trong suốt.

Kiểm tra điều khoản của công cụ AI có cho dùng thương mại không. **Không dùng ảnh lấy từ cinelove hoặc nguồn không rõ giấy phép.**

## Trạng thái hiện tại

- `hoa-dao-xuan`: ảnh nền ngang (có), nền dọc (chưa → dùng nền code).
- `quan-ho-kinh-bac`: ảnh sen (có). Liền anh / liền chị / tre / nền giấy điệp vẫn đang **vẽ bằng code**, sẽ thay bằng ảnh khi có file.
- Các mẫu còn lại vẫn vẽ bằng code; chuyển dần sang ảnh theo từng mẫu.
