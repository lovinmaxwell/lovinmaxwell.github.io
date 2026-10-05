// Renders public/og.svg to public/og.png (1200x630). Run with: npm run og
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const input = fileURLToPath(new URL('../public/og.svg', import.meta.url));
const output = fileURLToPath(new URL('../public/og.png', import.meta.url));

const info = await sharp(input, { density: 96 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(output);
console.log(`og.png ${info.width}x${info.height}, ${info.size} bytes`);
