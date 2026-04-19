#!/usr/bin/env node
/**
 * Setup script: downloads the 5 OSIS XML files we need from bzerangue/osis-bibles
 * (no clone), parses the Psalms from each, and writes markdown content files.
 *
 * Run once before building the site:
 *   npm run build:translations
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// File paths discovered by inspecting bzerangue/osis-bibles repo tree.
// Base: https://raw.githubusercontent.com/bzerangue/osis-bibles/master/
const RAW_BASE = 'https://raw.githubusercontent.com/bzerangue/osis-bibles/master';

const TRANSLATIONS = [
  { lang: 'es', name: 'Spanish (Reina Valera)',           repoPath: 'es/sparv.xml' },
  { lang: 'it', name: 'Italian (Riveduta)',                repoPath: 'it/irv_1990.xml' },
  { lang: 'pl', name: 'Polish (Polska Biblia)',            repoPath: 'pl/poland.xml' },
  { lang: 'pt', name: 'Portuguese Version',               repoPath: 'pt/port.xml' },
  { lang: 'zh', name: 'Chinese Simplified (Union Version)', repoPath: 'zh/chius.xml' },
];

// OSIS book abbreviations for Psalms
const PSALM_BOOK_IDS = ['Ps', 'Psa', 'PSA', 'Pss', 'ps'];

function download(repoPath) {
  const url = `${RAW_BASE}/${repoPath}`;
  console.log(`  Downloading ${url}`);
  return execSync(`curl -sSL "${url}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();
}

function extractText(raw) {
  return raw
    .replace(/<note\b[^>]*>[\s\S]*?<\/note>/g, '')
    .replace(/<(?:catchWord|rdg|rdgGrp|reference)\b[^>]*>[\s\S]*?<\/(?:catchWord|rdg|rdgGrp|reference)>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    // Remove spaces between CJK characters (OSIS encoding artifact)
    .replace(/ ([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])/g, '$1')
    .replace(/([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]) /g, '$1')
    .trim();
}

function detectBookId(xml) {
  for (const id of PSALM_BOOK_IDS) {
    // Match as an attribute value: osisID='Ps.1.1' or sID="Ps.1.1"
    if (new RegExp(`${id}\\.\\d+\\.\\d+`).test(xml)) return id;
  }
  return 'Ps';
}

const Q = `['"]`; // match single or double quoted attribute values

function parseContainerVerses(xml, bookId) {
  const result = {};
  const re = new RegExp(
    `<verse\\b[^>]*\\bosisID=${Q}${bookId}\\.(\\d+)\\.(\\d+)${Q}[^>]*>([\\s\\S]*?)<\\/verse>`,
    'g'
  );
  let found = false;
  for (const m of xml.matchAll(re)) {
    found = true;
    const psalm = parseInt(m[1]);
    const verse = parseInt(m[2]);
    const text = extractText(m[3]);
    if (text) {
      if (!result[psalm]) result[psalm] = {};
      result[psalm][verse] = text;
    }
  }
  return found ? result : null;
}

function parseMilestoneVerses(xml, bookId) {
  const result = {};

  const endPositions = new Map();
  const eRe = new RegExp(`<verse\\b[^>]*\\beID=${Q}${bookId}\\.(\\d+)\\.(\\d+)${Q}[^>]*\\/?>`, 'g');
  for (const m of xml.matchAll(eRe)) {
    endPositions.set(`${m[1]}.${m[2]}`, m.index);
  }

  const sRe = new RegExp(`<verse\\b[^>]*\\bsID=${Q}${bookId}\\.(\\d+)\\.(\\d+)${Q}[^>]*\\/?>`, 'g');
  for (const m of xml.matchAll(sRe)) {
    const psalm = parseInt(m[1]);
    const verse = parseInt(m[2]);
    const contentStart = m.index + m[0].length;
    const key = `${m[1]}.${m[2]}`;
    const endIdx = endPositions.get(key);
    const content = endIdx !== undefined
      ? xml.slice(contentStart, endIdx)
      : xml.slice(contentStart, contentStart + 4000);
    const text = extractText(content);
    if (text) {
      if (!result[psalm]) result[psalm] = {};
      result[psalm][verse] = text;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function parsePsalms(xml) {
  const bookId = detectBookId(xml);
  console.log(`  Book ID: "${bookId}"`);
  return parseContainerVerses(xml, bookId) ?? parseMilestoneVerses(xml, bookId) ?? {};
}

function generateMarkdown(psalmNum, verses) {
  const body = Object.keys(verses)
    .map(Number)
    .sort((a, b) => a - b)
    .map(v => `<sup class="verse-num">${v}</sup> ${verses[v]}`)
    .join('\n\n');
  return `---\nnumber: ${psalmNum}\ntitle: ~\ntestament: "OT"\n---\n\n${body}\n`;
}

let totalSuccess = 0;

for (const { lang, name, repoPath } of TRANSLATIONS) {
  console.log(`\n── ${name} ──`);
  let xml;
  try {
    xml = download(repoPath);
  } catch (err) {
    console.error(`  ERROR downloading: ${err.message}`);
    continue;
  }

  const allPsalms = parsePsalms(xml);
  const outDir = join(ROOT, `src/content/psalms-${lang}`);
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  const missing = [];
  for (let n = 1; n <= 150; n++) {
    const verses = allPsalms[n];
    if (!verses || Object.keys(verses).length === 0) { missing.push(n); continue; }
    writeFileSync(join(outDir, `${n}.md`), generateMarkdown(n, verses));
    count++;
  }

  if (missing.length > 0) console.warn(`  Missing: ${missing.join(', ')}`);
  console.log(`  Generated ${count}/150 → src/content/psalms-${lang}/`);
  if (count === 150) totalSuccess++;
}

console.log(`\nDone. ${totalSuccess}/${TRANSLATIONS.length} complete.`);
if (totalSuccess < TRANSLATIONS.length) process.exitCode = 1;
