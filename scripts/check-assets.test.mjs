import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
const script = new URL("./check-assets.mjs", import.meta.url);
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "taoslide-assets-"));
  const put = (path, data) => {
    const f = join(dir, path);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, data);
  };
  // Valid 2x2 VP8X header (enough for validation, not decoded).
  const webp = Buffer.alloc(30);
  webp.write("RIFF", 0); webp.writeUInt32LE(22, 4); webp.write("WEBP", 8);
  webp.write("VP8X", 12); webp.writeUInt32LE(10, 16);
  webp[24] = 1; webp[27] = 1;
  put("public/assets/demo/decorations/flower.webp", webp);
  put("src/config/template-assets.ts", 'export const asset = "/assets/demo/decorations/flower.webp";');
  put("src/sample.ts", 'getAsset("/assets/demo/decorations/flower.webp");');
  const manifest = {
    templateId: "demo", schemaVersion: 1,
    assets: [{ file: "decorations/flower.webp", source: "unknown", licenseStatus: "unverified", reviewStatus: "legacy-needs-audit" }]
  };
  put("public/assets/demo/manifest.json", JSON.stringify(manifest));
  const run = (...args) => spawnSync(process.execPath, [script.pathname, "--root", dir, ...args], { encoding: "utf8" });
  try { fn({ put, run, manifest }); } finally { rmSync(dir, { recursive: true, force: true }); }
}
test("valid legacy asset is warning, not blocking", () => fixture(({ run }) => {
  const r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /Unverified license/);
}));
test("strict license mode rejects unverified assets", () => fixture(({ run }) => {
  const r = run("--strict-licenses");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Unverified license/);
}));
test("missing referenced files fail quality gate", () => fixture(({ put, run }) => {
  put("src/sample.ts", 'getAsset("/assets/demo/decorations/missing.webp");');
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Missing referenced asset/);
}));
test("unregistered getAsset call fails", () => fixture(({ put, run }) => {
  put("src/config/template-assets.ts", "export const asset = {};");
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /getAsset missing preload/);
}));
test("malformed manifest fails", () => fixture(({ put, run }) => {
  put("public/assets/demo/manifest.json", "{invalid}");
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Invalid JSON/);
}));
test("manifest source must be valid", () => fixture(({ put, run, manifest }) => {
  manifest.assets[0].source = "mystery";
  put("public/assets/demo/manifest.json", JSON.stringify(manifest));
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Invalid source/);
}));
test("invalid WebP header fails", () => fixture(({ put, run }) => {
  put("public/assets/demo/decorations/flower.webp", "not a webp");
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Invalid WebP header/);
}));
