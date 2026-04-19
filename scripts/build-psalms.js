import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const data = require('../node_modules/world-english-bible/json/psalms.json');

const OUT_DIR = join(__dirname, '../src/content/psalms');
mkdirSync(OUT_DIR, { recursive: true });

// Build per-psalm data: headers and verse lines
// Headers have no chapterNumber — they appear just before the next chapter's first content.
const psalmHeaders = {};
const psalmLines = {};
let pendingHeader = null;

for (const obj of data) {
  if (obj.type === 'header') {
    pendingHeader = obj.value.trim();
    continue;
  }

  if (obj.type === 'line text' || obj.type === 'paragraph text') {
    const n = obj.chapterNumber;
    if (!psalmLines[n]) {
      psalmLines[n] = [];
      if (pendingHeader) {
        psalmHeaders[n] = pendingHeader;
        pendingHeader = null;
      }
    }
    psalmLines[n].push({ verseNumber: obj.verseNumber, sectionNumber: obj.sectionNumber, value: obj.value.trim() });
  }
}

for (let n = 1; n <= 150; n++) {
  const lines = psalmLines[n] || [];
  const title = psalmHeaders[n] ?? null;

  // Group sections by verse, emitting <sup> only at section 1
  const verseParts = [];
  let currentVerse = null;
  let currentLines = [];

  const flushVerse = () => {
    if (currentVerse !== null) {
      verseParts.push(`<sup class="verse-num">${currentVerse}</sup> ${currentLines.join('\n')}`);
    }
  };

  for (const line of lines) {
    if (line.verseNumber !== currentVerse) {
      flushVerse();
      currentVerse = line.verseNumber;
      currentLines = [line.value];
    } else {
      currentLines.push(line.value);
    }
  }
  flushVerse();

  const titleYaml = title
    ? `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    : `title: ~`;

  const frontmatter = `---\nnumber: ${n}\n${titleYaml}\ntestament: "OT"\n---`;
  const body = verseParts.join('\n\n');

  writeFileSync(join(OUT_DIR, `${n}.md`), `${frontmatter}\n\n${body}\n`);
}

console.log('Generated 150 Psalm files in src/content/psalms/');
