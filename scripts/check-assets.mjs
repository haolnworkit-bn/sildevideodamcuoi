// Kiểm tra ảnh trang trí:  node scripts/check-assets.mjs
// 1) Mọi đường dẫn "/assets/..." khai báo trong src/config/template-assets.ts phải có file trong public/.
// 2) Mọi getAsset("/assets/...") trong src/ phải được khai báo trong template-assets.ts
//    (nếu không, ảnh không được tải trước → khung đầu của video xuất có thể thiếu ảnh).
// 3) Liệt kê file trong public/assets không được dùng ở đâu (chỉ để tham khảo, KHÔNG tự xoá).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const manifest = readFileSync(join(root, "src/config/template-assets.ts"), "utf8");
const declared = new Set([...manifest.matchAll(/["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const srcFiles = walk(join(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const used = new Map(); // url -> file
for (const f of srcFiles) {
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(/getAsset\(\s*["'](\/assets\/[^"']+)["']\s*\)/g)) used.set(m[1], relative(root, f));
}

let errors = 0;
for (const url of declared) {
  if (!existsSync(join(root, "public", url))) {
    console.log(`THIẾU FILE   ${url}  (khai báo trong template-assets.ts)`);
    errors++;
  }
}
for (const [url, file] of used) {
  if (!declared.has(url)) {
    console.log(`CHƯA KHAI BÁO ${url}  (getAsset trong ${file}) → thêm vào "preload" của mẫu`);
    errors++;
  }
}

const allAssetText = srcFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const unused = walk(join(root, "public/assets"))
  .filter((f) => /\.(webp|png|jpe?g)$/i.test(f))
  .map((f) => "/" + relative(join(root, "public"), f).split(sep).join("/"))
  .filter((url) => !allAssetText.includes(url));
if (unused.length) {
  console.log(`\nFile ảnh chưa được dùng (tham khảo, không tự xoá):`);
  for (const u of unused) console.log(`  ${u}`);
}

console.log(`\n${declared.size} ảnh khai báo, ${used.size} lời gọi getAsset, ${errors} lỗi.`);
process.exit(errors ? 1 : 0);
