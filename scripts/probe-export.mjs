// Usage: node probe.mjs <chromePath> <profileDir> <url>
import { spawn } from "node:child_process";

const [chrome, profile, url] = process.argv.slice(2);
const port = 9333;
const proc = spawn(chrome, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  url,
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
if (!target) { console.log("no target"); proc.kill(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

let out = "";
for (let i = 0; i < 240; i++) {
  await sleep(1000);
  const r = await send("Runtime.evaluate", { expression: "document.getElementById('result')?.textContent || ''", returnByValue: true });
  out = r.result?.result?.value ?? "";
  if (out.startsWith("RESULT")) break;
}
console.log(out || "timeout");
ws.close();
proc.kill();
process.exit(0);
