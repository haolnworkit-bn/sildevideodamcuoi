# QUY TẮC THỐNG NHẤT QUẢN LÝ ASSET — TAOSLIDEVIDEO

> **Phạm vi:** Toàn bộ template trong TaoSlideVideo, bao gồm ảnh tạo bằng ChatGPT Image, ảnh sưu tầm và ảnh tự thiết kế.  
> **Mục tiêu:** Thư viện hình ảnh đẹp, đồng bộ, chuyên nghiệp, có nguồn gốc rõ ràng, dễ bảo trì và tương thích với Canvas Render Engine.  
> **Trạng thái:** Quy chuẩn đề xuất để áp dụng thống nhất trong dự án.

## 1. Mười nguyên tắc bắt buộc

1. **Phân loại theo template và chức năng, không theo nguồn ảnh.** Ảnh AI và ảnh sưu tầm dùng chung cấu trúc thư mục thành phẩm.
2. **`public/assets/` chỉ chứa ảnh thành phẩm đã duyệt.** Không lưu ảnh thử nghiệm, ảnh nguồn hoặc ảnh chưa đủ quyền sử dụng.
3. **`design-assets/` là kho lưu ảnh nguồn.** Lưu phiên bản tạo bằng AI, ảnh sưu tầm, phiên bản thử nghiệm và hồ sơ nguồn gốc. Thư mục này nằm ngoài `public/`.
4. **Mỗi template có một art direction thống nhất.** Màu sắc, ánh sáng, chất liệu và độ chi tiết phải tương thích.
5. **Background không chứa chữ dữ liệu.** Tên, ngày cưới, lời cảm ơn và địa điểm do Canvas Render Engine vẽ.
6. **Background ngang và dọc được thiết kế riêng.** Không lấy bản 16:9 cắt giữa thành 9:16 để phát hành chính thức.
7. **Vật trang trí độc lập cần nền alpha trong suốt.** Kiểm tra viền và bóng trước khi tích hợp.
8. **Không sử dụng ảnh sưu tầm chưa rõ quyền sử dụng cho sản phẩm thương mại.** Ghi nhận nguồn, giấy phép và bằng chứng.
9. **Không ghi đè asset đã phát hành khi chưa kiểm thử.** Thay đổi đường dẫn hoặc nội dung ảnh phải có quy trình review.
10. **Chất lượng ưu tiên hơn số lượng.** Một thiết kế cân đối, làm nổi bật nội dung có giá trị hơn việc thêm nhiều họa tiết.

## 2. Cấu trúc thư mục chuẩn

```text
project/
├── design-assets/                    # Kho nguồn nội bộ, KHÔNG public trực tiếp
│   ├── generated/
│   │   └── <template-id>/
│   ├── collected/
│   │   └── <template-id>/
│   ├── licenses/
│   └── references/
│
└── public/
    └── assets/                       # Chỉ asset đã duyệt cho ứng dụng
        ├── shared/
        │   ├── ornaments/
        │   ├── particles/
        │   └── symbols/
        │
        └── <template-id>/
            ├── backgrounds/
            │   ├── landscape.webp
            │   └── portrait.webp
            ├── decorations/
            ├── particles/
            ├── thumbnail.webp
            └── manifest.json
```

| Thư mục / file | Chức năng |
|---|---|
| `backgrounds/` | Nền video riêng cho 16:9 và 9:16 |
| `decorations/` | Hoa, lá, sen, đèn lồng, phượng hoàng, dải lụa… |
| `particles/` | Cánh hoa, lá rơi, các vật thể chuyển động nhỏ |
| `thumbnail.webp` | Ảnh đại diện template; ưu tiên ảnh chụp từ kết quả render thực tế |
| `shared/` | Asset dùng chung thật sự giữa nhiều template |
| `design-assets/generated/` | Ảnh gốc do ChatGPT Image tạo |
| `design-assets/collected/` | Ảnh gốc sưu tầm từ nguồn bên ngoài |
| `design-assets/licenses/` | Thông tin tác giả, giấy phép và bằng chứng quyền sử dụng |
| `manifest.json` | Metadata quản trị asset đã duyệt |

**Lưu ý:** Template tối giản không bắt buộc phải có đủ mọi thư mục hay mọi loại ảnh. `design-assets/` có thể lưu ở kho riêng nếu dung lượng lớn, nhưng cần lưu thông tin tham chiếu để truy vết.

## 3. Quy chuẩn kỹ thuật

