#!/usr/bin/env node
/**
 * Regenerate PNG icons and SVGO header SVG from owl/carelink-owl-avatar.svg.
 * Usage: node scripts/generate-owl-brand-assets.mjs [path-to-source.svg]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = process.argv[2] ?? path.join(root, 'public/brand/carelink-owl-avatar.svg');
const brandDir = path.join(root, 'public/brand');
const iconsDir = path.join(brandDir, 'icons');
const headerSvg = path.join(brandDir, 'owl-header.svg');
const legacySvg = path.join(brandDir, 'owl.svg');
const svgoConfig = path.join(root, 'scripts/svgo-owl-header.config.mjs');

const BRAND_GREEN = { r: 31, g: 92, b: 74, alpha: 1 };

async function renderIconPng(size, outPath, cornerRadiusRatio = 96 / 512) {
  const radius = Math.round(size * cornerRadiusRatio);
  const owlSize = Math.round(size * 0.88);
  const owlBuffer = await sharp(fs.readFileSync(source))
    .resize(owlSize, owlSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const roundedMask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );

  const base = sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_GREEN },
  }).png();

  const composed = await base
    .composite([{ input: owlBuffer, gravity: 'centre' }])
    .composite([{ input: await sharp(roundedMask).png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer();

  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, composed);
}

async function main() {
  if (!fs.existsSync(source)) {
    console.error(`Source SVG not found: ${source}`);
    process.exit(1);
  }

  execFileSync('npx', ['svgo', source, '-o', headerSvg, '--config', svgoConfig], {
    cwd: root,
    stdio: 'inherit',
  });

  await fs.promises.copyFile(headerSvg, legacySvg);

  const pngJobs = [
    [32, path.join(iconsDir, 'icon-32.png')],
    [128, path.join(iconsDir, 'icon-128.png')],
    [180, path.join(iconsDir, 'icon-180.png')],
    [192, path.join(iconsDir, 'icon-192.png')],
    [512, path.join(iconsDir, 'icon-512.png')],
    [128, path.join(root, 'src/app/icon.png')],
    [180, path.join(root, 'src/app/apple-icon.png')],
  ];

  for (const [size, out] of pngJobs) {
    await renderIconPng(size, out);
    console.log(`Wrote ${path.relative(root, out)} (${size}px)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
