# Hướng dẫn làm việc với ChatGPT để làm lại template

Dành cho chủ dự án. Mục tiêu: làm lại mỹ thuật cho toàn bộ template, theo đúng [quy tắc phân vai](../AI_DESIGN_DEVELOPMENT_RULES.md).

## 1. Lộ trình

| Bước | Ai làm | Đầu ra |
|---|---|---|
| **0. Rà soát danh mục mẫu** | ChatGPT đề xuất, bạn duyệt | Danh sách mẫu **giữ / gộp / bỏ / thêm mới**. Hiện có nhiều cặp na ná nhau (Hoa Đào Xuân ↔ Hồng Phượng; Ngọc Trai ↔ Thanh Lịch ↔ Hoàng Kim ↔ Tối Giản) |
| **1. Đợt 1:** Hồng Phượng → Quan Họ → Hoa Đào | ChatGPT thiết kế, Claude tích hợp | 3 mẫu đạt chuẩn, chốt quy trình |
| **2. Đợt 2:** các mẫu còn lại, 2–3 mẫu một lần | như trên | — |

Đợt 1 chưa có mẫu nào đạt chuẩn thì không làm sang Đợt 2.

## 2. Quy trình cho MỖI mẫu

1. **Mở 1 cuộc chat ChatGPT riêng cho mẫu đó.** Giữ cả mẫu trong cùng một chat để phong cách đồng nhất.
2. Dán **prompt khởi động** (mục 3) + file [00-QUY-CACH-CHUNG.md](00-QUY-CACH-CHUNG.md) + phiếu của mẫu (vd [HP-hong-phuong.md](HP-hong-phuong.md)). Mẫu chưa có phiếu: nhờ Claude soạn trước.
3. ChatGPT trả về **hồ sơ thiết kế** (concept, bảng màu, danh sách asset, phác bố cục ngang/dọc). **Bạn duyệt hồ sơ trước** khi ChatGPT vẽ. Hồ sơ đã duyệt được lưu vào `docs/templates/<id>.md` theo [mẫu hồ sơ](../templates/README.md).
4. ChatGPT tạo **ảnh tham chiếu phong cách** (1 ảnh ghép toàn cảnh ở khổ ngang). Bạn duyệt ảnh này xong, mọi asset sau phải bám theo nó.
5. ChatGPT tạo từng asset, **mỗi ảnh một vật**, rồi bàn giao theo mục 5.
6. Bạn đưa gói bàn giao cho Claude. Claude tích hợp, chụp 16:9 + 9:16 và gửi lại ảnh chụp.
7. Đưa ảnh chụp cho ChatGPT **nghiệm thu mỹ thuật**; ChatGPT ghi lỗi cần sửa → làm lại bước 5 cho riêng asset đó.
8. Bạn duyệt cuối, rồi Claude mở PR.

## 3. Prompt khởi động (dán vào đầu mỗi chat)

