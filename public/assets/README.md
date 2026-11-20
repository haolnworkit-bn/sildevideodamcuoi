# Quy chuẩn asset TaoSlideVideo

> Áp dụng cho toàn bộ 16 template. **`public/assets/` chỉ chứa tài nguyên đã được chọn để ứng dụng sử dụng.** Nguồn ảnh và giấy phép phải được xác minh độc lập trước phát hành thương mại.

## Cấu trúc

```text
public/assets/
  shared/{ornaments,particles,symbols}/
  <template-id>/
    backgrounds/{landscape,portrait}.webp
    decorations/*.webp
    particles/*.webp
    thumbnail.webp
    manifest.json

design-assets/  # không nằm trong public
  generated/<template-id>/
  collected/<template-id>/
  references/
  licenses/
```

Không bắt buộc mẫu nào cũng có mọi thư mục: Git không lưu thư mục rỗng. Các ảnh gốc, bản nháp AI chưa duyệt, ảnh sưu tầm chưa rõ giấy phép phải lưu **ngoài `public`**, không đưa vào website.

## Đường dẫn trong code

Khai báo background, `back`, `front`, `falling` và `preload` tại `src/config/template-assets.ts`. Ảnh được dùng bằng `getAsset(...)` trong template phải khai báo `preload`. Với asset dùng chung, dùng `/assets/shared/<nhóm>/<tên>.webp`.

Ví dụ:
```ts
"hong-phuong": {
  background: {
    landscape: "/assets/hong-phuong/backgrounds/landscape.webp",
    // Chỉ thêm portrait khi có BẢN NỀN DỌC THỰC SỰ
    zoom: 0.02,
  },
  preload: ["/assets/hong-phuong/decorations/dai-lua-hong.webp"],
  back: [{
    src: "/assets/hong-phuong/decorations/sen-doi.webp",
    anchor: "br", x: 0.985, y: 1, height: 0.38,
    portrait: { x: 0.97, height: 0.24 }
  }]
}
```

**Lưu ý tương thích:** Tại thời điểm chuẩn hóa, Hồng Phượng dùng **cùng file nền ngang cho cả chế độ dọc**, để giữ nguyên hành vi hiện có. Đường dẫn `portrait` trong cấu hình vẫn trỏ tới `backgrounds/landscape.webp`; cần thay bằng `backgrounds/portrait.webp` khi đã tạo và kiểm duyệt nền dọc. Hoa Đào hiện thiếu nền dọc nên dùng background Canvas dự phòng.

## Yêu cầu kỹ thuật

| Loại | Đầu ra | Kiểm duyệt |
|---|---|---|
| Nền ngang | WebP, mục tiêu 1920×1080+ | Không có chữ; giữ vùng trung tâm sạch |
| Nền dọc | WebP, mục tiêu 1080×1920+ | Thiết kế riêng, không chỉ crop ảnh ngang |
| Decor chính | WebP có alpha, cạnh dài ~1024–2048px | Tách nền sạch, không viền trắng |
| Decor phụ | WebP có alpha, cạnh dài ~512–1024px | Đồng bộ chất liệu/ánh sáng |
| Hạt rơi | WebP có alpha ~256–512px | Dễ đặt neo và chuyển động |
| Thumbnail | WebP 960×540 | Nên xuất từ render thực tế |

Không nâng ảnh nhỏ bằng cách nội suy rồi coi là đạt chất lượng. Không nhúng tên, ngày, lời cảm ơn hay watermark vào background. Nội dung động phải do Canvas render.

## Nguồn và giấy phép

- `chatgpt-image`: ảnh AI gốc; vẫn phải kiểm tra chất lượng, tính nhất quán và dấu hiệu sao chép biểu tượng.
- `external`: phải lưu URL nguồn, chủ sở hữu, giấy phép, ngày lấy, bằng chứng cấp quyền.
- `unknown`: ảnh hiện có nhưng chưa có bằng chứng nguồn/quyền — **không được tự xác nhận đủ điều kiện thương mại**.
- `manifest.json` trong mỗi template ghi tình trạng hiện tại; lưu tài liệu gốc/bằng chứng trong `design-assets/licenses/`.
- Không dùng ảnh không rõ quyền sử dụng trong bản thương mại. Xóa file trùng chỉ sau khi xác nhận mọi nơi sử dụng.

## Quy trình nhận asset mới

1. Lưu ảnh gốc vào `design-assets/generated` hoặc `design-assets/collected` bên ngoài `public`; ghi metadata nguồn.
2. Duyệt thẩm mỹ: bố cục, tỷ lệ, màu sắc, tính văn hóa và khả năng chuyển động.
3. Tách nền, sửa alpha, xuất WebP, dùng tên **chữ thường không dấu, kebab-case**.
4. Chép phiên bản duyệt vào `public/assets/<id>/<nhóm>/`; cập nhật `manifest.json`, `template-assets.ts` và mọi `getAsset`.
5. Chạy `npm run check:assets`, `npm run typecheck`, kiểm tra `/dev/frames` ở 16:9 / 9:16, có/không ảnh, lời dài và xuất video.
6. Merge sau review. Không push thẳng `main` hoặc `sprint-0-reliability`.

## Hiện trạng chuyển đổi

Đợt chuẩn hóa chỉ **chuyển đường dẫn, giữ nguyên bytes ảnh**: không tự xác nhận chất lượng, quyền sử dụng, không thay toàn bộ bằng ảnh ChatGPT. `public/chim_bo_cau.webp`, `public/chu_hy.webp`, `public/nhan_cuoi.webp` và `public/assets/phuong_hoang.webp` vẫn ở vị trí cũ vì chưa xác minh phạm vi sử dụng và không muốn phá tương thích.

Các ảnh trùng bytes hiện còn được giữ ở từng thư mục template để bảo toàn đường dẫn và ownership thiết kế; có thể gom vào `shared/` ở một PR sau khi audit vị trí dùng.
