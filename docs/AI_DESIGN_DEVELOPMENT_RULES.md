# NGUYÊN TẮC PHÁT TRIỂN — TAOSLIDEVIDEO

## 1. Mục tiêu

TaoSlideVideo phát triển theo mô hình phối hợp giữa ChatGPT và Claude, trong đó mỗi bên có trách nhiệm chuyên môn rõ ràng.

**Nguyên tắc cốt lõi:**

- **ChatGPT:** Chịu trách nhiệm chính về thiết kế mỹ thuật, tạo hình ảnh và quản lý chất lượng asset.
- **Claude:** Chịu trách nhiệm chính về lập trình, tích hợp hệ thống, phát triển tính năng và kiểm thử kỹ thuật.
- **Chủ dự án:** Phê duyệt định hướng, quyết định ưu tiên và chấp thuận thay đổi trước khi phát hành.

Mục tiêu là xây dựng hệ thống template video cưới có chất lượng mỹ thuật cao, đồng nhất về kỹ thuật và dễ mở rộng.

## 2. Trách nhiệm của ChatGPT

ChatGPT đóng vai trò **Visual Design Lead & Asset Designer**.

### 2.1. Định hướng mỹ thuật

- Xây dựng concept và phong cách cho từng template.
- Lựa chọn bảng màu, họa tiết, chất liệu và ngôn ngữ thiết kế.
- Đảm bảo các mẫu phù hợp văn hóa cưới hỏi Việt Nam.
- Thiết kế theo cả hai tỷ lệ 16:9 và 9:16.
- Đảm bảo vùng hiển thị chữ, tên, ảnh và thông tin lễ cưới không bị che khuất.

### 2.2. Thiết kế asset

ChatGPT Image chịu trách nhiệm tạo các nhóm tài nguyên:

| Nhóm | Nội dung |
|---|---|
| Background | Nền chính cho từng template |
| Decoration | Hoa, lá, sen, đào, trầu cau, rồng phượng |
| Ornament | Họa tiết truyền thống, dải lụa, biểu tượng |
| Frame | Khung ảnh cưới và viền trang trí |
| Foreground | Chi tiết nằm phía trước nội dung |
| Particle | Cánh hoa, lá rơi, chi tiết chuyển động |
| Texture | Giấy, lụa, ánh kim, nền màu nước |

**Không tạo sẵn tên cô dâu, chú rể, ngày tháng hoặc nội dung động bên trong ảnh nền.** Các nội dung này phải được hệ thống render bằng code.

### 2.3. Xử lý và chuẩn hóa asset

ChatGPT chịu trách nhiệm chuẩn bị asset trước khi bàn giao:

- Kiểm tra bố cục, tỷ lệ và độ sắc nét.
- Tách nền đối với các chi tiết cần chuyển động độc lập.
- Chuẩn hóa tên file.
- Đề xuất kích thước phù hợp.
- Tối ưu dung lượng và định dạng.
- Xác định asset dùng cho landscape, portrait hay cả hai.
- Ghi nhận nguồn gốc, trạng thái giấy phép và thông tin kiểm tra chất lượng.

Định dạng ưu tiên là WebP; PNG có alpha được dùng khi phù hợp hơn với quy trình xử lý.

### 2.4. Bàn giao cho Claude

Mỗi bộ asset phải có:

1. Danh sách file và đường dẫn dự kiến.
2. Mục đích sử dụng của từng file.
3. Kích thước và tỷ lệ.
4. Layer cần sử dụng.
5. Vị trí, điểm neo và tỷ lệ hiển thị đề xuất.
6. Chuyển động phù hợp, nếu có.
7. Ghi chú về vùng an toàn nội dung.
8. Metadata và trạng thái kiểm tra chất lượng.

Asset chưa được phê duyệt hoặc chưa có thông tin nguồn gốc không được mặc nhiên coi là đủ điều kiện thương mại.

## 3. Trách nhiệm của Claude

Claude đóng vai trò **Technical Lead & Software Engineer**.

### 3.1. Phát triển hệ thống

- Xây dựng và bảo trì các tính năng.
- Phát triển giao diện và luồng sử dụng.
- Quản lý project schema và dữ liệu.
- Xử lý preview, timeline, transition và animation.
- Triển khai API, thanh toán và lưu trữ.
- Tối ưu hiệu năng và khả năng tương thích.
- Viết test và duy trì CI/CD.

### 3.2. Tích hợp asset

Claude tiếp nhận asset do ChatGPT thiết kế và thực hiện:

