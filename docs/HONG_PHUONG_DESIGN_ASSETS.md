# Hồng Phượng — Bộ asset 2026 (bản thiết kế)

- Tạo bằng ChatGPT Image: 2 background độc lập, 5 trang trí (sen chính, sen phụ, đèn lồng, lụa, phượng), 1 cánh hoa.
- Kích thước xuất: `backgrounds/landscape.webp` 1920×1080; `backgrounds/portrait.webp` 1080×1920. Nguồn AI nhỏ hơn mục tiêu và đã upscale bằng Lanczos, **không phải native Full HD**.
- Các sprite trang trí WebP có alpha thật; kiểm tra lại viền trên nền tối và nền sáng.
- Tránh nhân đôi chủ thể: background đã có đèn lồng, sen và lụa, vì vậy layout mặc định **không** lặp đèn lồng/sen tách lớp. Phượng mờ chỉ trên màn ngang, cánh hoa rơi tiết chế, ribbon dùng ở lời cảm ơn.
- Tài nguyên thiết kế bổ sung được đánh dấu `visual-qa-pending` trong `manifest.json` và có thể dùng cho cảnh mới trong tương lai.
- Hình cũ chưa thay trong `decorations/` được giữ để phục hồi nhanh, nhưng có giấy phép `unverified`.

## QA cần duyệt trước khi merge

1. `npm run check:assets`, `npm run test:assets`, `npm run typecheck`, `npm run build`.
2. Mở `/dev/frames?t=hong-phuong&aspect=16:9`, `&aspect=9:16`: intro có/không ảnh; tên dài; lời cảm ơn ngắn/dài; cảnh album.
3. Kiểm tra không chồng ảnh/đèn lồng/sen, vùng chữ đủ độ tương phản, hoa/góc không bị zoom crop, ảnh trong suốt không có quầng.
4. Thử phát video trên màn hình thực, xác nhận chuyển động và vòng lặp.

**Chưa tuyên bố kiểm tra runtime hoặc khả năng thương mại của asset legacy.**
