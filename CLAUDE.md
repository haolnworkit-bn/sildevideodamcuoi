# TaoSlideVideo — bộ nhớ dự án (đọc file này trước, KHÔNG cần dò lại cả project)

Web app tạo **video nền cho lễ dạm ngõ / ăn hỏi / đính hôn / vu quy / thành hôn**: nhập tên, ngày (tự đổi âm lịch), lời cảm ơn, ảnh, nhạc → xem trước → trình chiếu toàn màn hình hoặc xuất MP4 / PNG. Lấy cảm hứng từ cinelove.me (video-dam-ngo) nhưng **mẫu tự thiết kế, không sao chép hình/tên mẫu của họ**.
Người dùng nói tiếng Việt → trả lời tiếng Việt. Ưu tiên hiện tại: **mẫu + dùng thực tế**. Kiếm tiền: đã có khung, đang **tắt**, làm sau.

## PHÂN VAI (bắt buộc — chi tiết: `docs/AI_DESIGN_DEVELOPMENT_RULES.md`)
- **ChatGPT (Image)** = thiết kế mỹ thuật & tạo asset (nền, hoa, hoạ tiết, khung, texture, hạt hình). **Claude** = code, tích hợp asset, chuyển động, test, xuất video. **Chủ dự án** = phê duyệt.
- Claude KHÔNG tự vẽ hình minh hoạ bằng canvas, KHÔNG tự tạo/chỉnh/tách nền asset mỹ thuật, KHÔNG đổi phong cách đã duyệt. Thiếu asset → viết **phiếu yêu cầu kỹ thuật** (file, kích thước, alpha, ngang/dọc, layer, điểm neo, vùng an toàn) để chủ dự án chuyển cho ChatGPT. Phiếu lưu ở `docs/asset-requests/` (quy cách chung `00-QUY-CACH-CHUNG.md` + HP/QH/HD cho Đợt 1, soạn 2026-11-20, đang chờ ChatGPT). Quy trình cho chủ dự án + prompt khởi động: `docs/asset-requests/HUONG-DAN-CHATGPT.md`. Hồ sơ thiết kế mỗi mẫu: `docs/templates/<id>.md` (mẫu ở `docs/templates/README.md`). Asset dùng chung: `public/assets/shared/` có manifest riêng (templateId "shared"), checker theo dõi cả shared.
- Asset nhận vào: đặt ở `public/assets/<id>/`, cập nhật `manifest.json` (source/licenseStatus/reviewStatus — không tự ghi "approved"/"commercial-use" khi chưa có bằng chứng), khai báo `template-assets.ts`, chụp 16:9 + 9:16, thử xuất video.
- Git: branch riêng + PR, không tự merge. Nâng cấp mẫu theo đợt: Đợt 1 = hong-phuong, quan-ho-kinh-bac, hoa-dao-xuan; chưa có mẫu đạt chuẩn thì không làm hàng loạt.

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
src/lib/render/templates/     16 mẫu + index.ts (TEMPLATES, getTemplate, COLOR_TAGS)
src/config/template-assets.ts ẢNH trang trí theo mẫu (background ngang/dọc, back/front, falling, preload) — xem QUY TẮC ẢNH
src/lib/render/layers.ts, assets.ts  vẽ/nạp ảnh trang trí; getAsset tự đăng ký + cảnh báo dev nếu url chưa khai báo
scripts/check-assets.mjs      npm run check:assets: file ảnh tồn tại, getAsset đã khai báo, liệt kê ảnh thừa (không tự xoá)
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
- **QUY TẮC ẢNH (người dùng yêu cầu): hình minh hoạ (hoa, lá, người, đồ vật, nền giấy, khung hoạ tiết) PHẢI dùng ảnh PNG/WebP, KHÔNG vẽ bằng code** (trông thô). Code chỉ để chữ, chuyển động, hạt đơn giản, đường/khung hình học, gradient, quầng sáng. Mẫu mới: KHÔNG viết hàm vẽ hoa/người bằng canvas.
  Ảnh khai báo ở **`src/config/template-assets.ts`** (background ngang/dọc, lớp back/front có motion, ảnh rơi `falling`), file ảnh ở `public/assets/<id-mẫu>/`.
  Engine vẽ qua `src/lib/render/layers.ts` (thứ tự: nền code → ảnh nền → back → cảnh chữ → front → falling → hạt của mẫu), nạp ảnh qua `src/lib/render/assets.ts`
  (đăng ký khi import `templates/index.ts`; `ensureFontsLoaded()` đợi ảnh tải xong; thiếu file → bỏ qua lớp). Hướng dẫn cho người dùng: `public/assets/README.md`.
  Nền ảnh cần RIÊNG bản ngang & dọc (thiếu hướng nào dùng nền code của mẫu). Ảnh nguồn: tự tạo bằng AI/ảnh có giấy phép; KHÔNG dùng asset của cinelove.
