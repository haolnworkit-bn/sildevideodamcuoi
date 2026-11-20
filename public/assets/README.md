# Quy chuẩn asset TaoSlideVideo

> `public/assets/` chỉ chứa ảnh **đã được chọn để ứng dụng dùng**. Mọi file ở đây đều công khai trên website.
> Phân vai: ChatGPT thiết kế và tạo asset, Claude tích hợp, chủ dự án duyệt. Xem [docs/AI_DESIGN_DEVELOPMENT_RULES.md](../../docs/AI_DESIGN_DEVELOPMENT_RULES.md).
> Quy cách kỹ thuật và phiếu yêu cầu: [docs/asset-requests/](../../docs/asset-requests/). Hồ sơ thiết kế từng mẫu: [docs/templates/](../../docs/templates/).

## Cấu trúc

```text
public/assets/
  <template-id>/
    backgrounds/landscape.webp   nền 16:9 (1920×1080)
    backgrounds/portrait.webp    nền 9:16 (1080×1920), bố cục RIÊNG, không cắt từ bản ngang
    decorations/*.webp           vật trang trí nền trong suốt; hoạ tiết phân cách đặt tên ornament-*.webp
    particles/*.webp             cánh hoa / lá rơi
    manifest.json                nguồn gốc, giấy phép, trạng thái duyệt của TỪNG file
  shared/                        asset dùng chung nhiều mẫu, cùng 3 thư mục trên
    manifest.json                templateId: "shared"
```

- Mỗi thư mục chỉ có 3 nhóm `backgrounds/`, `decorations/`, `particles/`. Checker từ chối nhóm khác.
- Tên file: chữ thường, không dấu, nối bằng `-`, đuôi `.webp`.
- Mẫu chưa có nhóm nào thì không cần tạo thư mục rỗng.
- Ảnh gốc khổ lớn, bản nháp AI, ảnh tham chiếu và bằng chứng giấy phép **không đưa vào repo**. Lưu ở Google Drive theo thư mục `<template-id>/goc/`.

## Khai báo trong code

Mọi ảnh khai báo ở `src/config/template-assets.ts`:

```ts
"hong-phuong": {
  background: {
    landscape: "/assets/hong-phuong/backgrounds/landscape.webp",
    portrait: "/assets/hong-phuong/backgrounds/portrait.webp",
    zoom: 0.012,
  },
  back: [{
    src: "/assets/hong-phuong/decorations/phoenix-pink.webp",
    anchor: "tr", x: 0.98, y: 0.1, height: 0.3, alpha: 0.2,
    motion: { sway: 0.008, breathe: 0.005, cycles: 2 },
    portrait: { hide: true },
  }],
  falling: [{ src: "/assets/hong-phuong/particles/petal-pink-01.webp", count: 8, size: [0.014, 0.027] }],
  preload: ["/assets/hong-phuong/decorations/silk-ribbon.webp"], // ảnh mà code mẫu tự vẽ qua getAsset()
}
```

Thiếu bản nền của hướng nào thì hướng đó dùng nền vẽ bằng code của mẫu. Thiếu file thì engine bỏ qua lớp đó, mẫu vẫn chạy.

## manifest.json

```json
{
  "templateId": "hong-phuong",
  "schemaVersion": 1,
  "assets": [{
    "file": "decorations/den-long.webp",
    "source": "chatgpt-image",
    "licenseStatus": "unverified",
    "reviewStatus": "visual-qa-pending",
    "origin": "ChatGPT Image — Hồng Phượng 2026",
    "originalFileName": "…",
    "nativeDimensions": [1024, 1536],
    "outputDimensions": [800, 1200],
    "alpha": true
  }]
}
```

| Trường | Giá trị hợp lệ |
|---|---|
| `source` | `chatgpt-image` · `external` (bắt buộc `sourceUrl`) · `original` · `unknown` |
| `licenseStatus` | `unverified` (mặc định) · `commercial-use` (chỉ khi **chủ dự án xác nhận**; `external` cần thêm `licenseEvidence`) · `restricted` |
| `reviewStatus` | tự do, vd `visual-qa-pending`, `approved`, `legacy-needs-audit` |

Ảnh tạo bằng AI không mặc nhiên được dùng thương mại. Không ghi `commercial-use` nếu chưa có xác nhận.

## Nhận asset mới (Claude làm)

1. Nhận gói zip của ChatGPT (cấu trúc như trên, kèm `handoff.md` + `manifest-entries.json`).
2. Chép vào `public/assets/<id>/`, gộp mục manifest, khai báo trong `template-assets.ts`, gỡ phần vẽ bằng code đã được thay.
3. Chạy `npm run check:assets`, `npm run test:assets`, `npm run typecheck`, `/dev/layout`, chụp `/dev/frames` ở 16:9 và 9:16 có/không ảnh, thử xuất MP4.
4. Gửi ảnh chụp để ChatGPT nghiệm thu mỹ thuật; chủ dự án duyệt; mở PR (không tự merge).

## Hiện trạng (2026-11-20)

- Đã xoá các file cũ không dùng (sen, lồng đèn, phượng, lụa bản cũ của hong-phuong và quan-ho; ảnh lạc trong `public/`). Khôi phục được từ lịch sử git nếu cần.
- Còn `unverified`: `hoa-dao-xuan/backgrounds/landscape.webp`, `quan-ho-kinh-bac/backgrounds/landscape.webp` (bản thử). Cả hai sẽ được thay theo phiếu HD và QH.
- `shared/` chưa có file nào. Chỉ dùng khi ChatGPT xác định một asset dùng chung được cho nhiều mẫu.
