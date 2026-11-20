# Quy tắc quản lý nguồn artwork

Ảnh ChatGPT Image và ảnh sưu tầm **được phân loại theo chức năng tại `public/assets`**, không theo nguồn tạo. Nguồn phải được lưu qua `manifest.json` và chứng từ quyền sử dụng riêng.

- Ảnh AI gốc / phương án loại: `design-assets/generated/<template-id>/`
- Ảnh bên ngoài: `design-assets/collected/<template-id>/`
- Bằng chứng giấy phép: `design-assets/licenses/`; không đưa vào `public`.
- Chỉ asset đã qua thẩm mỹ, kỹ thuật, giấy phép và QA mới được phát hành thương mại.
- Asset đã tích hợp hiện có nguồn chưa xác minh: `source: "unknown"`, `licenseStatus: "unverified"`. Không được thay nhãn bằng "approved" khi chưa có chứng từ.
- Background cần hai bản được thiết kế riêng 16:9 và 9:16; chữ do Canvas dựng.
- Khuyến nghị kiểm duyệt nội bộ: thẩm mỹ 25%, đồng bộ 20%, bố cục 20%, kỹ thuật 15%, văn hóa 10%, chuyển động 10%; mục tiêu >= 90/100 và không còn lỗi bắt buộc.

Xem thêm: [public/assets/README.md](../public/assets/README.md).
