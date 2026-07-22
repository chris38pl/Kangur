/* global __dirname */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.resolve(__dirname, "..");
const src = path.resolve(mobileRoot, "../shared");
const dest = path.resolve(mobileRoot, ".shared");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(fromPath, toPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

if (!fs.existsSync(src)) {
  console.error(`[sync-shared] missing source: ${src}`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log(`[sync-shared] ${src} → ${dest}`);