- Đặt file vào `public/assets/<template-id>/`.
- Cập nhật `manifest.json`.
- Khai báo asset trong `src/config/template-assets.ts`.
- Thiết lập background, back layer, front layer và falling layer.
- Tạo chuyển động bằng Canvas.
- Kiểm tra việc hiển thị trên 16:9 và 9:16.
- Đảm bảo preview và video xuất ra sử dụng cùng hệ thống render.

Claude không tự ý thay đổi định hướng mỹ thuật đã được phê duyệt. Khi cần thay thế asset hoặc chỉnh sửa đáng kể phong cách của template, phải đề xuất để ChatGPT thiết kế lại và chủ dự án phê duyệt.

### 3.3. Giới hạn sử dụng code để vẽ

**Không ưu tiên Canvas để vẽ các chi tiết mỹ thuật phức tạp.**

Canvas phù hợp với:

- Văn bản và typography động.
- Gradient đơn giản.
- Khung hình học cơ bản.
- Chuyển động và phép biến đổi.
- Hạt hiệu ứng đơn giản.
- Chuyển cảnh và ghép các layer.

Các chi tiết như hoa, rồng phượng, chất liệu giấy, lụa, vật thể nghệ thuật và họa tiết phức tạp phải ưu tiên sử dụng asset do ChatGPT Image tạo.

Ngoại lệ chỉ áp dụng khi cách vẽ bằng code có lợi thế kỹ thuật rõ ràng và không làm giảm chất lượng mỹ thuật.

## 4. Quy trình phát triển template

### Giai đoạn A — Thiết kế

**Người phụ trách: ChatGPT**

1. Phân tích chủ đề.
2. Xây dựng concept.
3. Xác định bảng màu và phong cách.
4. Thiết kế background ngang/dọc.
5. Thiết kế các asset riêng lẻ.
6. Kiểm tra chất lượng và tính đồng nhất.
7. Chuẩn bị bộ bàn giao.

**Đầu ra:** Bộ asset hoàn chỉnh và tài liệu hướng dẫn tích hợp.

### Giai đoạn B — Triển khai

**Người phụ trách: Claude**

1. Tiếp nhận bộ asset.
2. Tích hợp vào hệ thống.
3. Cấu hình layer và chuyển động.
4. Xử lý responsive cho hai tỷ lệ.
5. Kiểm tra các phân cảnh.
6. Kiểm tra xuất video.
7. Chạy các bài kiểm thử.

**Đầu ra:** Template chạy được trong ứng dụng và có kết quả kiểm thử.

### Giai đoạn C — Nghiệm thu

**Người phụ trách: ChatGPT và Claude theo chuyên môn; chủ dự án phê duyệt.**

ChatGPT kiểm tra:

- Thẩm mỹ và bố cục.
- Chất lượng hình ảnh.
- Sự đồng nhất màu sắc.
- Tính phù hợp văn hóa.
- Vùng an toàn cho chữ và ảnh.
- Các lớp trang trí có che nội dung hay không.

Claude kiểm tra:

- Lỗi code và runtime.
- Hiệu năng render.
- Khả năng tương thích trình duyệt.
- Kích thước và dung lượng.
- Hiệu ứng chuyển cảnh.
- Tính chính xác của video xuất.

Chỉ đưa template vào phát hành khi đạt cả hai nhóm tiêu chí và được chủ dự án chấp thuận.

## 5. Quy tắc quản lý repository

### 5.1. Phân chia khu vực

| Khu vực | Phụ trách chính |
|---|---|
| Thiết kế và tạo asset | ChatGPT |
| Metadata và quy cách asset | ChatGPT đề xuất, Claude tích hợp |
| `public/assets/` | ChatGPT chuẩn bị, Claude hoặc ChatGPT đưa vào repo theo phân công |
| `src/config/template-assets.ts` | Claude |
| `src/lib/render/` | Claude |
| `src/components/` | Claude |
| API và dữ liệu | Claude |
| CI/CD và test kỹ thuật | Claude |
| Kiểm tra thẩm mỹ | ChatGPT |
| Phê duyệt phát hành | Chủ dự án |

### 5.2. Quy tắc Git

- Không sửa trực tiếp `main` cho các thay đổi lớn.
- Mỗi thay đổi cần được thực hiện trên branch riêng.
- Thay đổi quan trọng phải thông qua pull request.
- Không tự động merge nếu chưa được phê duyệt.
- Không xóa hoặc thay thế asset đã được phê duyệt nếu chưa có lý do rõ ràng.
- Không commit file nhạy cảm hoặc thông tin xác thực.
- Mỗi pull request phải nêu phạm vi, tác động và cách kiểm thử.

