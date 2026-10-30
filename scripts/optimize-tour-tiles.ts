import { mkdir, readdir } from 'node:fs/promises';
import { join, resolve, relative, dirname } from 'node:path';
import sharp from 'sharp';

// Re-run from the pristine Artefact tiles, never from already-compressed output.
const source = process.argv[2] && resolve(process.argv[2]);
const target = resolve(process.argv[3] || 'public/assets/projects/tour/viewer/tiles');
if (!source || source === target) throw new Error('Provide a pristine source tile directory distinct from the destination');
const files: string[] = [];
async function collect(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path); else if (entry.name.endsWith('.jpg')) files.push(path);
  }
}
await collect(source);
let cursor = 0, bytes = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < files.length) {
    const file = files[cursor++], output = join(target, relative(source, file));
    await mkdir(dirname(output), { recursive: true });
    const result = await sharp(file).jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' }).toFile(output);
    bytes += result.size;
  }
}));
process.stdout.write(JSON.stringify({ files: files.length, bytes, quality: 82, dimensions: 'unchanged' }) + '\n');