| Loại asset | Kích thước mục tiêu | Định dạng |
|---|---|---|
| Background ngang | Tối thiểu 1920 × 1080 | WebP |
| Background dọc | Tối thiểu 1080 × 1920 | WebP |
| Trang trí chính | 1024–2048 px cạnh dài, tùy kích thước hiển thị | WebP có alpha |
| Trang trí phụ | 512–1024 px cạnh dài | WebP có alpha |
| Cánh hoa / lá rơi | 256–512 px | WebP có alpha |
| Thumbnail | 960 × 540 | WebP |

Quy định kỹ thuật:

- Không phóng lớn ảnh gốc nhỏ rồi coi là đạt chuẩn độ nét.
- Ảnh trang trí phải được kiểm tra trên nền sáng và nền tối để phát hiện viền tách nền, halo và nền trắng giả.
- Không đặt chữ, tên riêng, ngày tháng, logo hoặc watermark trực tiếp vào background template.
- Tối ưu dung lượng nhưng không làm mất chi tiết cần thiết khi xuất video Full HD.
- Kiểm tra asset ở cả kích thước xem trước và kích thước xuất video.
- Nên dùng WebP cho runtime; giữ PNG hoặc định dạng nguồn đầy đủ trong `design-assets/` nếu cần chỉnh sửa lại.

## 4. Quy tắc đặt tên

Sử dụng **chữ thường, không dấu, kebab-case**, tên mô tả vai trò hình ảnh thay vì nguồn tạo.

```text
backgrounds/landscape.webp
backgrounds/portrait.webp

decorations/lotus-main.webp
decorations/lotus-secondary.webp
decorations/lantern-red.webp
decorations/phoenix-gold.webp
decorations/silk-ribbon.webp

particles/petal-pink-01.webp
particles/petal-pink-02.webp
```

Không đặt tên thành phẩm như `image1.webp`, `final2.webp`, `anh-dep.webp`, `chatgpt-123.webp`. Các phiên bản `v1`, `v2` chỉ nên dùng trong kho nguồn hoặc trong quy trình thay đổi có chủ đích.

## 5. Quản lý nguồn ảnh và giấy phép

Nguồn ảnh **không quyết định vị trí file thành phẩm**. Nguồn được lưu trong metadata, ví dụ `public/assets/hong-phuong/manifest.json`:

```json
{
  "templateId": "hong-phuong",
  "assets": [
    {
      "file": "backgrounds/landscape.webp",
      "source": "chatgpt-image",
      "status": "approved",
      "notes": "Nền ngang, không có chữ"
    },
    {
      "file": "decorations/lotus-main.webp",
      "source": "external",
      "sourceUrl": "https://example.com/original-asset",
      "license": "TO_BE_VERIFIED",
      "status": "review"
    }
  ]
}
```

`example.com` và giá trị giấy phép trên **chỉ là ví dụ**. Không được đánh dấu ảnh sưu tầm là `approved` hoặc `commercial-use` trước khi xác minh điều khoản thực tế. Nên lưu thêm tác giả, ngày tải, đường dẫn giấy phép, bằng chứng và các thao tác chỉnh sửa.

**Ảnh tham khảo không đồng nghĩa với ảnh được phép sử dụng.** Việc tạo ảnh mới dựa trên ảnh tham khảo cũng không tự động xóa bỏ các vấn đề quyền tác giả nếu sao chép quá sát tác phẩm được bảo hộ.

## 6. Tiêu chuẩn mỹ thuật và nghiệm thu

| Tiêu chí | Trọng số | Yêu cầu |
|---|---:|---|
| Thẩm mỹ | 25% | Tinh tế, phù hợp lễ cưới, không rối mắt |
| Đồng bộ phong cách | 20% | Cùng chất liệu, bảng màu, ánh sáng |
| Bố cục và khoảng trống | 20% | Không che tên, ngày, lời cảm ơn, khung ảnh |
| Chất lượng kỹ thuật | 15% | Nét, sạch viền, đủ kích thước, không lỗi ảnh |
| Bản sắc văn hóa | 10% | Đúng nghi lễ và bối cảnh văn hóa Việt |
| Khả năng chuyển động | 10% | Có điểm neo hợp lý, dễ phân lớp, lặp tự nhiên |

**Ngưỡng duyệt nội bộ đề xuất:** Từ 90/100 điểm, đồng thời phải đạt các điều kiện bắt buộc về quyền sử dụng và kỹ thuật. Điểm thẩm mỹ là đánh giá nội bộ có tính chủ quan; không thay thế cho việc xem kết quả render thực tế.

### Đối với background

- Giữ đủ **safe area** cho tiêu đề, tên, ngày, lời cảm ơn và hình ảnh người dùng.
- Ưu tiên họa tiết ở mép/góc; tránh các vùng chữ trung tâm.
- Không nhồi tất cả biểu tượng trang trí vào một cảnh.
- Thiết kế riêng các bố cục ngang và dọc.

