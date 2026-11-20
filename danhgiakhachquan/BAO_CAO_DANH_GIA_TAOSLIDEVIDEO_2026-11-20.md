# BÁO CÁO ĐÁNH GIÁ & ĐỊNH HƯỚNG NÂNG CẤP TAOSLIDEVIDEO

> **Phiên bản đánh giá:** 20/11/2026  
> **Repository:** [haolnworkit-bn/sildevideodamcuoi](https://github.com/haolnworkit-bn/sildevideodamcuoi)  
> **Nhánh:** `main` · **Commit:** [`146685be85d6132e3ed1f552d2683a5c8dd81f83`](https://github.com/haolnworkit-bn/sildevideodamcuoi/commit/146685be85d6132e3ed1f552d2683a5c8dd81f83) (`fix`)  
> **Loại:** Technical / Product / UI-UX / Design Quality Review  
> **Trạng thái:** Đánh giá tĩnh mã nguồn và tài nguyên; **chưa** chạy ứng dụng, đo FPS, render toàn bộ mẫu hoặc kiểm chứng video trên thiết bị thực.

---

## 0. Tóm tắt điều hành

**Nhận định:** TaoSlideVideo đã có lõi sản phẩm rõ ràng: người dùng chọn mẫu → nhập nội dung lễ → thêm ảnh/nhạc → xem trước → trình chiếu TV hoặc xuất video. Điểm mạnh là **một render engine Canvas 2D dùng chung** cho preview, thumbnail, presenter và export; cấu trúc template tương đối dễ mở rộng; có hỗ trợ nghi lễ và lịch âm Việt Nam. Tuy nhiên, **chất lượng thị giác và sự ổn định đầu ra chưa đồng đều để định vị sản phẩm cao cấp**.

**Định hướng khuyến nghị:** Trong 1–2 chu kỳ phát triển tới, **không ưu tiên tăng số lượng mẫu**. Tập trung nâng chất lượng 16 mẫu hiện có, bổ sung layout system, chuẩn hóa font/đồ họa, kiểm thử ảnh & video, sửa lỗi ảnh hưởng đầu ra. Kiếm tiền và render server là giai đoạn sau khi chất lượng sản phẩm đã được chứng minh.

### 5 quyết định ưu tiên

1. **Đảm bảo video xuất đúng và đẹp:** sửa fallback WebM, kiểm tra tính tương thích MP4/AAC, thời lượng, font và asset trước khi xuất.
2. **Đưa 16 template về một chuẩn chất lượng:** hoàn thiện 3 mẫu chủ lực trước, xây dựng visual regression rồi mới mở rộng cả bộ.
3. **Không để người dùng mất chữ / sai bố cục:** chuẩn hóa text fitting, safe area, vị trí ảnh, tên dài, lời cảm ơn và 9:16.
4. **Chuyển từ “đồ họa thuật toán” sang art direction có hệ thống:** ảnh trang trí nhất quán chất liệu, đúng bản sắc Việt, tối ưu cả ngang và dọc; giữ Canvas cho text/hình học/motion.
5. **Đầu tư quy trình sản phẩm:** quality gates, checklist phát hành, CI, hướng dẫn người dùng, khôi phục dữ liệu và đo lường lỗi thực tế.

### Đánh giá định tính (không phải benchmark)

| Trụ cột | Mức hiện tại | Mức mục tiêu | Nhận xét |
|---|---:|---:|---|
| Kiến trúc render | 4/5 | 5/5 | Chung một pipeline, modular; cần kiểm soát trạng thái & kiểm thử |
| Đa dạng chủ đề/palette | 4/5 | 5/5 | 16 chủ đề có bản sắc; một số trùng nhóm cảm xúc |
| Đa dạng bố cục | 2/5 | 4/5 | Quá phụ thuộc một `scenes.ts` và các tọa độ cố định |
| Typography | 3/5 | 5/5 | Font đa dạng nhưng fit/spacing/độ tương phản chưa có quality gate |
| Artwork/tài nguyên | 2/5 | 4/5 | Nhiều mẫu còn vẽ hoa/người/vật thể bằng code; ảnh dọc thiếu |
| Chất lượng đầu ra đa trình duyệt | 2/5* | 4/5 | Có nhánh fallback thiếu lặp; chưa benchmark runtime |
| UX tạo video | 3/5 | 4/5 | Luồng khá đầy đủ, nhưng cần cảnh báo và chỉ dẫn kết quả |
| Sẵn sàng thương mại hóa | 1/5 | 4/5 | Thanh toán giả lập; quyền lưu localStorage |

\* **Điểm rủi ro dựa trên code**, không hàm ý đo chất lượng video thực tế.

---

## 1. Phạm vi, phiên bản và mức độ tin cậy

### 1.1 Phiên bản thực sự nhìn thấy

Tại thời điểm truy vấn, GitHub connector trả về **duy nhất nhánh `main`**, head `146685be85d6132e3ed1f552d2683a5c8dd81f83`, **3 commit** (`first commit`, `update`, `fix`), không có pull request được trả về. Tree của commit này có **102 mục** (gồm thư mục và file), với **16 template được đăng ký trong `TEMPLATES`**. Nếu người phát triển đã push commit tiếp theo nhưng chưa hiện qua kết nối, báo cáo **không bao gồm** commit đó.

### 1.2 Đã kiểm tra

- Danh sách file và tài nguyên trên `main`; 16 định nghĩa template trong `src/lib/render/templates/`.
- `render/engine.ts`, `scenes.ts`, `helpers.ts`, `timeline.ts`, `theme.ts`, `types.ts`, `layers.ts`, `assets.ts`.
- `config/template-assets.ts`, thư mục `public/assets/`, `fonts.ts`.
- Export video, media/draft, editor, gallery/thumbnail, presenter, music library, trang `/dev/frames` và `/dev/export`.
- Định hướng từ `README.md` và `CLAUDE.md` (có nội dung chưa được cập nhật đồng bộ).

### 1.3 Chưa kiểm tra

- Kết quả render trực quan của mọi cảnh, so sánh ảnh pixel, kiểm tra dấu tiếng Việt trên thiết bị thật.
- `npm run typecheck`, `npm run build`, Playwright, browser WebCodecs, RAM/FPS trên desktop/mobile/Smart TV.
- Giấy phép và nguồn gốc từng ảnh WebP/font/nhạc ở cấp pháp lý; chỉ có thể khuyến nghị quy trình kiểm tra.

**Quy tắc đọc báo cáo:** **[XÁC NHẬN QUA CODE]** nghĩa là có cấu trúc/hành vi tương ứng trong mã; **[RỦI RO CẦN TEST]** nghĩa là khả năng ảnh hưởng thực tế cần bằng chứng bằng render hoặc thiết bị. Không xem dự đoán thẩm mỹ là lỗi đã tái hiện.

---

## 2. Định vị sản phẩm nên theo đuổi

### 2.1 Tầm nhìn

> **Một studio tạo video nghi lễ Việt Nam ngay trên trình duyệt** — đẹp, trang trọng, có bản sắc địa phương, tùy chỉnh nhanh, xuất file đáng tin cậy để chiếu màn hình lớn và chia sẻ mạng xã hội.

**Khác biệt nên xây dựng:** (i) chi tiết lễ Việt và lịch âm đúng; (ii) thiết kế đủ đẹp để chiếu trong ngày trọng đại; (iii) không cần kỹ năng dựng video; (iv) dùng được cả TV/LED và story/reel; (v) chất lượng xuất ổn định, không phải thử nhiều lần.

### 2.2 Trải nghiệm tiêu chuẩn

1. **Khám phá mẫu:** chọn theo *loại lễ, phong cách, gam màu, vùng miền, tỷ lệ*, không chỉ theo màu rạp.
2. **Tùy chỉnh:** điền thông tin theo wizard nhẹ, xem trước ngay, cảnh báo lỗi/nội dung tràn tại chỗ.
3. **Xem trước:** ảnh không bị cắt mặt, font đúng dấu, vật trang trí không che tên/ngày; mobile có thể preview mượt.
4. **Xuất:** biết rõ định dạng, thời lượng ước tính, chất lượng, âm thanh có/không; tiến độ rõ; file kiểm tra được.
5. **Sử dụng thực tế:** có hướng dẫn TV/LED/HDMI/USB và lựa chọn không nhạc, có nhạc, 16:9/9:16.
6. **Khôi phục:** mất tab/đổi máy không mất công sức (trước mắt export/import project, sau đó cloud).

### 2.3 Những việc chưa nên làm ngay

- Thêm hàng loạt template mới khi 16 mẫu cũ chưa có chuẩn chất lượng.
- Tích hợp payment thật trước khi hoàn tất chất lượng export, quyền truy cập và lưu trữ.
- Viết lại toàn bộ Canvas sang framework đồ họa khác khi chưa có benchmark chứng minh lợi ích.
- Thêm quá nhiều effect “wow” gây rối, che chữ, giảm độ trang trọng.

---

## 3. Danh mục vấn đề cần ưu tiên sửa

**Thang mức độ:** **P0** ảnh hưởng tính đúng/sự tin cậy hoặc thu tiền; **P1** ảnh hưởng chất lượng đầu ra/khả năng hoàn thành video; **P2** cải thiện lớn UX, maintainability; **P3** tinh chỉnh.

| ID | Ưu tiên | Nhận định & bằng chứng | Hành động | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| VID-01 | **P0** | **[XÁC NHẬN QUA CODE]** `exportWebmRealtime()` chỉ render đến `D`, không sử dụng `o.loops`; lựa chọn 1/3/5 phút có thể xuất chỉ 1 vòng ở fallback. [`video.ts`](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/export/video.ts) | Ghi `D * loops` hoặc hiển thị giới hạn rõ; test metadata duration, logic loop & audio policy. | File fallback đạt thời lượng đã chọn trong sai số ≤ 1 frame/cấu hình hỗ trợ; không báo sai về âm thanh. |
| REN-01 | **P1** | **[XÁC NHẬN QUA CODE]** `messageScene` dùng `.slice(0, 11/7)` khi nội dung dài → có thể cắt mất lời cảm ơn. [`scenes.ts`](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/scenes.ts) | Validator ký tự/dòng; auto-fit có ngưỡng min; chia trang/cảnh nếu quá dài. | Không còn mất văn bản âm thầm; editor báo rõ nếu không vừa. |
| REN-02 | **P1** | **[RỦI RO CẦN TEST]** `fitFont()` giảm size đến ngưỡng tối thiểu nhưng không tự kiểm tra overflow cuối; vài nhãn/tiêu đề dùng font cố định; khó kiểm soát tên rất dài. | Text layout engine có `measureText`, line break, cap size, safe area. | Tên dài/vietnamese dấu được QA ở cả 2 tỷ lệ và 11+9 font tùy chọn. |
| REN-03 | **P1** | **[RỦI RO CẦN TEST]** `setSpacing(ctx,...)` thay đổi state trên canvas, nhiều nơi thiếu `ctx.save()/restore()` quanh mỗi block/line; spacing có thể kế thừa qua lần vẽ. [`helpers.ts`](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/helpers.ts) | Bọc text draw trong state guard; reset spacing/align/baseline/alpha. | Snapshot chữ nhất quán giữa preview/export tại cùng t và input. |
| ART-01 | **P1** | **[XÁC NHẬN QUA CODE]** `hong-phuong.ts` gọi `getAsset('/assets/hong-phuong/dai-lua-hong.webp')` trong ornament; file này không nằm trong danh sách URL preload ở `template-assets.ts` → fallback thay vì asset, trừ khi được register từ nơi khác. | Khai báo asset dùng cho ornament trong registry hoặc loader tự register theo URL; test hiện ảnh. | Ornament xuất hiện đúng khi asset tồn tại; không lặng lẽ fallback. |
| ART-02 | **P1** | **[XÁC NHẬN QUA CODE]** `hoa-dao-xuan` chỉ có nền ảnh ngang; `hong-phuong` dùng cùng file nền cho ngang/dọc. | Artwork nền 2 tỷ lệ, kiểm vùng chữ & crop. | Không cắt vật thể chính ở 9:16; giữ vùng chữ an toàn. |
| ART-03 | **P1** | **[XÁC NHẬN QUA CODE]** `TEMPLATE_ASSETS` chỉ định nghĩa riêng `hoa-dao-xuan`, `quan-ho-kinh-bac`, `hong-phuong`; các mẫu còn lại chủ yếu dùng canvas vẽ vật thể. | Chọn chuẩn artwork; thay từng nhóm vật thể cần tính nghệ thuật; không ép tất cả dùng raster. | 3 mẫu tham chiếu đạt chuẩn trước khi mở rộng 13 mẫu còn lại. |
| UX-01 | **P1** | **[XÁC NHẬN QUA CODE]** Gallery thumbnail luôn render 16:9 dù sản phẩm hỗ trợ 9:16; preview khi chưa tải assets có thể khác lúc xuất. | Cho xem preview theo ratio, trạng thái assets/fonts ready, thumbnail tĩnh chuẩn. | Người dùng chọn được tỷ lệ trước khi vào editor và thấy bố cục tương ứng. |
| AUD-01 | **P1** | **[XÁC NHẬN QUA CODE]** WebM fallback báo `audioDropped` khi có audio; nhạc không được mux trong fallback. | Kiểm tương thích ở UI, cảnh báo rõ, cân nhắc MediaStream audio mix / server fallback. | Không có trường hợp người dùng tưởng file có nhạc nhưng file không có. |
| DATA-01 | **P2** | **[XÁC NHẬN QUA CODE]** project lưu 1 draft trong localStorage; ảnh/nhạc IndexedDB trên thiết bị. | Export/import gói project kèm media + schema version; sau đó cloud. | Có thể backup và restore đầy đủ trên máy khác. |
| PERF-01 | **P2** | **[RỦI RO CẦN TEST]** eager preload asset của mọi template lúc import `templates/index.ts`, cùng RAF thumbnail trên các card. | Chỉ preload visible/selected, pause thumbnail khi ngoài viewport, cache static frames. | Đo TTI, FPS và peak memory theo thiết bị; không tải tài nguyên của 16 mẫu ngay lập tức. |
| BIL-01 | **P0 nếu bật thu tiền** | **[XÁC NHẬN QUA CODE]** `localStorage` giữ trạng thái unlock; `/api/checkout` trả `paid` khi `PAYMENT_PROVIDER=mock`. | Để monetization off trước khi có payment/webhook + DB + server authorization. | Không xuất sạch dựa thuần client entitlement khi thu tiền thật. |
| DOC-01 | **P2** | **[XÁC NHẬN QUA CODE]** `README.md`, `CLAUDE.md` còn mô tả 11 mẫu; README ghi dev `localhost:3000`, `package.json` chạy `8080`. | Đồng bộ tài liệu với code; có script/check docs. | README hướng dẫn đúng cổng, số mẫu, lộ trình và fallback. |
| QA-01 | **P1** | **[XÁC NHẬN QUA CODE]** có `/dev/frames` và `/dev/export` nhưng chưa thấy pipeline visual regression/CI trong tree. | Playwright screenshot matrix, export smoke tests, GitHub Actions. | PR fail nếu sai visual baseline/break build/không đạt smoke export. |

**Ghi chú quan trọng:** `P0` ở payment **chỉ kích hoạt nếu quyết định thu tiền thật**. Trong định hướng hiện tại (`CLAUDE.md` cho biết kiếm tiền đang tắt), nên ưu tiên `VID-01` và chất lượng mẫu trước.

---

## 4. Đánh giá 16 template — giữ gì, sửa gì

Đây là **đánh giá dựa trên code** của palette, photo mode, motif và asset; không phải phán quyết sau xem video render.

| # | Template | Điểm mạnh giữ lại | Vấn đề/giới hạn tiềm tàng | Hướng nâng cấp thẩm mỹ | Ưu tiên |
|---:|---|---|---|---|---|
| 1 | **Hoa Đào Xuân** | Hồng phấn, chủ đề rõ, có nền watercolor ngang | Nền dọc chưa có; hoa/cành vẽ bằng code có thể thiếu độ tự nhiên | Bổ sung nền dọc, cành đào nhiều lớp watercolor, cánh hoa mỏng; giảm mật độ trang trí ở vùng chữ | A |
| 2 | **Trầu Cau** | Bản sắc cưới truyền thống, xanh lá/đỏ/vàng | Vật thể lá, cau, lụa chủ yếu vẽ bằng code | Ảnh thực vật vẽ tay, dải lụa chất liệu lụa, họa tiết vàng tiết chế | B |
| 3 | **Hỷ Sự Đỏ Vàng** | Đỏ son, huy chương, trang trọng | Dễ quá dày chi tiết kim tuyến, trùng Tết Đoàn Viên | “Formal ceremonial”: song hỷ sạch, đường viền cân đối, vàng dịu | A |
| 4 | **Sen Ngọc** | Bảng xanh ngọc mát, cảm xúc yên tĩnh | Mặt nước + sen thuật toán có thể phẳng | Art watercolor sen, chiều sâu hậu cảnh, gợn nhẹ | B |
| 5 | **Mẫu Đơn** | Kem–đỏ, cảm giác sang và truyền thống | Hoa đa lớp code có thể chưa tinh tế | Petal asset có độ trong, bố cục thoáng, khung ảnh ít trang trí | B |
| 6 | **Tử Đằng** | Màu tím có nhận diện, hoa rủ | Hoa/gân vẽ code, chuyển động có thể đều | Asset chùm hoa chiều dài khác nhau, độ mờ theo lớp, parallax rất nhẹ | B |
| 7 | **Cẩm Tú Cầu** | Xanh dương pastel dịu | Khối hoa có thể giống pattern hơn artwork | Texture giấy, cụm cẩm tú cầu kích thước tự nhiên, ánh sáng mềm | B |
| 8 | **Thu Vàng** | Ấm áp, khác biệt với mẫu hồng/đỏ | Lá rơi dễ tạo cảm giác slideshow mùa thu chung chung | Lá nhiều hình/cỡ, ảnh chính nổi bật, giấy ngà và nắng nhẹ | C |
| 9 | **Ngọc Trai** | Trắng ngà và champagne, huy chương | Thiếu độ thật của chất liệu ngọc trai | Pearl highlight tinh tế, đường viền mỏng, typography thanh lịch | B |
| 10 | **Thanh Lịch** *(Premium)* | Sage/kem hiện đại, photo fullbleed | Chữ trên ảnh chịu ảnh hưởng sáng tối của ảnh người dùng | Adaptive scrim/gradient, khoảng trắng, font caps/chữ ký cao cấp | A |
| 11 | **Hoàng Kim** *(Premium)* | Navy–vàng, monogram Art Deco | Vàng/bokeh nhiều dễ giống hiệu ứng tiệc thông thường | Dùng hệ đường hình học nhất quán, ánh kim vừa đủ, motion cinematic | **A — mẫu chuẩn** |
| 12 | **Tết Đoàn Viên** | Đèn lồng/hoa mai phù hợp mùa Tết | Trùng nhóm đỏ–vàng với Hỷ Sự | Nhấn rõ “Tết & gia đình”, motif hoa mai/lồng đèn riêng, giảm trùng | B |
| 13 | **Dừa Xanh Miền Tây** | Ý tưởng vùng miền khác biệt | Dừa/lá/sen code có thể chưa thể hiện chất liệu tự nhiên | Phong cách watercolor botanical, chất miệt vườn tinh tế, không rườm rà | B |
| 14 | **Tối Giản Đêm Xanh** *(Premium)* | Navy–bạc, thiết kế ít chi tiết | Dễ trùng Hoàng Kim khi chỉ đổi vàng thành bạc | Ultra-minimal: không nhiều bokeh, chữ/nhịp điệu là nhân vật chính | A |
| 15 | **Quan Họ Kinh Bắc** | Chủ đề văn hóa rất mạnh, giấy điệp/chàm/son; đã có asset sen | `quan-ho.ts` dài, vẫn vẽ liền anh–liền chị, tre/ao sen bằng code | Họa sĩ chuẩn hóa nhân vật, trang phục, nón quai thao; artwork có nguồn gốc văn hóa rõ | **A — mẫu chuẩn** |
| 16 | **Hồng Phượng Ăn Hỏi** | Có nền WebP, đèn lồng, sen, khung ảnh dạng vòm | Nền dọc tái dùng ảnh ngang; ornament lụa chưa được preload | Hoàn thiện composition ngang/dọc, kiểm vùng chữ, đồng nhất phong cách watercolor | **A — mẫu chuẩn** |

**Nhóm A:** hoàn thiện trước để thiết lập chuẩn. **Nhóm B:** cải thiện sau khi design system ổn định. **Nhóm C:** tối ưu sau cùng, trừ khi có phản hồi thị trường đặc biệt.

### Phân dòng bộ sưu tập (đề xuất)

| Dòng | Mẫu đại diện | Ngôn ngữ thiết kế | Đối tượng |
|---|---|---|---|
| **Heritage Vietnam** | Trầu Cau, Hỷ Sự, Quan Họ, Tết Đoàn Viên, Dừa Xanh | Nghi lễ, văn hóa Việt, chi tiết truyền thống chính xác | Gia đình/tiệc cưới truyền thống |
| **Watercolor Romance** | Hoa Đào, Sen Ngọc, Mẫu Đơn, Tử Đằng, Cẩm Tú Cầu, Hồng Phượng | Mềm, tự nhiên, hoa/lá watercolor nhiều lớp | Không gian lãng mạn |
| **Modern Editorial** | Thanh Lịch, Tối Giản Đêm Xanh, Ngọc Trai | Typography, negative space, nhẹ và sạch | Cưới hiện đại |
| **Celebration Luxury** | Hoàng Kim, Thu Vàng | Sang, ánh sáng tinh tế, sắc độ có chiều sâu | Màn LED lớn/tiệc tối |

Phân dòng là đề xuất merchandising, **không** phải việc phải sửa ID/template ngay.

---

## 5. Thiết kế hệ thống mới: chuyên nghiệp, đẹp và dễ mở rộng

### 5.1 Khung nguyên tắc thiết kế

1. **Content first:** họ tên, ngày lễ, lời chào phải đọc rõ từ 3–5 m trên TV; trang trí chỉ hỗ trợ cảm xúc.
2. **Cultural accuracy:** tên lễ, biểu tượng/trang phục/họa tiết Việt nên được kiểm duyệt thủ công, nhất là Quan Họ và nghi thức miền vùng.
3. **Premium restraint:** ít hiệu ứng, chuyển động tinh tế, không nhấp nháy lạm dụng.
4. **Two-ratio by design:** mọi cảnh thiết kế riêng cho 16:9 và 9:16, không chỉ thu/phóng/cắt ngang.
5. **Reproducible rendering:** cùng project, thời điểm và phiên bản phải cho hình giống nhau giữa preview và export.
6. **Graceful fallback:** asset/font/codec thiếu phải được thông báo và có phương án thay thế nhất quán.

### 5.2 Design tokens khuyến nghị

```ts
interface TemplateDesignTokens {
  palette: { background: string; primary: string; secondary: string; accent: string; overlay: string };
  type: { hero: string; names: string; body: string; meta: string; minSize: number };
  spacing: { safeX: number; safeY: number; elementGap: number };
  layout: 'classic-split' | 'centered-ceremony' | 'editorial-fullbleed' | 'portrait-story' | 'medallion';
  motion: 'watercolor' | 'formal' | 'luxury' | 'minimal';
  assetSet: string;
}
```

**Không cần thay toàn bộ kiểu `VideoTemplate` ngay**: thêm token tùy chọn, cho code cũ fallback, migrate dần. Mọi preset đều cần override có kiểm soát theo tỷ lệ.

### 5.3 Layout / vùng an toàn

- Định nghĩa safe area theo tỷ lệ và thiết bị trình chiếu; chừa đủ mép màn hình (TV overscan nếu có).
- Tách **image zone / title zone / name zone / date zone / decor zone**; mỗi template chọn một preset bố cục.
- `message` dài phải tăng số trang/cảnh hoặc giảm cỡ có ngưỡng; không bao giờ cắt bằng `.slice()` mà không báo.
- `drawNames()` hỗ trợ 2 dòng, tên có dấu và font fallback; giới hạn kích thước tối thiểu theo khả năng đọc TV.
- Có kiểm thử trường hợp **không ảnh, 1 ảnh, 2–6 ảnh, ảnh ngang, ảnh dọc, ảnh ngược sáng**, tên dài và nội dung đặc biệt.

### 5.4 Typography & contrast

- Tạo 4 vai trò: **hero / names / body / meta**, với type scale riêng cho 16:9 và 9:16.
- Các font script nên dùng chủ yếu cho title hoặc tên; không áp script cho thông tin cần đọc nhanh.
- `Canvas` phải lưu/trả trạng thái khi vẽ chữ (`save/restore`), đặt `letterSpacing` và `font` tường minh.
- Áp dụng adaptive scrim sau vùng ảnh fullbleed; không dựa vào mỗi `onPhoto` màu trắng.
- Mỗi template cần QA chữ **Ắ, Ằ, Ỳ, Ỷ, Đ, ơ, ư**, họ tên dài và chữ in hoa có dấu.

### 5.5 Motion

| Preset | Quy tắc đề xuất |
|---|---|
| Watercolor | Sway/breathe nhỏ, cánh rơi thưa, crossfade mềm |
| Formal | Chuyển cảnh chậm, ít vật thể động, trọng tâm tên/ngày |
| Luxury | Ken Burns rất nhẹ, ánh kim tinh tế, tránh sparkles phủ chữ |
| Minimal | Opacity + dịch chuyển ngắn, không quay nhiều lớp |

Yêu cầu mọi motion tuần hoàn khớp chính xác `D`; có snapshot tại `t=0` và `t≈D` để so sánh mức độ lệch.

---

## 6. Render engine và xuất video: đề xuất kỹ thuật

### 6.1 Giữ kiến trúc lõi, tách trách nhiệm

Hiện pipeline: `template.background` → asset background → `backdrop` → `back` → scenes → `front`/falling → `foreground` → watermark. **Giữ pipeline** vì rành mạch; bổ sung:

- `prepareRenderAssets(project, template)` trả `ready/missing/error`, đảm bảo font và ảnh cần thiết đã nạp trước preview/export.
- `layoutScene(scene, project, aspect, preset)` trả hình chữ nhật và text metrics, độc lập với Canvas drawing.
- `drawScene()` chỉ thực hiện vẽ từ layout đã tính; hạn chế trộn layout với render.
- Cache có giới hạn kích thước/tuổi thọ cho sprites và scratch canvases; tránh giữ vô hạn khi đổi mẫu liên tục.
- Thống nhất `ctx.save()/restore()` ở mọi layer, overlay và text.

### 6.2 Đúng thời lượng, đúng âm thanh, đúng format

1. Test `MP4(H.264 + AAC)` ở Chrome/Edge và `WebM` fallback ở trình duyệt mục tiêu.
2. Verify metadata `duration`, `width`, `height`, `hasAudio`, khả năng play thực tế, điểm nối vòng lặp và file trên TV.
3. Nếu fallback không có audio, thông báo **trước** khi người dùng chọn xuất, không chỉ sau.
4. Có bảng chất lượng: `Full HD` mặc định, có thể cân nhắc `HD` cho thiết bị yếu; không hứa tốc độ xuất vài giây trên mọi máy.
5. File output cần tên dễ hiểu: loại lễ + tên + tỷ lệ + thời lượng, tránh ký tự không tương thích USB.

### 6.3 Quản trị năng lực trình duyệt

Tạo `ExportCapability` kiểm tra `VideoEncoder`, `AudioEncoder`, `MediaRecorder`, MIME và storage quota. UI hiển thị lựa chọn có thể dùng được; trường hợp lỗi trả lý do cụ thể và hướng xử lý.

### 6.4 Tối ưu hiệu năng

- Gallery không nên chạy RAF cho mọi thumbnail khi ngoài viewport; dùng IntersectionObserver và poster cache.
- Preload asset **theo template đang xem** thay vì toàn bộ thư viện khi app khởi động; ưu tiên ảnh nền/critical layer.
- Mọi ảnh dùng để vẽ nên có độ phân giải hợp lý theo kích thước xuất; tránh upscale artwork nhỏ gây nhòe.
- Benchmark theo 3 nhóm thiết bị: laptop phổ thông, máy yếu, điện thoại tầm trung; đo FPS preview, memory peak, thời gian load, thời gian export 20s/3min.

---

## 7. Quản lý artwork và âm thanh

### 7.1 Thực trạng asset

- Asset WebP tập trung ở `hoa-dao-xuan`, `hong-phuong`, `quan-ho-kinh-bac` và một số file `public/` cấp cao.
- `TEMPLATE_ASSETS` mới khai báo tài nguyên cho 3 template; nhiều mẫu còn dùng Canvas vẽ hoa/người/đồ vật.
- Có các file có vẻ là bản sao (ví dụ file phượng hoàng cấp `public/assets` và trong `hong-phuong`, một số ảnh sen trùng dung lượng). Cần xác minh bằng hash và chỉ xóa sau khi kiểm tra references.
- Cơ chế `getAsset()` trả `null` nếu không đăng ký/tải thất bại; cần diagnostics thay vì silent fallback khi phát triển.

### 7.2 Asset specification

| Loại | Chuẩn đề xuất | Chú ý |
|---|---|---|
| Background | WebP/JPEG 1920×1080 & 1080×1920 riêng | Chừa vùng chữ, kiểm safe zone |
| Hero ornament | WebP transparency, độ phân giải thực tế đủ cho Full HD | Không dùng mép cắt hoặc bóng giả quá mạnh |
| Frame/detail | Vector/hình học khi đơn giản; asset khi họa tiết phức tạp | Đồng bộ độ dày line |
| Petals/falling | 2–3 biến thể riêng, alpha sạch | Motion ít, không che chữ |
| Thumbnail | Poster tĩnh cho gallery | Luôn khớp design phiên bản mới |

**Quy trình:** brief → art direction → xuất asset → kiểm tỷ lệ & alpha → đăng ký manifest → render hai tỷ lệ → review trên TV & điện thoại → duyệt. Ghi **nguồn, tác giả, quyền sử dụng, phiên bản** cho từng asset; không suy đoán hình từ internet là được dùng thương mại.

### 7.3 Âm nhạc

`musicLibrary.ts` đang tổng hợp 4 bản WAV bằng Web Audio (nền hòa âm tổng hợp, không phải bản thu Quan Họ thật). Nên xác định định vị **nhạc nền đơn giản** và tránh gắn nhãn gây kỳ vọng như nhạc trình diễn dân gian thật. Giai đoạn sau: bản phối được sản xuất chuyên nghiệp, metadata license rõ, preview âm lượng và normalization/fade để tránh chênh mức âm khi xuất.

---

## 8. UX/UI web app: để cảm giác “studio chuyên nghiệp”

### 8.1 Trang chủ / gallery

- Phân danh mục theo **Style**, **Loại lễ**, **Vùng miền**, **Tỷ lệ**, bên cạnh màu.
- Card lớn vừa đủ, cover rõ, tên mẫu ngắn, nhãn đặc trưng; phân loại premium nếu có monetization.
- Mobile không có hover: thêm nút xem nhanh/ngữ cảnh preview; cho chọn dọc trực tiếp trong gallery.
- Tối ưu thumbnail: poster trước, motion chỉ khi chủ động hoặc card đang hiện.

### 8.2 Editor

- Desktop: bố cục **control panel – large preview – scene strip**, ưu tiên không gian xem.
- Mobile: chia tab từng bước, preview sticky/expand; nút Xuất luôn rõ.
- Inline validation: họ tên quá dài, ngày không hợp lệ, thiếu ảnh, ảnh chất lượng thấp, font/asset chưa tải xong.
- Undo/redo hoặc tối thiểu lịch sử vài thao tác; nút “Khôi phục mẫu gốc” cho từng nhóm tùy chỉnh.
- Hỗ trợ “căn mặt” bằng vị trí ảnh trực quan thay vì chỉ slider Y; về sau face-safe crop.

### 8.3 Export panel

- Trình bày: tỷ lệ, thời lượng **thực** sau khi tính loops, codec, có/không audio, dung lượng ước tính có ghi là ước tính.
- Phát hiện lỗi trước khi export; tải xuống chỉ khi metadata file hợp lệ.
- Màn hình kết quả: xem file, tải lại, hướng dẫn chiếu TV, tạo bản dọc/không nhạc.

### 8.4 Nội dung & nhận diện

- Chuẩn hóa copy tiếng Việt: lời chào/tiêu đề/chi tiết ngày âm lịch, dễ hiểu cho cả người không rành kỹ thuật.
- Chọn một hệ hình ảnh thương hiệu thống nhất: tông trung tính ấm, nhấn màu rượu vang/rose, chữ có độ tương phản cao; **không** đưa quá nhiều màu template lên chrome của ứng dụng.
- Thiết lập responsive spacing scale, button/field states, focus ring, loading, error, empty state và dark mode thực tế.

---

## 9. Kiểm thử, chất lượng và vận hành

### 9.1 Test matrix hợp lý

**Visual baseline ban đầu:** 16 template × 2 tỷ lệ × 3 trạng thái ảnh (0 / 1 / nhiều) × các cảnh khả dụng. Không đếm cố định 384 kết quả vì khi không ảnh sẽ không có album. Ở từng trạng thái, chụp:

- Intro giữa cảnh, message, album (nếu có), names, khung gần điểm nối `D - 0.1` và `0.1`.
- Tên dài, tên có dấu, lời cảm ơn tối đa, cỡ font tùy chỉnh, màu tự chọn, ảnh chân dung/ảnh ngang.
- Trường hợp chưa tải font/asset, lỗi 404 asset, trình duyệt không hỗ trợ codec.

**Quality gates:**

- `npm run typecheck` + `npm run build` pass.
- Screenshot review cho 16:9 và 9:16; phân loại diff do chủ đích và diff lỗi.
- Không chữ tràn/cắt im lặng; không décor che thông tin chính.
- Video smoke test metadata, codec, duration, seekability và audio policy.
- Mẫu mới phải có nguồn asset/license + minh họa 2 tỷ lệ + test tên dài.

### 9.2 Tooling đề xuất

- Playwright screenshot test cho `/dev/frames`; lưu golden snapshots theo version.
- Script kiểm tra tất cả đường dẫn được khai báo trong asset registry có file tương ứng và không bị quên register.
- Test `computeTimeline`, `dateInfo`, `text fitting`, `renderFrame` determinism, `exportVideo` browser integration.
- GitHub Actions chạy CI; PR template có checkbox ảnh ngang/dọc, preview, export, accessibility.
- Error telemetry tối thiểu (không tải dữ liệu ảnh/nhạc riêng tư của khách lên log).

### 9.3 Tiêu chuẩn phát hành “đẹp và đáng tin”

1. Tất cả cảnh quan trọng đạt visual QA trên desktop và điện thoại.
2. Người kiểm thử có thể đọc họ tên, ngày lễ và lời cảm ơn trên TV từ khoảng cách sử dụng thực tế.
3. Export 20s, 1/3/5 phút đúng thời lượng hỗ trợ; âm thanh rõ trạng thái.
4. Không biến mất asset khi xuất; không thay font bất ngờ.
5. Người dùng hoàn thành một video bằng luồng thông thường mà không phải chỉnh code hoặc mở DevTools.
6. Phát hành có changelog, ảnh trước/sau và danh sách vấn đề đã biết.

---

## 10. Roadmap thực thi theo giai đoạn

| Giai đoạn | Trọng tâm | Deliverables | Điều kiện hoàn thành |
|---|---|---|---|
| **Sprint 0: Reliability** | Sửa đầu ra trước | VID-01, AUD-01, REN-01, ART-01; cập nhật docs | Không sai thời lượng/lời nhắn; asset cần thiết tải đúng |
| **Sprint 1: Design system** | Tokens/layout/typography | Safe area, text layout, 4 motion presets, 4–5 layout presets | Test tên dài/9:16, không phát sinh regressions lớn |
| **Sprint 2: 3 flagship templates** | Hoàng Kim, Hồng Phượng, Quan Họ | Art direction, asset chuẩn, 2 tỷ lệ, poster/gallery | Duyệt trực quan trên TV/mobile; thẩm mỹ nhất quán |
| **Sprint 3: Library polish** | 13 template còn lại | Refine artwork, layout, thumbnail, color/contrast | 16 template đạt checklist QA |
| **Sprint 4: Product UX** | Trải nghiệm editor/gallery/export | Flow mobile, validation, presets, import/export project | Người thử mới tạo video hoàn chỉnh không cần hướng dẫn trực tiếp |
| **Sprint 5: Production readiness** | CI, telemetry, lưu trữ/tài khoản khi cần | Visual regression, export matrix, backup/cloud; payment design | QA gates xanh; phương án vận hành & hỗ trợ rõ |

### Backlog theo giá trị / công sức

| Task | Tác động | Công sức ước lượng tương đối | Thứ tự |
|---|---|---|---:|
| Sửa WebM `loops` + kiểm tra metadata | Rất cao | Nhỏ–vừa | 1 |
| Không cắt lời cảm ơn / text guards | Rất cao | Vừa | 2 |
| Sửa preload asset lụa & kiểm registry | Cao | Nhỏ | 3 |
| Thêm screenshot regression cơ bản | Cao | Vừa | 4 |
| Typography tokens / safe area / layout presets | Rất cao | Lớn | 5 |
| Nâng 3 flagship với artwork riêng ngang/dọc | Rất cao | Lớn | 6 |
| Gallery mobile và UX chọn ratio | Trung–cao | Vừa | 7 |
| Export/import project | Cao | Vừa | 8 |
| Nâng 13 mẫu còn lại | Cao | Lớn | 9 |
| Payment + account + DB | Chỉ cao khi thương mại hóa | Rất lớn | Sau |

> **Đề xuất quản lý scope:** Mỗi sprint chỉ đổi 1–2 trụ cột chính; dùng nhánh riêng, PR có ảnh before/after. Không refactor toàn bộ render engine cùng lúc với thay artwork 16 mẫu.

---

## 11. Kế hoạch 3 pull request đầu tiên (có thể giao ngay)

### PR #1 — `fix/export-duration-and-text-overflow`

**Mục tiêu:** Không có video sai thời lượng hoặc nội dung bị mất.

- [ ] Sửa fallback WebM dùng `loops` hoặc chặn lựa chọn không được hỗ trợ với thông báo đúng.
- [ ] Test metadata video ở trường hợp 1 vòng và nhiều vòng.
- [ ] Thay cắt `message` bằng kiểm tra/phân trang/cảnh có cảnh báo.
- [ ] Kiểm tra trạng thái âm thanh fallback và hiển thị rõ trước khi export.
- [ ] Giữ API/UX export tương thích với các trường hợp đã hoạt động.

### PR #2 — `chore/asset-registry-and-visual-checks`

**Mục tiêu:** Asset đúng, dễ kiểm soát, có baseline trước khi redesign.

- [ ] Đăng ký đúng asset ornament Hồng Phượng; rà tất cả `getAsset(...)`.
- [ ] Script validate assets manifest: file tồn tại, đúng tên, phát hiện orphan/duplicate.
- [ ] Baseline Playwright cho 16 mẫu / 2 tỷ lệ / các cảnh khả dụng.
- [ ] Pause thumbnail ngoài viewport và đánh giá eager preload.
- [ ] Cập nhật README và CLAUDE.md mô tả đúng 16 template, port 8080.

### PR #3 — `feat/design-tokens-and-safe-layout`

**Mục tiêu:** Chuyển từ template tùy hứng thành design system có kiểm thử.

- [ ] Thêm optional `designTokens`, không phá template cũ.
- [ ] Implement text measurement & scoped canvas state.
- [ ] Thêm safe zones cho intro/message/names theo tỷ lệ.
- [ ] Thí điểm 3 layout preset trên Hoàng Kim / Hồng Phượng / Quan Họ.
- [ ] Trình bày screenshot before/after và tối thiểu 1 case tên dài/ảnh dọc.

---

## 12. Các chỉ số cần theo dõi sau cải tiến

| KPI | Cách đo | Mục tiêu khởi điểm (đề xuất, cần hiệu chỉnh sau baseline) |
|---|---|---|
| Tỷ lệ export thành công | Successful exports / export attempts theo browser | ≥ 98% trên browser được hỗ trợ |
| Video sai thời lượng | Số xuất không khớp lựa chọn | 0 ở test matrix |
| Tỷ lệ thiếu font/asset khi xuất | Error/diagnostic logs | 0 trong build và smoke suite |
| Visual regression chưa duyệt | Diff không có review | 0 trước merge |
| Hoàn thành video | Người nhập thông tin → tải xong file | Tăng sau mỗi sprint, baseline trước |
| Thời gian đến preview đầu tiên | Performance mark trên thiết bị mục tiêu | Đặt SLO sau khi đo thực tế |
| Khôi phục project | Import/export restore thành công | 100% trên bộ mẫu dữ liệu thử |

Các ngưỡng trên là **mục tiêu vận hành đề xuất**, không phải số liệu đã đo của repository.

---

## 13. Kết luận và khuyến nghị chốt

TaoSlideVideo **không cần viết lại từ đầu**. Lõi Canvas, schema project, template registry, asset layer và luồng người dùng hiện nay là cơ sở tốt cho sản phẩm chuyên nghiệp. Việc cần làm là chuyển từ “có nhiều template” sang **“16 template có chất lượng thiết kế kiểm chứng được”**.

**Thứ tự nên cam kết:**

1. **Đúng:** file xuất đúng thời lượng/âm thanh, không mất nội dung.
2. **Rõ:** layout-safe và typography dễ đọc, phù hợp TV/LED và điện thoại.
3. **Đẹp:** nâng artwork và art direction của 3 flagship; sau đó lan sang cả thư viện.
4. **Mượt:** preload hợp lý, thumbnail/gallery ít tốn tài nguyên, render ổn định.
5. **Bền:** test tự động, PR review, tài liệu, backup; thương mại hóa khi chất lượng đã ổn định.

**Nguyên tắc sản phẩm:** Người sử dụng không nên cảm nhận đây là một trình ghép ảnh với hiệu ứng trang trí, mà là **công cụ tạo video nghi lễ được thiết kế như một studio chuyên nghiệp** — phù hợp văn hóa Việt, cá nhân hóa nhanh và tin cậy trong ngày cưới.

---

## Phụ lục A — Liên kết nguồn mã đã rà soát

- [Template Registry](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/templates/index.ts)
- [Render Engine](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/engine.ts)
- [Scene Layout](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/scenes.ts)
- [Canvas Helpers](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/helpers.ts)
- [Asset Manifest](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/config/template-assets.ts)
- [Asset Loader](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/render/assets.ts)
- [Export Video](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/export/video.ts)
- [Gallery](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/components/Gallery.tsx)
- [Preview](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/components/PreviewPlayer.tsx)
- [Font Library](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/fonts.ts)
- [Music Library](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/lib/musicLibrary.ts)
- [Dev Frame Sheet](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/src/app/dev/frames/FrameSheet.tsx)
- [README](https://github.com/haolnworkit-bn/sildevideodamcuoi/blob/146685be85d6132e3ed1f552d2683a5c8dd81f83/README.md)

*Báo cáo chỉ đánh giá; không sửa file, tạo commit hoặc PR trong repository.*
