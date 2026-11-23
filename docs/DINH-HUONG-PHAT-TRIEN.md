# Định hướng phát triển TaoSlideVideo

Soạn 2026-11-20. Trạng thái: **đề xuất**, chờ chủ dự án duyệt từng giai đoạn.

## 1. Định vị

Không đua số lượng mẫu với cinelove và các trang tương tự. Thắng ở chỗ:

> **Xong trong 5 phút trên điện thoại, chiếu ngay tại rạp, đúng phong tục Việt.**

## 2. Một dự án, nhiều sản phẩm

Nhập thông tin **một lần**, nhận về cả bộ đồng bộ cùng một mẫu. Engine Canvas hiện tại đã vẽ được, chỉ cần thêm khổ hình và cách xuất.

| Sản phẩm | Dùng ở đâu | Hiện trạng |
|---|---|---|
| Video ngang 16:9 | Màn LED, TV ở rạp | Có |
| Video dọc 9:16 | Facebook, TikTok, Zalo | Có |
| Thiệp mời online (link + QR) | Gửi khách qua Zalo | Chưa |
| Ảnh thiệp để in | In thiệp giấy | Chưa (có xuất PNG) |
| Bảng chào cổng khổ lớn | Standee, backdrop | Chưa |

## 3. Thiệp online: kênh lan truyền miễn phí

Mỗi đám cưới gửi thiệp cho 200–500 người. Trang thiệp gồm:
- Thông tin lễ, ảnh, bản đồ, xác nhận tham dự (RSVP).
- Mã QR mừng cưới (VietQR).
- Dòng nhỏ "Tạo thiệp tại …": khách mời sắp cưới sẽ biết đến sản phẩm.

## 4. Đậm chất Việt

- Lời mời và lời cảm ơn theo vùng miền; tự đổi xưng hô nhà trai/nhà gái; tên bố mẹ hai họ như thiệp truyền thống.
- Lịch âm (đã có), giờ hoàng đạo.
- Bộ mẫu theo vùng miền và mùa: Bắc (đào, sen, Quan Họ), Trung (Huế), Nam (mai vàng, áo bà ba).

## 5. Chiếu tại rạp

- Link `/v/<mã>` kèm QR: Smart TV mở là chiếu, không cần USB.
- Chế độ lịch trình: trước giờ lễ chiếu lời chào khách → đến giờ lễ chuyển sang tên và ngày → sau đó chiếu ảnh kỷ niệm.

## 6. Kiếm tiền

- **Miễn phí có watermark.** Trả theo đám (khoảng 49–99 nghìn) để xuất bản sạch, hoặc mua trọn bộ video + thiệp + backdrop.
- **Khách doanh nghiệp:** gói tháng cho nhà hàng tiệc cưới, studio, thợ trang trí tráp. Video mang logo của họ, làm hàng chục đám mỗi tháng. Đây là nguồn thu ổn định nhất.
- Khung kiếm tiền đã có trong code (đang tắt): watermark, paywall, checkout mock.

## 7. Lộ trình

| Giai đoạn | Việc | Cần |
|---|---|---|
| **1 (đang làm)** | Xong 3 mẫu Đợt 1; editor ổn trên điện thoại; rà soát danh mục mẫu (gộp còn khoảng 8–10 mẫu) trước Đợt 2 | — |
| **2** | Tài khoản + lưu dự án online; **thiệp online + link chiếu TV** | Backend, DB (Neon), lưu trữ ảnh/nhạc |
| **3** | Thanh toán theo đám (PayOS/VietQR); render bản sạch phía server để chống lách watermark | Cổng thanh toán, headless Chrome |
| **4** | Gói doanh nghiệp; bộ mẫu vùng miền; AI viết lời chào | Có khách hàng thật |

**Ưu tiên khuyến nghị:** làm **thiệp online** ngay sau giai đoạn 1. Nó vừa là sản phẩm khách cần nhất, vừa tự đem người dùng về, và cũng là nền móng cho link chiếu TV.

## 8. Việc nhỏ còn tồn (giai đoạn 1)

- Chụp kiểm tra và sửa editor ở màn hình điện thoại (chưa từng kiểm).
- WebM (nhánh dự phòng) chưa ghi thời lượng trong header.

Đã xong (2026-11-23, nhánh `chore/stage1-leftovers`): xuất MP4 chế độ 1 cảnh (8s/vòng, đã đo); dọn code Đông Hồ trong `quan-ho.ts`;
giới hạn độ dài tiêu đề/lời chào/tên/địa chỉ có cảnh báo (`TEXT_LIMITS`); ảnh thu nhỏ theo tỉ lệ (editor + nút chọn khung ở trang chủ).
Lưu/mở dự án bằng file: đã có sẵn (nút Sao lưu / Phục hồi trong editor).
