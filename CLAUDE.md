# TaoSlideVideo — bộ nhớ dự án (đọc file này trước, KHÔNG cần dò lại cả project)

Web app tạo **video nền cho lễ dạm ngõ / ăn hỏi / đính hôn / vu quy / thành hôn**: nhập tên, ngày (tự đổi âm lịch), lời cảm ơn, ảnh, nhạc → xem trước → trình chiếu toàn màn hình hoặc xuất MP4 / PNG. Lấy cảm hứng từ cinelove.me (video-dam-ngo) nhưng **mẫu tự thiết kế, không sao chép hình/tên mẫu của họ**.
Người dùng nói tiếng Việt → trả lời tiếng Việt. Ưu tiên hiện tại: **mẫu + dùng thực tế**. Kiếm tiền: đã có khung, đang **tắt**, làm sau.

## Công nghệ
- Next.js 15 (App Router) + React 19 + TypeScript strict. Không Tailwind: CSS thuần trong `src/app/globals.css` (biến `--accent`, có dark mode).
- Vẽ bằng **Canvas 2D**, không dùng thư viện animation. Xuất video bằng **WebCodecs** (`VideoEncoder` H.264 `avc1.640028`, `AudioEncoder` AAC `mp4a.40.2` 48 kHz) + **mp4-muxer@5**. Fallback: `MediaRecorder` WebM (thời gian thực).
- Font: `next/font/google`, 4 font mặc định preload; các font khác `preload:false`, tải bằng `ensureFontsLoaded(keys)` vì canvas không tự tải web font.
- Lưu trữ phía trình duyệt: bản nháp JSON trong `localStorage` (`tsv:draft`); ảnh & nhạc là Blob trong **IndexedDB** (`tsv-media`/`blobs`, key ảnh = uuid, nhạc = `music:<projectId>`).
- Chưa có backend/DB. `/api/checkout` là stub (provider `mock`). Windows + PowerShell, Node 24.

## Cấu trúc & vai trò file
```
src/config/features.ts        cờ env: NEXT_PUBLIC_MONETIZATION(on/off), giá, watermark, brand
src/lib/project.ts            ProjectData (schema) + createDefaultProject/normalizeProject (migrate bản nháp cũ)
                              + dẫn xuất: eventTitle, namePair (tên gọi/đầy đủ), fullNamePair, initials, dateInfo, detailLine
src/lib/events.ts             5 loại lễ (title, lời cảm ơn mẫu)
src/lib/lunar.ts              dương→âm lịch VN (thuật toán Hồ Ngọc Đức, TZ+7), canChiYear
src/lib/fonts.ts              FONT_LIB {base, byKey}, TITLE_FONTS(11), BODY_FONTS(9), ensureFontsLoaded
src/lib/media.ts              IndexedDB put/get/deleteBlob, prepareUpload (resize ≤1920, JPEG), musicKey
src/lib/draft.ts              load/saveDraft, takeLegacyPhoto (ảnh cũ trong localStorage → IDB)
src/lib/render/types.ts       STAGE (16:9=1920×1080, 9:16=1080×1920), Photo, Theme, Timeline, RenderContext, VideoTemplate, IntroSpec
src/lib/render/engine.ts      renderFrame(ctx,t,input,timeline?) — DUY NHẤT 1 hàm vẽ cho preview/thumb/trình chiếu/xuất
src/lib/render/timeline.ts    computeTimeline(data, photoCount): intro 6.6s, message 6.7s (tắt được), album n×2.6s (≥2 ảnh), names 6.7s
src/lib/render/scenes.ts      BỐ CỤC dùng chung, tự xếp ngang/dọc: introScene, messageScene, albumScene, namesScene, drawDateBlock
src/lib/render/theme.ts       resolveTheme/resolveFonts: áp tuỳ chỉnh màu/font của người dùng lên mẫu
src/lib/render/helpers.ts     runScenes (cross-fade + chuyển cảnh fade/zoom/slide), makeLoopParticles/particleAt/particlesFor,
                              fitFont, wrapText, goldPaint, deepGoldPaint, sprite/drawSprite (cache), scratchCanvas, drawPhoto, archPath, watermark
src/lib/render/templates/     11 mẫu + index.ts (TEMPLATES, getTemplate, COLOR_TAGS)
src/lib/export/video.ts       exportVideo (loops, audio), decodeAudio, exportPoster (PNG)
src/lib/billing/entitlements.ts computeEntitlement(template, unlocked) → watermark/cleanExport/price; startCheckout
src/components/Editor.tsx     state chính: data, ảnh (IDB), nhạc, tab, xuất/paywall/hướng dẫn TV, presenter
src/components/EditorPanels.tsx các thẻ: Templates(lọc màu rạp), Content(+bật/tắt cảnh), Photos, Style(font+màu), Fx, Music
src/components/PreviewPlayer.tsx canvas preview (≤1280px) + thanh tua + dải phân cảnh (SceneThumb, sceneSnapTime)
src/components/Presenter.tsx  trình chiếu fullscreen, Wake Lock, ẩn chuột, phát nhạc lặp, Esc thoát
src/components/TemplateThumb.tsx, Gallery.tsx (trang chủ, lọc loại lễ + màu)
src/app/dev/frames, dev/export  trang kiểm thử (404 trên production)
```

## Cách mẫu (template) hoạt động — quan trọng khi thêm/sửa mẫu
- Mẫu **chỉ khai báo phong cách**, không tự bố cục: `theme` (heading/names/body/accent/line), `bodyFont`/`capsFont` ('serif'|'display'),
  `background(rc)`, `foreground(rc)` (hạt), `ornament(rc,cx,cy)`, `photoFrame(ctx,photo,x,y,w,h,rc)`, `colors: ColorTag[]`,
  `intro: { title:'script'|'caps', namesLine:'italic'|'script', photoMode:'frame'|'emblem'|'fullbleed'|'faded', emblem?, titleBacking? }`.
