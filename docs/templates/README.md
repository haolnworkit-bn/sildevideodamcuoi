# Hồ sơ thiết kế template

Mỗi template có một file `docs/templates/<template-id>.md`. ChatGPT soạn nội dung ở bước B1 (xem [HUONG-DAN-CHATGPT.md](../asset-requests/HUONG-DAN-CHATGPT.md)), chủ dự án duyệt, Claude lưu vào repo và cập nhật phần kết quả nghiệm thu.

Hồ sơ là căn cứ để giữ phong cách đồng nhất khi thay hay bổ sung asset sau này. Claude không tự đổi định hướng ghi trong hồ sơ.

## Mẫu hồ sơ (chép ra `<template-id>.md`)

```markdown
# <Tên mẫu> (`<template-id>`)

Trạng thái: nháp | đã duyệt <ngày> | đang làm asset | đã nghiệm thu <ngày>
Loại lễ phù hợp: dạm ngõ / ăn hỏi / đính hôn / vu quy / thành hôn
Phiếu yêu cầu: docs/asset-requests/<mã>-<id>.md

## Concept
3–5 câu: cảm xúc, câu chuyện, điểm khác biệt so với các mẫu khác trong danh mục.

## Bảng màu
| Vai trò | Hex |
|---|---|
| Nền chủ đạo | |
| Tiêu đề / tên (theme.heading, theme.names) | |
| Nội dung (theme.body) | |
| Nhấn (theme.accent) | |
| Đường kẻ (theme.line) | |

## Chất liệu & phong cách
Vd: màu nước trên giấy dó; khắc gỗ Đông Hồ; ánh kim tối giản…

## Font đề xuất
Tiêu đề: <key trong TITLE_FONTS> · Nội dung: <key trong BODY_FONTS>

## Bố cục
- 16:9: trang trí ở đâu, vùng chữ ở đâu.
- 9:16: như trên (bố cục riêng, dải đáy ~320px).

## Danh sách asset
| File | Mô tả | Lớp | Chuyển động | Trạng thái |
|---|---|---|---|---|

## Chuyển động
Vd: cành đung đưa nhẹ, cánh hoa rơi thưa, nền phóng chậm…

## Nghiệm thu
| Ngày | Ai | Kết quả | Ghi chú |
|---|---|---|---|
```
