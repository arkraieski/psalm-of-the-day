import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const verses = require('../node_modules/kjv/json/verses-1769.json');

const OUT_DIR = join(__dirname, '../src/content/psalms-kjv');
mkdirSync(OUT_DIR, { recursive: true });

for (let n = 1; n <= 150; n++) {
  const parts = [];
  let v = 1;
  while (verses[`Psalms ${n}:${v}`]) {
    const text = verses[`Psalms ${n}:${v}`]
      .replace(/\[([^\]]+)\]/g, '<em>$1</em>');
    parts.push(`<sup class="verse-num">${v}</sup> ${text}`);
    v++;
  }

  const body = parts.join('\n\n');
  const content = `---\nnumber: ${n}\ntitle: ~\ntestament: "OT"\n---\n\n${body}\n`;
  writeFileSync(join(OUT_DIR, `${n}.md`), content);
}

console.log('Generated 150 KJV Psalm files in src/content/psalms-kjv/');