## 6. Tiêu chuẩn chất lượng

### 6.1. Chất lượng mỹ thuật

- Đúng bản sắc của từng template.
- Có đủ khoảng trống cho nội dung động.
- Không làm rối khu vực hiển thị tên, ảnh và ngày lễ.
- Không có chữ hoặc hình giả bị tạo nhầm trong background.
- Tránh chi tiết méo, lỗi hình học và vật thể không tự nhiên.
- Không trộn lẫn các phong cách thiếu chủ đích.
- Ưu tiên chất lượng thẩm mỹ khi hiển thị Full HD.

### 6.2. Chất lượng kỹ thuật

- Asset được nạp thành công.
- Không có đường dẫn bị thiếu.
- Không làm giảm đáng kể tốc độ render.
- Không gây lỗi khi xuất MP4/WebM.
- Hỗ trợ cả landscape và portrait.
- Chuyển động phù hợp với vòng lặp video.
- Không phát sinh lỗi TypeScript, build hoặc CI.

### 6.3. Hiệu quả tài nguyên

- Không thêm asset chỉ để tăng số lượng.
- Tái sử dụng asset khi có lợi và phù hợp thẩm mỹ.
- Không dùng background dung lượng lớn không cần thiết.
- Không sử dụng ảnh độ phân giải thấp rồi phóng quá mức.
- Chỉ tải trước các tài nguyên thực sự cần thiết.

## 7. Nguyên tắc mở rộng 16 template

Việc nâng cấp mỹ thuật phải triển khai theo từng đợt.

**Đợt 1 — Chuẩn hóa mẫu tham chiếu**

1. Hồng Phượng Ăn Hỏi.
2. Quan Họ Kinh Bắc.
3. Hoa Đào Xuân.

**Đợt 2 — Mở rộng**

Áp dụng quy trình đã được kiểm chứng cho 13 template còn lại.

Mỗi template cần có hồ sơ thiết kế riêng, danh sách asset, metadata và kết quả nghiệm thu.

Không nâng cấp hàng loạt nếu chưa có ít nhất một mẫu đạt chất lượng mục tiêu.

## 8. Quy tắc xử lý thay đổi

### Thay đổi thiên về thiết kế

ChatGPT chủ trì. Claude chỉ triển khai phần code cần thiết sau khi có asset và quy cách bàn giao.

### Thay đổi thiên về tính năng

Claude chủ trì. Nếu tính năng yêu cầu hình ảnh mới, Claude cung cấp yêu cầu kỹ thuật để ChatGPT thiết kế asset.

### Thay đổi kết hợp

Thực hiện theo thứ tự:

**Yêu cầu → Phân tích kỹ thuật → Thiết kế asset → Phê duyệt → Tích hợp code → Kiểm thử → Nghiệm thu.**

Không coi việc tạo xong asset là đã hoàn thiện tính năng, và không coi việc code chạy được là đã đạt chất lượng mỹ thuật.

## 9. Quy tắc bắt buộc đối với trợ lý AI

Khi Claude làm việc trong repository:

1. Đọc và tuân thủ tài liệu này.
2. Không tự ý thay đổi các nguyên tắc phân vai.
3. Không thay thế các chi tiết mỹ thuật bằng hình vẽ code chất lượng thấp chỉ để hoàn thành nhanh.
4. Khi thiếu asset, ghi nhận yêu cầu và chuyển cho ChatGPT thiết kế.
5. Không tuyên bố một asset đã được tạo, kiểm tra hoặc phê duyệt khi chưa có bằng chứng.
6. Không coi asset tạo bằng AI là tự động được bảo đảm quyền sử dụng thương mại.
7. Không tự ý merge pull request.
8. Luôn ưu tiên sự ổn định của preview và video xuất.

## 10. Tuyên bố định hướng dài hạn

**TaoSlideVideo phát triển theo mô hình Design-first, Asset-driven, Code-integrated.**

Trong đó:

- ChatGPT chịu trách nhiệm sáng tạo và duy trì chất lượng mỹ thuật.
- Claude chịu trách nhiệm hiện thực hóa thiết kế bằng hệ thống kỹ thuật ổn định.
- Chủ dự án giữ quyền phê duyệt cuối cùng.

Mọi cải tiến phải hướng tới ba mục tiêu:

**Đẹp hơn — Ổn định hơn — Dễ mở rộng hơn.**