- Luôn dùng `rc.W/rc.H/rc.D` (không hard-code 1920/1080/20) để chạy cả 9:16 và mọi độ dài. Chu kỳ chuyển động phải là ước của `rc.D` (dùng `u=t/D`, tần số nguyên) → lặp liền mạch.
- Hạt: `makeLoopParticles(n)` sinh 1.5n; vẽ qua `particlesFor(rc, arr)` để theo tuỳ chọn mật độ (0/0.5/1/1.5).
- Hoạ tiết nặng (hoa nhiều lớp) → `sprite(key,w,h,draw)` vẽ 1 lần. Ảnh trong khung → `drawPhoto` (Ken Burns lặp khớp).
- Bố cục dọc: chừa ~350px đáy cho hoạ tiết góc của mẫu.
- 11 mẫu: hoa-dao-xuan(frame, vòm), trau-cau(frame + dải lụa titleBacking), hy-su-do-vang(emblem huy chương 囍), sen-ngoc(faded, emblem hoa sen khi không ảnh),
  mau-don(frame tròn), tu-dang(frame vòm), cam-tu-cau(frame bo góc), thu-vang(frame polaroid), ngoc-trai(caps, emblem vòng ngọc trai/monogram),
  thanh-lich(caps, fullbleed), hoang-kim(caps, emblem monogram/khung vàng).

## Đã hoàn thành
- MVP: 5 loại lễ, âm lịch, nhập liệu, preview, xuất MP4 Full HD lặp liền mạch, PNG, bản nháp tự lưu.
- 11 mẫu, lọc theo màu rạp. Mỗi mẫu có bản 16:9 & 9:16, có/không ảnh.
- Tuỳ chỉnh: font tiêu đề/nội dung, 3 màu, tên gọi/đầy đủ, thứ tự tên, lời chào, bật/tắt cảnh lời cảm ơn & khoảnh khắc.
- Tối đa 6 ảnh (MAX_PHOTOS), cảnh "Khoảnh khắc", căn dọc từng ảnh, ảnh trái/phải.
- Hiệu ứng: mật độ hạt, kiểu chuyển cảnh. Nhạc nền: upload, âm lượng, phát khi trình chiếu, ghép AAC vào MP4.
- Xuất 1 vòng / 1 / 3 / 5 phút: encode 1 vòng rồi ghép lặp chunk (`addVideoChunkRaw`) → nhanh. Bitrate 8 Mbps ≈ 0.9 MB/s.
- Trình chiếu fullscreen; nút chia sẻ (Web Share) trên điện thoại; hướng dẫn chép USB lên TV.
- Khung kiếm tiền (tắt): watermark preview, paywall theo video, giá thường/premium, checkout mock.

## Đã kiểm chứng
- `npm run test:lunar` 6/6 đúng. `npx tsc --noEmit` và `npm run build` sạch.
- Xuất MP4 trong Chrome headless: 20s ≈ 9–12 MB; 5 phút ≈ 280–310 MB / ~8–15s; 9:16 ra 1080×1920; có nhạc → audio decode > 0.
- Chưa thử trên TV thật / điện thoại thật (fullscreen, Wake Lock, Zalo share).

## Lỗi/bẫy đã gặp
- `radialGlow` phải mờ về cùng màu alpha 0 (về `rgba(0,0,0,0)` sẽ ra quầng xám).
- Grid trên mobile phải dùng `minmax(0,1fr)`, không thì tràn ngang.
- Sau `npm run build`, dev server có thể trả 404 cho `/dev/*` → xoá `.next` rồi chạy lại `npm run dev`.
- Chrome headless có độ rộng cửa sổ tối thiểu → test mobile phải dùng `Emulation.setDeviceMetricsOverride` (scripts/screenshot.mjs).
- `next/font` yêu cầu option là literal (không truyền biến); subset `vietnamese` phải có trong typings (tsc báo nếu sai).
- Chỉ `process.env.NEXT_PUBLIC_*` tham chiếu trực tiếp mới được nhúng vào client.

## Cách kiểm thử nhanh (không cần đọc code)
```
npx next dev -p 3123            # chạy nền
# Ảnh tĩnh mọi cảnh của mẫu (id đầy đủ, vd hoa-dao-xuan):
#   /dev/frames?t=<id,id>&aspect=9:16&photos=3&long=1&tf=<fontKey>&hc=<hex không #>
node scripts/screenshot.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" <profileDir> "<url>" out.png 1600 3000
# Kiểm tra xuất video (in RESULT ... duration, size, audioDecodedBytes):
#   /dev/export?template=<id>&aspect=9:16&photos=3&audio=1&loops=15
node scripts/probe-export.mjs "<chrome.exe>" <profileDir> "http://localhost:3123/dev/export?template=ngoc-trai&audio=1"
```
Dùng thư mục profile Chrome trong scratchpad; xem ảnh chụp bằng tool Read.

## Việc tiếp theo (chưa làm)
- Thanh toán thật (PayOS/VNPay/MoMo) + webhook; tài khoản + DB (Neon/Postgres) + object storage cho ảnh/nhạc.
- Render bản sạch phía server (headless Chrome chạy `renderFrame`) để chống lách watermark.
- Link chiếu online `/v/<id>` cho Smart TV; thư viện nhạc có bản quyền; thêm mẫu theo mùa/vùng miền.
- Nhỏ: option "Tên gọi (Quân & Hà)" trong select bị cắt chữ ở panel hẹp.