```text
Bạn là Visual Design Lead của TaoSlideVideo — web app tạo video nền cho lễ dạm ngõ / ăn hỏi /
đính hôn / vu quy / thành hôn của Việt Nam (chiếu trên TV/LED ở rạp cưới và trên điện thoại).
Bạn chịu trách nhiệm thiết kế mỹ thuật và tạo asset; Claude (lập trình) sẽ tích hợp vào engine
Canvas; tôi là chủ dự án, duyệt mọi bước.

Mẫu cần làm: <TÊN MẪU> (id: <id-mau>).
Tôi gửi kèm: (1) quy cách kỹ thuật chung, (2) phiếu yêu cầu của mẫu này.
Phiếu ghi hiện trạng, các phần phải thay, vùng an toàn cho chữ, và các quyết định đã chốt.

Ràng buộc bắt buộc:
- Chữ (tên, ngày, lời cảm ơn, chữ Hán) do code vẽ: TUYỆT ĐỐI không có chữ trong ảnh.
- Hai khổ 1920×1080 và 1080×1920, bố cục RIÊNG cho từng khổ, không cắt từ khổ kia.
- Giữa khung phải yên tĩnh để chữ đọc rõ; trang trí dồn về góc/rìa theo vùng an toàn trong quy cách.
- Mỗi vật cần chuyển động riêng là 1 file PNG nền trong suốt, gốc/cuống chạm mép ảnh ở phía điểm neo.
- Tự thiết kế; không sao chép hình, bố cục hay tên mẫu của cinelove.me hay sản phẩm khác.
- Phù hợp văn hoá cưới hỏi Việt Nam; trang phục, biểu tượng phải đúng.

Làm theo thứ tự, DỪNG chờ tôi duyệt sau mỗi bước:
  B1. Hồ sơ thiết kế: concept 3–5 câu, bảng màu (mã hex, có màu chữ tiêu đề/tên/nội dung),
      chất liệu, danh sách asset (theo bảng trong phiếu, được phép đề xuất thêm/bớt kèm lý do),
      phác bố cục 16:9 và 9:16 bằng lời hoặc sơ đồ ô.
  B2. Một ảnh tham chiếu phong cách (toàn cảnh khổ ngang, chỉ để duyệt, không dùng làm asset).
  B3. Tạo từng asset theo danh sách đã duyệt.
  B4. Bàn giao: bảng file + đoạn JSON manifest theo mẫu trong quy cách chung.
Bắt đầu bằng B1.
```

## 4. Mẹo kỹ thuật khi ChatGPT tạo ảnh

- **Nền trong suốt:** yêu cầu rõ *"PNG, transparent background, isolated object, no shadow on ground, no frame"*. Kiểm tra trước khi nhận: mở ảnh trên nền tối, không được có viền trắng hay ô cờ giả.
- **Kích thước:** ChatGPT thường xuất 1536×1024 hoặc 1024×1536. Muốn có nền 16:9 thì cắt ra 1536×864 rồi upscale ×1.25 lên 1920×1080 bằng công cụ upscale AI, không phóng thô. Ghi kích thước gốc vào `nativeDimensions`.
- **Đồng nhất:** mỗi lần tạo asset, nhắc lại *"theo đúng phong cách ảnh tham chiếu đã duyệt, cùng bảng màu <hex>"*. Đính kèm lại ảnh tham chiếu nếu ChatGPT bắt đầu lệch.
- **Một vật mỗi ảnh:** đừng xin "bộ 5 bông sen" trong một ảnh rồi tự cắt. Xin từng bông. Bài học Hồng Phượng B3: ảnh ghép rồi cắt ra chỉ còn ~400px, phải phóng ×3 và dính mẩu vật bên cạnh.
- **Hạt rơi (cánh hoa, lá):** vật ở chính giữa, cắt sát, nhiều biến thể nhỏ khác nhau.
- **Nền:** xin rõ *"empty center for text, decorations only in corners, no text, no letters, no calligraphy, no watermark"*. AI hay tự chèn chữ giả, cần soi kỹ.

## 5. Gói bàn giao cho Claude

**Định dạng trong repo: WebP** (nền: WebP không alpha; trang trí/hạt: WebP có alpha). ChatGPT Image chỉ tải về được PNG,
nên **không cần ChatGPT tự đổi đuôi**: cứ nộp PNG gốc lớn nhất, Claude chuyển sang WebP (sharp), đặt tên, cập nhật manifest.

Cách nộp đơn giản nhất: tải từng ảnh về `_inbox/<id-mau>/` (thư mục bị git bỏ qua), đặt tên theo mã asset
(`HP-03.png`…), rồi báo Claude. Kèm bảng đặt asset (neo, x/y, cỡ, chuyển động) nếu khác hồ sơ đã duyệt.

Ảnh gốc khổ lớn và ảnh tham chiếu nên lưu thêm ở Google Drive theo thư mục `<id-mau>/goc/` để giữ làm bằng chứng nguồn gốc. Repo chỉ chứa bản WebP đã duyệt.
