import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const demoUrl = process.env.EXPO_PUBLIC_DEMO_URL || 'https://zentia.vercel.app';
const outputPath = path.resolve(process.cwd(), 'docs/assets/demo-qr.png');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

await QRCode.toFile(outputPath, demoUrl, {
  width: 512,
  margin: 2,
  color: {
    dark: '#09090B',
    light: '#FFFFFF',
  },
});

console.log(`QR generated at ${outputPath} -> ${demoUrl}`);