- Mẫu đang dùng ảnh: hoa-dao-xuan (nền ngang), quan-ho-kinh-bac (sen), **hong-phuong** [ĐÃ LÀM LẠI theo phương án A 2026-11-20 — xem docs/templates/hong-phuong.md; mô tả cũ dưới đây đã lỗi thời] (mẫu ăn hỏi: nền hồng đào + lồng đèn góc trên trái + sen đôi góc dưới phải + chữ 囍 lớn, mờ, chìm ở GIỮA khung phía sau chữ [vẽ bằng font trong `hong-phuong.ts` qua hook mới `backdrop(rc)` của VideoTemplate — gọi SAU ảnh nền, TRƯỚC lớp back và các cảnh chữ, nên ảnh trang trí đè lên viền/chữ chìm chứ không bị đè; cùng hook này vẽ viền khung 2 nét mảnh hồng cách mép 3.5% cạnh ngắn; ở khổ ngang viền được làm mờ (destination-out trên canvas phụ) tại 2 cụm hoa đào đã nằm sẵn trong `nen.webp` để hoa nhìn như nằm TRÊN viền — toạ độ `hide(...)` gắn cứng theo ảnh nền, đổi ảnh nền thì phải chỉnh lại; cách đúng là tách cụm hoa thành PNG riêng nền trong suốt; không phải hình]; ảnh trong `public/assets/hong-phuong/`; khung dọc dùng chính nền ngang cắt giữa — nên bổ sung nền dọc riêng). `hong-phuong/long-den.webp` là bản đã TÁCH NỀN XÁM từ `quan-ho-kinh-bac/long_den.webp` của người dùng (bằng sharp: xoá màu 209,209,209 + khử viền). File thừa chưa dùng: `hong-phuong/phuong-hoang.webp`, `dai-lua-hong.webp` (vẫn dùng làm ornament "Lời cảm ơn"), `sen-hong.webp`, `sen-nu.webp`; `hoa_sen_hong_1.webp` trùng `hoa_sen_hong`. Các phần còn vẽ bằng code (liền anh/chị, tre, ao sen của quan-ho; toàn bộ mẫu khác) sẽ thay dần khi có ảnh.
- (quan-ho-kinh-bac: code vẽ liền anh/chị, tre, ao sen ĐÃ XOÁ 2026-11-23 — mô tả cũ ở trên đã lỗi thời.)
- 11 mẫu gốc: hoa-dao-xuan(frame, vòm), trau-cau(frame + dải lụa titleBacking), hy-su-do-vang(emblem huy chương 囍), sen-ngoc(faded, emblem hoa sen khi không ảnh),
  mau-don(frame tròn), tu-dang(frame vòm), cam-tu-cau(frame bo góc), thu-vang(frame polaroid), ngoc-trai(caps, emblem vòng ngọc trai/monogram),
  thanh-lich(caps, fullbleed), hoang-kim(caps, emblem monogram/khung vàng).

