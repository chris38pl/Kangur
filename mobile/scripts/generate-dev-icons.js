const path = require("path");
const sharp = require("sharp");

async function withDevBadge(inputPath, outputPath, canvasSize) {
  const meta = await sharp(inputPath).metadata();
  const w = canvasSize || meta.width || 1024;
  const h = canvasSize || meta.height || 1024;
  const badgeH = Math.round(h * 0.18);
  const badgeW = Math.round(w * 0.42);
  const fontSize = Math.round(badgeH * 0.55);
  const radius = Math.round(badgeH * 0.22);
  const svg = Buffer.from(`<svg width="${badgeW}" height="${badgeH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="${radius}" ry="${radius}" fill="#16A34A"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">DEV</text>
</svg>`);
  await sharp(inputPath)
    .resize(w, h, { fit: "cover" })
    .composite([{ input: svg, gravity: "southeast" }])
    .png()
    .toFile(outputPath);
  console.log("wrote", outputPath, `${w}x${h}`);
}

(async () => {
  const dir = path.join(__dirname, "..", "assets", "images");
  await withDevBadge(
    path.join(dir, "icon.png"),
    path.join(dir, "icon-dev.png"),
    1024,
  );
  const fgMeta = await sharp(
    path.join(dir, "android-icon-foreground.png"),
  ).metadata();
  await withDevBadge(
    path.join(dir, "android-icon-foreground.png"),
    path.join(dir, "android-icon-foreground-dev.png"),
    fgMeta.width || 1024,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
