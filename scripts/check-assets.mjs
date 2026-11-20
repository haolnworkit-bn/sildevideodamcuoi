import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, extname, join, sep, dirname } from "node:path";
import { createHash } from "node:crypto";

// Quality gate: no mutation. Legacy unverified licenses and byte duplicates are warnings.
// Run with --strict-licenses before commercial releases.
const args = process.argv.slice(2);
const ri = args.indexOf("--root");
if (ri !== -1 && !args[ri + 1]) { console.error("Missing value for --root"); process.exit(2); }
const root = ri === -1 ? process.cwd() : resolve(args[ri + 1]);
const strict = args.includes("--strict-licenses");
const failures = [], warnings = [];
const fail = (s) => failures.push(s);
const warn = (s) => warnings.push(s);
const assets = join(root, "public/assets");
const src = join(root, "src");
const config = join(src, "config/template-assets.ts");
const unix = (s) => s.split(sep).join("/");
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.isFile() ? [p] : [];
  });
}
function webpSize(b) {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === "VP8 " && b[23] === 0x9d && b[24] === 1 && b[25] === 0x2a)
    return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === "VP8L" && b[20] === 0x2f) {
    const n = b.readUInt32LE(21);
    return [(n & 0x3fff) + 1, ((n >>> 14) & 0x3fff) + 1];
  }
  return null;
}
if (!existsSync(config) || !existsSync(assets)) {
  console.error("Missing src/config/template-assets.ts or public/assets/");
  process.exit(1);
}
const ts = readFileSync(config, "utf8");
const declared = new Set([...ts.matchAll(/["'](\/assets\/[^"']+\.(?:webp|png|jpe?g))["']/g)].map((m) => m[1]));
const sources = walk(src).filter((f) => /\.(ts|tsx)$/.test(f));
const literalRefs = new Set(), getAssetRefs = new Set();
for (const file of sources) {
  const c = readFileSync(file, "utf8");
  for (const m of c.matchAll(/["'](\/assets\/[^"']+\.(?:webp|png|jpe?g))["']/g)) literalRefs.add(m[1]);
  for (const m of c.matchAll(/\bgetAsset\(\s*["'](\/assets\/[^"']+)["']\s*\)/g)) getAssetRefs.add(m[1]);
  const vars = new Map([...c.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*["'](\/assets\/[^"']+)["']/g)].map((m) => [m[1], m[2]]));
  for (const m of c.matchAll(/\bgetAsset\(\s*([A-Za-z_$][\w$]*)\s*\)/g))
    if (vars.has(m[1])) getAssetRefs.add(vars.get(m[1]));
}
for (const url of literalRefs) {
  if (!/^\/assets\/[a-z0-9][a-z0-9/-]*\.(webp|png|jpg|jpeg)$/.test(url) || url.includes("..")) {
    fail("Invalid asset URL: " + url); continue;
  }
  if (!existsSync(join(root, "public", url.slice(1)))) fail("Missing referenced asset: " + url);
}
for (const url of declared) if (!existsSync(join(root, "public", url.slice(1)))) fail("Missing declared asset: " + url);
for (const url of getAssetRefs) if (!declared.has(url)) fail("getAsset missing preload/registration: " + url);
const manifests = walk(assets).filter((p) => p.endsWith("manifest.json"));
const covered = new Set();
for (const file of manifests) {
  let m;
  try { m = JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { fail("Invalid JSON: " + relative(root, file) + " " + e.message); continue; }
  const id = unix(relative(assets, dirname(file)));
  if (id.includes("/") || m.templateId !== id || m.schemaVersion !== 1 || !Array.isArray(m.assets)) {
    fail("Invalid manifest schema/templateId: " + relative(root, file)); continue;
  }
  const seen = new Set();
  for (const a of m.assets) {
    if (!a || typeof a.file !== "string" || !/^(backgrounds|decorations|particles)\/[a-z0-9][a-z0-9-]*\.webp$/.test(a.file)) {
      fail("Invalid asset path in manifest " + id + ": " + JSON.stringify(a?.file)); continue;
    }
    if (seen.has(a.file)) fail("Duplicate manifest entry: " + id + "/" + a.file);
    seen.add(a.file);
    if (!["unknown","chatgpt-image","external","original"].includes(a.source)) fail("Invalid source: " + id + "/" + a.file);
    if (!["unverified","commercial-use","restricted"].includes(a.licenseStatus)) fail("Invalid licenseStatus: " + id + "/" + a.file);
    if (typeof a.reviewStatus !== "string" || !a.reviewStatus) fail("Missing reviewStatus: " + id + "/" + a.file);
    if (a.source === "external" && (typeof a.sourceUrl !== "string" || !/^https?:\/\//.test(a.sourceUrl))) fail("External asset missing sourceUrl: " + id + "/" + a.file);
    if (a.source === "external" && a.licenseStatus === "commercial-use" && !a.licenseEvidence) fail("External commercial asset missing licenseEvidence: " + id + "/" + a.file);
    if (a.licenseStatus === "unverified") (strict ? fail : warn)("Unverified license: " + id + "/" + a.file);
    const full = join(assets, id, a.file);
    if (!existsSync(full)) fail("Manifest file missing: " + id + "/" + a.file);
    covered.add(unix(relative(assets, full)));
  }
}
const images = walk(assets).filter((p) => /\.(webp|png|jpe?g)$/i.test(p));
const hashes = new Map();
for (const p of images) {
  const rel = unix(relative(assets, p)), b = readFileSync(p);
  if (rel !== rel.toLowerCase() || /[ _]/.test(rel)) warn("Nonstandard file name: " + rel);
  if (b.length > 3 * 1024 * 1024) warn("Image over 3 MiB: " + rel);
  if (extname(p).toLowerCase() === ".webp") {
    const dim = webpSize(b);
    if (!dim || !dim[0] || !dim[1]) fail("Invalid WebP header: " + rel);
    else {
      if (rel.includes("/backgrounds/landscape.webp") && dim[0] / dim[1] < 1.3) warn("Landscape ratio suspicious: " + rel);
      if (rel.includes("/backgrounds/portrait.webp") && dim[0] / dim[1] > .9) warn("Portrait ratio suspicious: " + rel);
    }
  }
  if (rel.includes("/") && !rel.startsWith("shared/") && !covered.has(rel)) warn("Image not listed in manifest: " + rel);
  const hash = createHash("sha256").update(b).digest("hex");
  if (hashes.has(hash)) warn("Duplicate bytes: " + hashes.get(hash) + " and " + rel);
  else hashes.set(hash, rel);
}
for (const msg of warnings) console.warn("WARN  " + msg);
for (const msg of failures) console.error("ERROR " + msg);
console.log("Asset check: " + images.length + " images; " + manifests.length + " manifests; " + declared.size + " registered references; " + failures.length + " errors; " + warnings.length + " warnings");
process.exitCode = failures.length ? 1 : 0;
