import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public", "icons", "icon.svg");
const outDir = path.join(root, "public", "icons");

if (!fs.existsSync(svgPath)) {
  console.error("Missing:", svgPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const svg = fs.readFileSync(svgPath);

async function gen(size, name) {
  const out = path.join(outDir, name);
  await sharp(svg, { density: 256 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

await gen(192, "icon-192.png");
await gen(512, "icon-512.png");
await gen(180, "apple-touch-icon.png");
