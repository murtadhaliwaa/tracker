import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/icons/logo-source.png");
const iconsDir = join(root, "public/icons");

if (!existsSync(source)) {
  console.error("Missing public/icons/logo-source.png");
  process.exit(1);
}

const pngOptions = { quality: 100, compressionLevel: 6, effort: 10 };

async function resizeIcon(size, output, fit = "cover") {
  await sharp(source)
    .resize(size, size, { fit, position: "centre", kernel: sharp.kernel.lanczos3 })
    .png(pngOptions)
    .toFile(output);
  console.log(`Created ${output}`);
}

async function createMaskableIcon() {
  const innerSize = 410;
  const inner = await sharp(source)
    .resize(innerSize, innerSize, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
    .png(pngOptions)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 15, alpha: 1 },
    },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .png(pngOptions)
    .toFile(join(iconsDir, "icon-maskable-512.png"));

  console.log("Created icon-maskable-512.png");
}

await resizeIcon(512, join(iconsDir, "icon-512.png"));
await resizeIcon(192, join(iconsDir, "icon-192.png"));
await resizeIcon(180, join(iconsDir, "apple-touch-icon.png"));
await resizeIcon(32, join(iconsDir, "favicon-32.png"));
await createMaskableIcon();

await sharp(source)
  .resize(512, 512, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
  .png(pngOptions)
  .toFile(join(root, "public/favicon.png"));

console.log("Created public/favicon.png");