### Đối với vật trang trí

- Phù hợp cùng art direction của template; tránh trộn vector phẳng với tranh màu nước chi tiết nếu thiếu chủ đích thiết kế.
- Nền trong suốt thật, không còn mảng trắng hoặc quầng sáng không mong muốn.
- Không có phần vật thể bị cắt bất thường.
- Xác định điểm neo chuyển động hợp lý: hoa quanh gốc, đèn quanh móc treo…

## 7. Quy trình bắt buộc từ nguồn tới phát hành

1. **Tạo hoặc sưu tầm:** Lưu ảnh gốc vào `design-assets/` và ghi nguồn gốc.
2. **Duyệt nghệ thuật:** Đánh giá palette, chất liệu, tỷ lệ, bố cục, độ chi tiết và phù hợp văn hóa.
3. **Xử lý kỹ thuật:** Tách nền, làm sạch viền, chỉnh màu, kích thước và tối ưu WebP.
4. **Tích hợp:** Đưa file thành phẩm vào `public/assets/<template-id>/`; cập nhật metadata và `src/config/template-assets.ts`.
5. **Kiểm thử:** Chạy `npm run check:assets`; kiểm tra `/dev/frames` ở cả 16:9 và 9:16, các cảnh có ảnh/không ảnh, tên dài và lời cảm ơn dài.
6. **Duyệt bản xuất:** Kiểm tra video/PNG thực tế để đảm bảo không thiếu asset, không che chữ, không vỡ hình.
7. **Phát hành:** Tạo branch/PR, review thay đổi trước khi merge; không ghi đè asset đang dùng một cách thiếu kiểm soát.

## 8. Áp dụng với Render Engine hiện tại

TaoSlideVideo đang dùng `src/config/template-assets.ts` và các lớp `background`, `back`, `front`, `falling`, `preload`. Không cần thay lại hệ thống render; chỉ cập nhật đường dẫn ảnh đã duyệt.

Ví dụ:

```ts
"hong-phuong": {
  background: {
    landscape: "/assets/hong-phuong/backgrounds/landscape.webp",
    portrait: "/assets/hong-phuong/backgrounds/portrait.webp",
    zoom: 0.02,
  },
  back: [
    {
      src: "/assets/hong-phuong/decorations/lotus-main.webp",
      anchor: "br",
      x: 0.98,
      y: 0.98,
      height: 0.35,
      motion: { sway: 0.012, breathe: 0.01, cycles: 2 },
      portrait: { x: 0.95, height: 0.23 },
    },
  ],
  preload: [
    "/assets/hong-phuong/decorations/silk-ribbon.webp",
  ],
}
```

**Chú ý khi chuyển cấu trúc:** Cập nhật cả các lời gọi `getAsset()` trực tiếp trong code template và chạy kiểm tra asset. Không thay đồng loạt cả 16 template; ưu tiên di chuyển `hong-phuong` rồi nhân rộng sau khi kiểm thử.

## 9. Phân công trách nhiệm

| Bên phụ trách | Nhiệm vụ |
|---|---|
| **Người quản lý dự án** | Sưu tầm ảnh, cung cấp nguồn và giấy phép, duyệt phương án cuối cùng, quyết định phát hành |
| **ChatGPT Image / thiết kế** | Xây dựng art direction, tạo background/vật trang trí, tạo biến thể, đề xuất palette và đánh giá sự đồng bộ |
| **Quy trình tích hợp** | Chỉnh ảnh, tách nền, tối ưu WebP, cập nhật manifest và `template-assets.ts`, kiểm thử bản xuất |
| **Canvas Render Engine** | Vẽ chữ, ghép lớp, bố cục, chuyển động, preview và xuất video |

## 10. Quy tắc cốt lõi

> **`public/assets/` là kho ảnh thành phẩm đã duyệt dành cho ứng dụng, không phải kho ảnh sưu tầm.**
>
> **Ảnh do ChatGPT tạo và ảnh sưu tầm phải tuân theo cùng một tiêu chuẩn kiểm duyệt.** Không ưu tiên theo nguồn; chỉ chọn asset có quyền sử dụng rõ ràng, phù hợp art direction, đạt kỹ thuật và đẹp trong bố cục video thực tế.

**Lộ trình áp dụng:** Chuẩn hóa `hong-phuong` trước, tạo chuẩn tham chiếu, sau đó triển khai dần cho các template còn lại mà không phá vỡ phiên bản đang hoạt động.