## Đã hoàn thành
- MVP: 5 loại lễ, âm lịch, nhập liệu, preview, xuất MP4 Full HD lặp liền mạch, PNG, bản nháp tự lưu.
- 16 mẫu (11 gốc + tet-doan-vien, dua-xanh, toi-gian, quan-ho-kinh-bac, hong-phuong), lọc theo màu rạp. Mỗi mẫu có bản 16:9 & 9:16, có/không ảnh.
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
- Grid trên mobile phải dùng `minmax(0,1fr)`, không thì tràn ngang. **Cả trên desktop**: `.field-group`/`.stack`/`.row` đã đổi sang `minmax(0,1fr)` (nút `white-space:nowrap` từng làm cột rộng hơn panel → thẻ Nhạc nền bị cắt chữ). Nút trong panel có chữ dài dùng `.lib-track` (tên trên, mô tả dưới, tự xuống dòng), đừng dùng `.btn` (nowrap).
- **KHÔNG chạy 2 dev server cùng lúc** (chúng dùng chung `.next` → hỏng cache, gây 404/500 cho cả server của người dùng). Trước khi bật server, kiểm tra cổng 8080: nếu người dùng đang chạy `npm run dev` thì DÙNG LUÔN server đó (http://localhost:8080), không xoá `.next`, không `npm run build` khi nó đang chạy.
- Dev server hay hỏng cache (404 `/dev/*`, 500 "__webpack_modules__ is not a function", treo "Compiling /editor"): tắt đúng tiến trình đang nghe cổng (PowerShell `Get-NetTCPConnection -LocalPort`), xoá `.next`, chạy lại. Chụp editor theo thẻ: script tạm `tabshot.mjs` (CDP, bấm nút theo chữ) ở scratchpad.
- Sau `npm run build`, dev server có thể trả 404 cho `/dev/*` → xoá `.next` rồi chạy lại `npm run dev`.
- Chrome headless có độ rộng cửa sổ tối thiểu → test mobile phải dùng `Emulation.setDeviceMetricsOverride` (scripts/screenshot.mjs).
- `next/font` yêu cầu option là literal (không truyền biến); subset `vietnamese` phải có trong typings (tsc báo nếu sai).
- Chỉ `process.env.NEXT_PUBLIC_*` tham chiếu trực tiếp mới được nhúng vào client.

## Cách kiểm thử nhanh (không cần đọc code)
```
npx next dev -p 3124            # chạy nền (npm run dev dùng cổng 8080)
npm run typecheck && npm run test:lunar && npm run check:assets
# Ảnh tĩnh mọi cảnh của mẫu (id đầy đủ, vd hoa-dao-xuan):
#   /dev/frames?t=<id,id>&aspect=9:16&photos=3&long=1&tf=<fontKey>&hc=<hex không #>
node scripts/screenshot.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" <profileDir> "<url>" out.png 1600 3000
# Kiểm tra xuất video (in RESULT ... duration, size, audioDecodedBytes):
#   /dev/export?template=<id>&aspect=9:16&photos=3&audio=1&loops=15   (&webm=1: ép nhánh WebM thời gian thực)
#   /dev/frames?...&msg=<urlencoded, %0A xuống dòng>                   (thử lời cảm ơn dài/tràn)
# WebM có nhạc trong headless cần cờ --autoplay-policy=no-user-gesture-required (không có thì AudioContext bị chặn → xuất không nhạc, audioDropped=true)
node scripts/probe-export.mjs "<chrome.exe>" <profileDir> "http://localhost:3123/dev/export?template=ngoc-trai&audio=1"
# Kiểm tra bố cục chữ TỰ ĐỘNG (mọi mẫu × 2 tỉ lệ × 0/1/3 ảnh × trái/phải × bộ tên default/long/xlong), in RESULT {byKind, issues}:
#   /dev/layout   (&t=id,id &aspect=16:9 &names=xlong &fonts=all [11 font tiêu đề] &bfonts=all) — đọc bằng probe-export.mjs
#   fonts=all chạy lâu: tách theo aspect (probe-export chờ tối đa 240s). Mẫu mới/sửa bố cục PHẢI chạy, mục tiêu 0 lỗi.
```
Dùng thư mục profile Chrome trong scratchpad; xem ảnh chụp bằng tool Read.

## Trạng thái phiên gần nhất (cập nhật mỗi khi chuyển chat)
- 2026-11-25 (chuyển cảnh "Vén màn", nhánh `feat/curtain-transition` từ `feat/motion-v2`, PR vào main): `fx.transition = "curtain"`;
  `drawCurtain` trong helpers.ts vẽ cảnh vào canvas phụ (rc.ctx tạm đổi) + mặt nạ gradient: cảnh cũ tách đôi ở giữa, 2 nửa trượt ra & mờ,
  cảnh mới lộ trong khe (mép mềm, thu 1.025→1), vệt sáng màu accent ở mép khe. Giao nhau ≥1.6s. Bỏ qua khi probe/1 cảnh.
  /dev/frames & /dev/export nhận `&tr=`. MP4 sen-ngoc 2 vòng có nhạc 55.6s (7.7× thực); hong-phuong 9:16 40.0s.
  Cùng PR — CHUYỂN ĐỘNG TRONG SLIDE (chủ dự án yêu cầu: "cây sen đung đưa, chữ chạy vào"):
  `Motion.period` (giây; engine làm tròn ra số nhịp nguyên/vòng) thay `cycles` — trước đây cycles 2/vòng ~10–15s một nhịp nên gần như đứng yên;
  `gustAt()` trong layers.ts: "cơn gió" sin tắt dần ~4s sau mỗi mốc đổi cảnh (lớp có sway/breathe, hệ số `motion.gust`, mặc định 1.6; 1 cảnh = tắt).
  Biên độ Sen Ngọc / Hồng Phượng đã tăng (đèn lồng 0.05 rad nhịp 4s). Chữ: `drawReveal` nhận `dx` (lướt ngang, easeOutQuart);
  tiêu đề intro từ trái, dòng tên từ phải, khung ảnh từ phía của nó, lời cảm ơn xen kẽ trái/phải; cảnh Tên: `drawNames(spread)` hai tên chạy từ hai bên vào.
  SỬA GIẬT (chủ dự án báo "chữ giật"): đo bằng `/dev/perf?template=&tr=&photos=` (ms/khung cả vòng, preview 1280px). Thủ phạm = `ctx.filter`
  (blur của "Mờ ảo": tới ~500ms/khung; brightness của vệt sáng) → ĐÃ BỎ, CẤM dùng ctx.filter trong renderFrame. Wipe 6→3 dải. Sau sửa: fade avg 11ms (= trước motion v2),
  soft ~13ms, curtain ~13ms (headless không GPU). Chữ canvas định vị tới 1/4px (không nhảy nấc) → giật là do hiệu năng.
  LƯU Ý GIT: PR #14–16 merge chồng vào nhánh trung gian, KHÔNG vào main → PR này mang cả #14–16 vào main. PR chồng: đổi base về main trước khi merge.
- 2026-11-25 (chuyển động v2 + Sen Ngọc mới — chủ dự án đánh giá chuyển động RẤT CAO): nhánh `design/sen-ngoc-v2` (trên feat/tv-presenter) và `feat/motion-v2` (trên sen-ngoc-v2), PR.
  Sen Ngọc: bộ ảnh ChatGPT `_inbox/tong-hoa-xanh` → nền ngang + 4 cụm `decorations/` (back, sway/breathe); khổ dọc nền code giấy + khung 2 nét (chờ phiếu SN-02). Đã bỏ hoa sen code.
  Chuyển động: `src/lib/render/motion.ts`. Mọi chữ qua `drawText` → `revealText` đọc `rc.reveal` {mode, r} do `drawReveal` (scenes `reveal(...)`, `drawBlock` theo `BlockItem.mode`) đặt:
  wipe (script: quét viết tay mép mềm 6 dải + vệt sáng `rc.shine` lướt ở giây 2.5–3.7 của cảnh; 1 cảnh: 2 lần/vòng theo t toàn cục), chars (in hoa từng ký tự), words (từng từ),
  grow (đường kẻ/ornament mọc từ giữa), photo (khung ảnh 0.94→1 easeOutBack). `rc.probe` → tắt hiệu ứng (bố cục đo như cũ).
  runScenes: chuyển cảnh mới `soft` "Mờ ảo" (blur ≤10px + scale, giao nhau 1.3s) = MẶC ĐỊNH dự án mới (bản nháp cũ giữ lựa chọn); camera tiến 1.8% suốt cảnh (tắt khi 1 cảnh/probe).
  /dev/frames thêm `&at=t1,t2,…`. Kiểm: /dev/layout 1.296 render 0 lỗi; MP4 hoang-kim 3 vòng 83.4s ~8× realtime; 9:16 1 cảnh 16.0s.
  Ý tưởng tiếp: chuyển cảnh "vén màn" (cần vẽ cảnh ra canvas phụ), parallax lớp ảnh theo cảnh, chữ tên hiện từng nét (cần font path).
- 2026-11-25 (luồng chiếu TV 16:9 — chủ dự án ưu tiên hơn editor điện thoại, nhánh `feat/tv-presenter` xếp chồng trên `chore/stage1-leftovers`, PR):
  Presenter: `screen.isExtended` → bảng chọn "Chiếu lên TV / màn hình này" (Window Management API `getScreenDetails` + `requestFullscreen({screen})`;
  hộp quyền làm mất lượt bấm → báo bấm lại); chờ `ensureFontsLoaded` (tối đa 6s) mới chiếu; vẽ 30 hình/giây, t = frame/30 khớp MP4; phím M tắt tiếng.
  Hộp thoại xuất: khổ 9:16 → cảnh báo viền đen trên TV + nút chuyển 16:9. Đã chụp headless cả 2 nhánh (giả lập isExtended).
  CHƯA thử với TV/màn hình thứ 2 thật (quyền window-management, chọn đúng màn).
- 2026-11-23 (việc nhỏ giai đoạn 1, nhánh `chore/stage1-leftovers`, PR): `quan-ho.ts` bỏ toàn bộ code vẽ Đông Hồ (586 → ~115 dòng; nền dự phòng = gradient giấy kem),
  sửa mô tả/swatch/màu rạp thành hồng–xanh lá–kem. `TEXT_LIMITS` trong project.ts (max = mức đã qua /dev/layout "xlong") + `LenHint` trong EditorPanels.
  `TemplateThumb` nhận `aspect`; lưới mẫu editor 3 cột khi 9:16; trang chủ có nút Ngang/Dọc, link editor mang `&aspect=`; editor đọc `?aspect=`.
  /dev/export nhận `&scenes=1|2|3`; đo MP4 1 cảnh: 3 vòng = 24.00s (16:9), 2 vòng 9:16 = 16.00s, có nhạc. /dev/layout 3 mẫu Đợt 1: 0 lỗi.
  Chưa chạy `npm run build` (dev server người dùng đang chạy cổng 8080). Chụp có thao tác: script `shotjs.mjs` (scratchpad) đọc JS từ FILE —
  PowerShell 5.1 nuốt dấu `"` khi truyền tham số cho node.
- 2026-11-23 (Hoa Đào Xuân màu nước, nhánh `design/hoa-dao-xuan`, PR): nền ngang = ảnh ChatGPT "Nền Mùa Xuân Làng Quê Việt Nam-5" (chủ dự án chọn,
  có alpha một phần → flatten màu giấy 244,224,197), nền dọc = bản 2, rơi = canh-dao-01/02 + bong-dao-01 (bỏ hạt code). backdrop quầng tông giấy (chỉ ngang).
  Ảnh dự phòng (bản 1,3,4,6, v1) ở `_inbox/hoa-dao-xuan/`. Còn vẽ code: ornament 3 bông + hoa góc khung vòm. Định hướng dài hạn: `docs/DINH-HUONG-PHAT-TRIEN.md`.
  BẪY: KHÔNG `git checkout -- <asset>` khi asset mới chưa commit (đã mất 1 lần, phục hồi từ cache Chrome headless `prof/Default/Cache`).
- 2026-11-20 (Số cảnh 1/2/3, nhánh `feat/scene-count`, PR): `scenes.intro` mới; `textSceneCount`/`scenesForCount` trong timeline.ts;
  1 cảnh = chỉ Tên & ngày, dài `SINGLE_SCENE`=8s, runScenes giữ chữ đứng yên (v=1, lt=SETTLED) để lặp không nháy. UI: nút "1/2/3 cảnh" ở thẻ Nội dung.
  /dev/frames thêm `&scenes=1|2|3`. Chưa thử xuất MP4 chế độ 1 cảnh. ChatGPT đang làm Hoa Đào (nền vẽ liền, bản sắc Tết, khác Hồng Phượng).
- 2026-11-20 (Quan Họ màu nước, nhánh `design/quan-ho-watercolor`, PR): BỎ hướng Đông Hồ (ảnh AI trông giả, sai văn hoá) → màu nước thực vật học.
  Nền ngang = ảnh toàn cảnh vẽ liền của ChatGPT (`backgrounds/landscape.webp`, 1672×941 upscale). Theme hồng sen/mực ô-liu/xanh lá sen; hook `backdrop`
  phủ quầng giấy kem sau khối chữ (chỉ khổ ngang); khung ảnh passe-partout; ornament nón quai thao code → đường kẻ + hạt thoi. Khổ dọc vẫn nền Đông Hồ code (tạm).
  `sen-bong` đã xoá. Quy cách §6 mới (tự chấm A–D trước khi gửi ảnh; D = nền vẽ liền được phép, chỉ tách vật cần chuyển động).
  Chờ ChatGPT: nền dọc vẽ liền + 3 cánh sen rơi.
- 2026-11-20 (Quan Họ khổ dọc, nhánh `design/quan-ho-portrait`, PR): thêm `backgrounds/portrait.webp` (vẽ liền) + `particles/canh-sen-01..03.webp`
  (falling); backdrop quầng kem cả 2 khổ; hạt code chỉ còn lá tre mảnh. /dev/layout 0 lỗi; MP4 9:16 2 vòng có nhạc 55.6s.
  Còn: code vẽ Đông Hồ cũ (người/tre/ao sen/diepPaper) bị ảnh nền che hết nhưng chưa xoá; nền ngang là bản upscale ×1.15. Tiếp theo: Hoa Đào (phiếu HD).
- 2026-11-20 (Hồng Phượng B3, nhánh `design/hong-phuong-b3`, PR): quy trình ChatGPT chạy thật lần đầu. Hồ sơ đã duyệt: `docs/templates/hong-phuong.md`
  (có bảng đặt asset). Nền ngang mới là giấy sạch (đã BỎ mẹo `hide(...)` che viền); 4 cụm góc, đèn lồng (chỉ dọc), lụa đáy (front), 2 cánh rơi
  khai báo trong `template-assets.ts`; thêm `background.portraitZoom`. ChatGPT nộp PNG → Claude đổi WebP (sharp, q90). Ảnh thô để ở `_inbox/<id>/` (gitignore).
  Asset B3 là bản cắt từ ảnh ghép + upscale ~3× → cần ChatGPT làm lại từng vật độ phân giải gốc (giữ tên file). Bài học: cấm ảnh ghép, 1 ảnh = 1 vật.
  Kiểm: /dev/layout 0 lỗi; MP4 9:16 3 vòng có nhạc 83.4s; 16:9 2 vòng 40.0s. Tiếp theo: Quan Họ (phiếu QH, Đông Hồ) rồi Hoa Đào.
- 2026-11-20 (Sprint 1 — vùng an toàn + bố cục chữ, nhánh `sprint-1-safe-area`, CHƯA commit):
  `src/lib/render/layout.ts`: SAFE (mép 5%), MIN_PX theo vai trò chữ, `drawText` (fillText + ghi khung bao khi bật `rc.probe`), `probeRect`,
  `fitInk` (đo khung glyph thật, kể cả nét uốn script & letterSpacing khi căn giữa), `fitLines` (thu tới ngưỡng → 2 dòng), `fitParagraph` (≤3 dòng, ngắt ở "·"), `stackLines`.
  scenes.ts: mọi chữ qua `drawText`; introBlock tính chiều cao từ chữ đã đo (hết lời chào đè tiêu đề ở 10 mẫu); tên/lời chào/địa chỉ dài xuống dòng thay vì thu còn 10–18px;
  cảnh tên xếp "tên / & / tên" theo glyph; mẫu emblem tự đẩy/thu biểu tượng khi khối chữ tràn đáy; tiêu đề in hoa giảm giãn cách trước khi thu nhỏ.
  Kết quả /dev/layout: trước 390 lỗi → 0 (1.296 render); fonts=all 9.504 render còn 1 ca ngoài lề (toi-gian + Prata + tên 7 từ: 46px < 48px).
  Đã kiểm: typecheck, test:lunar, check:assets, test:assets 7/7 (sửa lỗi đường dẫn Windows trong test), build, xuất MP4 hong-phuong 9:16 3 vòng có nhạc = 83.4s.
  Cũng trong nhánh: phiếu asset `docs/asset-requests/` (đã chốt HP = phương án A, QH = Đông Hồ), xoá 13 asset cũ không dùng (manifest đã cập nhật).
  Chưa làm trong Sprint 1: design tokens / layout preset (báo cáo đề xuất), giới hạn độ dài ô nhập tên/địa chỉ + cảnh báo trong editor.
- 2026-11-20 (Sprint 0 theo báo cáo đánh giá danhgiakhachquan/BAO_CAO_..._2026-11-20.md, nhánh `sprint-0-reliability`):
  VID-01 WebM fallback ghi đủ D×loops (đo: 2 vòng = 39.9s); AUD-01 WebM có nhạc (Web Audio → MediaStream → Opus, mờ dần 2s cuối; AudioContext bị chặn → bỏ nhạc sau 2s, không treo) + `detectExportCapability()` cảnh báo TRƯỚC khi xuất trong hộp thoại (WebM thời gian thực / không có nhạc / không hỗ trợ);
  REN-01 `fitMessage()` giảm cỡ tới min (36 ngang/38 dọc), tràn thì dòng cuối "…" + editor cảnh báo qua `checkMessageFit()` (engine.ts); ART-01 trường `preload` trong template-assets + getAsset tự đăng ký; REN-03 `resetDrawState()` mỗi lớp trong renderFrame; DOC-01 README (16 mẫu, cổng 8080, hệ thống ảnh).
  Đã kiểm: typecheck, test:lunar 6/6, check:assets 0 lỗi, build sạch; MP4 3 vòng có nhạc = 60.01s; WebM 2 vòng có nhạc (autoplay) audio>0. Còn: WebM của MediaRecorder KHÔNG có duration trong header (TV có thể không tua được) — cần remux/sửa header sau; cảnh báo export chưa thử trên trình duyệt thật không có WebCodecs.
  Việc tiếp theo theo báo cáo: Sprint 1 (safe area + text layout, tên dài), 3 mẫu chủ lực (cần ảnh từ người dùng), thumbnail theo tỉ lệ, preload theo mẫu đang xem, export/import project.
- 2026-11-19 (mẫu hong-phuong): thêm mẫu `hong-phuong` (tổng 16 mẫu) từ ảnh người dùng sưu tầm; code mẫu chỉ có màu/gradient dự phòng/khung vòm/hạt lấp lánh, mọi hình minh hoạ là ảnh qua `template-assets.ts`. tsc sạch; đã chụp 16:9 & 9:16 (có/không ảnh). Còn: ở cảnh intro CÓ ẢNH khổ ngang, dòng tên dài sát nhẹ vào phượng bên phải; khổ dọc cảnh intro có ảnh chữ đè lên phượng/sen đáy. Chưa thử xuất MP4. Dev server đang ở cổng 3124.
- 2026-11-19 (hệ thống ảnh): thêm hệ thống ảnh trang trí theo mẫu (xem "QUY TẮC ẢNH"). Đã thử với hoa-dao-xuan (nền ngang `background.webp`) và quan-ho-kinh-bac (sen `sen-bong.webp`, ảnh sen do người dùng tự lấy từ nguồn free — ảnh trông giống ảnh sen trong mẫu cinelove, nên nhắc người dùng xác nhận giấy phép trước khi công bố). tsc sạch; đã chụp cả 16:9 & 9:16. Dev server: cổng 3123 bị treo → đang chạy ở 3124. Chưa thử xuất MP4 với ảnh, chưa commit.
- 2026-11-19 (cuối phiên): thêm mẫu `quan-ho-kinh-bac` (tổng 15 mẫu): giấy điệp, khung Đông Hồ, liền anh (khăn xếp, áo the, ô) + liền chị (nón quai thao, áo mớ ba mớ bảy) vẽ bằng canvas đứng hai bên, ao sen (sóng lan, bông sen thở nhịp, lá bồng bềnh), vệt sáng quét giấy điệp, cánh sen rơi; nhạc "Ngũ cung" trong thư viện. Còn lỗi nhỏ: ở cảnh intro CÓ ẢNH, chữ tên đè nhẹ lên liền chị (16:9) / hai nhân vật (9:16). Chưa thử xuất MP4 mẫu này. Mẫu cinelove KHÔNG được xem (trang SPA), chuyển động tự thiết kế.
- 2026-11-19 (phiên sau): thêm 3 mẫu (tet-doan-vien, dua-xanh, toi-gian → tổng 14), `src/lib/musicLibrary.ts` (3 bài nhạc tự tổng hợp bằng OfflineAudioContext → WAV, chọn ở thẻ Nhạc nền, không vướng bản quyền), sửa cắt chữ ô "Tên ở cảnh lớn", CSS mobile. tsc sạch; đã chụp 3 mẫu mới 16:9 + 9:16 đều ổn. Chưa nghe thử nhạc, chưa thử xuất MP4 mẫu mới.
- 2026-11-19: xong 4 tính năng (mẫu theo màu rạp, font+màu, nhiều ảnh + cảnh Khoảnh khắc, bản dọc 9:16) + nhạc nền + editor dạng thanh công cụ dọc & dải phân cảnh. Build sạch, chưa có lỗi tồn đọng.
- Repo vừa được `git init`; chưa commit lần nào (chỉ commit khi người dùng yêu cầu).
- Quy ước làm việc: hết mỗi khối việc lớn → cập nhật file này và nhắc người dùng chuyển chat mới nếu phiên đã dài.

## Việc tiếp theo (chưa làm)
- Thanh toán thật (PayOS/VNPay/MoMo) + webhook; tài khoản + DB (Neon/Postgres) + object storage cho ảnh/nhạc.
- Render bản sạch phía server (headless Chrome chạy `renderFrame`) để chống lách watermark.
- Link chiếu online `/v/<id>` cho Smart TV; thư viện nhạc có bản quyền; thêm mẫu theo mùa/vùng miền.
- Mobile: đã thêm CSS (input 16px, nút ≥40px, row wrap) nhưng CHƯA chụp lại editor ở viewport điện thoại; cần thử máy thật.
