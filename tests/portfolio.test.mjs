import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const story = read('index.html');
const classic = read('classic/index.html');
const sections = ['top', 'about', 'highlights', 'domains', 'stack', 'experience', 'projects', 'archive', 'open-source', 'contact', 'ask'];

test('the new and original designs have separate routes and a shared canonical', () => {
  assert.match(story, /data-appearance="immersive"/);
  assert.doesNotMatch(classic, /data-appearance="immersive"/);
  for (const html of [story, classic]) {
    assert.match(html, /rel="canonical" href="https:\/\/lovinmaxwell\.github\.io\/"/);
    assert.match(html, /aria-label="Portfolio version"/);
    assert.match(html, /href="\/classic\/"/);
    assert.match(html, /href="\/"/);
  }
  assert.match(story, /href="\/" aria-current="page"/);
  assert.match(classic, /href="\/classic\/" aria-current="page"/);
  assert.doesNotMatch(read('sitemap-0.xml'), /\/classic\//);
});

test('the story uses six scenes while classic preserves the complete original sections', () => {
  assert.equal([...story.matchAll(/\sdata-scene(?:\s|>)/g)].length, 6);
  for (const [html, expected] of [[story, ['top', 'about', 'experience', 'systems', 'stack', 'contact']], [classic, sections]]) {
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
    for (const section of expected) assert.ok(ids.has(section), `Missing ${section}`);
    for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.has(anchor), `Missing target #${anchor}`);
    }
  }
});

const profile = JSON.parse(read('profile.json'));
const text = story.replaceAll('&amp;', '&').replaceAll('&#38;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');

test('the journey includes every recorded role and its full responsibilities', () => {
  for (const job of profile.experience) {
    for (const value of [job.company, job.role, job.location, job.period, ...job.bullets]) {
      assert.ok(text.includes(value), `Missing career content: ${value}`);
    }
  }
  const ordered = ['Anna University', ...profile.experience.toReversed().map(job => job.company)];
  const journey = story.slice(story.indexOf('id="experience"'), story.indexOf('id="systems"'));
  let previous = -1;
  for (const company of ordered) {
    const position = journey.indexOf(company, previous + 1);
    assert.ok(position > previous, `Career chronology missing ${company}`);
    previous = position;
  }
});

test('education, certifications and courses are available inside the new experience', () => {
  for (const item of [...profile.education, ...profile.certifications, ...profile.courses]) {
    assert.ok(text.includes(item.title), `Missing learning record: ${item.title}`);
    assert.ok(text.includes(item.date));
  }
  assert.match(story, /data-detail="education"/);
  assert.match(story, /<noscript>/);
});

test('the full technology catalog remains and the archive is preserved in Original', () => {
  for (const category of profile.stack.categories) {
    assert.ok(text.includes(`data-story-category="${category.name}"`));
    for (const tool of category.items) {
      const name = tool.replace(/ \([^)]*\)$/, '');
      assert.ok(text.includes(name), `Missing tool: ${name}`);
    }
  }
  const classicText = classic.replaceAll('&amp;', '&').replaceAll('&#38;', '&');
  for (const item of profile.archive) assert.ok(classicText.includes(item.name), `Missing original archive: ${item.name}`);
  assert.doesNotMatch(story, /id="detail-workbench"|data-detail="workbench"/);
});

test('the final scene celebrates the current Doha role with original stadium artwork', () => {
  const finale = text.slice(text.indexOf('id="contact"'), text.indexOf('aria-label="Story chapters"'));
  assert.ok(finale.includes('Based in Doha.'));
  assert.ok(finale.includes(profile.experience.find(job => job.current).company));
  assert.ok(finale.includes('doha-lattice'));
  assert.ok(finale.includes('qatar-mark'));
  assert.doesNotMatch(finale, /finale-skyline/);
});

test('Work is hidden in the new view without removing original projects or contextual details', () => {
  assert.doesNotMatch(story, /id="projects"|data-chapter="projects"|data-horizontal="work"/);
  for (const name of ['holywhisper', 'accessflow', 'diskmanager-pro']) {
    assert.ok(classic.includes(`id="project-${name}"`));
  }
  assert.match(story, /href="\/classic\/#project-accessflow"/);
  assert.match(story, /id="detail-accessflow"/);
  assert.match(story, /In development/);
  assert.match(classic, /In App Store review/);
  assert.ok(read('case-studies/jev-docai-routing/index.html').includes('Confidence-Based Document Routing'));
});

test('dark-only story omits the theme command without removing it from classic', () => {
  assert.doesNotMatch(story, /data-kind="theme"/);
  assert.match(classic, /data-kind="theme"/);
  assert.match(classic, /id="theme-toggle"/);
});

test('profile metadata and machine-readable outputs remain available', () => {
  const profile = JSON.parse(read('profile.json'));
  assert.ok(profile);
  for (const html of [story, classic]) {
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /name="google-site-verification"/);
    assert.match(html, /name="msvalidate.01"/);
  }
  assert.match(read('llms.txt'), /Lovin/);
  assert.match(read('llms-full.txt'), /Lovin/);
});

test('the cinematic enhancement starts from accessible static content', () => {
  assert.match(story, /data-motion="off"/);
  assert.match(story, /data-motion-toggle/);
  assert.match(story, /data-horizontal-prev="journey"/);
  assert.match(story, /data-horizontal-next="journey"/);
  assert.match(story, /aria-label="Story chapters"/);
  assert.doesNotMatch(story, /\sinert(?:\s|>)/);
  assert.match(story, /<iframe data-study-src="\/case-studies\/jev-docai-routing\/"/);
});

test('the hero shows an original neural core with a still poster and a lazy 3D enhancement', () => {
  const hero = story.slice(story.indexOf('id="top"'), story.indexOf('id="about"'));
  assert.match(hero, /class="core-art"/);
  assert.match(hero, /\/images\/hero-neural-core-poster\.webp/);
  assert.match(hero, /data-core-model="\/models\/hero-neural-core\.glb"/);
  assert.doesNotMatch(hero, /composition-|holywhisper|document-routing|Explore the work/);
  assert.match(hero, /data-chapter="experience"/);
  assert.doesNotMatch(story, /<canvas|orbital-ribbon/);
  const poster = readFileSync(new URL('../dist/images/hero-neural-core-poster.webp', import.meta.url));
  assert.equal(poster.toString('ascii', 8, 12), 'WEBP');
  const model = readFileSync(new URL('../dist/models/hero-neural-core.glb', import.meta.url));
  assert.equal(model.toString('ascii', 0, 4), 'glTF');
  assert.ok(model.length < 1024 * 1024, 'The 3D model must stay under 1 MB');
  assert.ok(!existsSync(new URL('../dist/images/orbital-ribbon.webp', import.meta.url)));
  // three.js must only arrive through a dynamic import, never in the scripts the page loads up front.
  const chunks = readdirSync(new URL('../dist/_astro/', import.meta.url)).filter(name => name.endsWith('.js'));
  const source = name => readFileSync(new URL(`../dist/_astro/${name}`, import.meta.url), 'utf8');
  const entries = [...story.matchAll(/src="\/_astro\/([^"]+\.js)"/g)].map(match => match[1]);
  assert.ok(entries.length > 0);
  for (const entry of entries) assert.doesNotMatch(source(entry), /WebGLRenderer/);
  assert.ok(chunks.some(name => source(name).includes('WebGLRenderer')), 'Missing the lazy 3D chunk');
  assert.ok(readFileSync(new URL('../dist/images/story-grain.png', import.meta.url)).length > 0);
});

test('systems walkthroughs represent actual work and distinguish concepts from deployments', () => {
  for (const id of ['enterprise', 'sap', 'local-ai']) {
    assert.ok(story.includes(`data-system-select="${id}"`));
    assert.ok(story.includes(`data-system-panel="${id}"`));
  }
  for (const name of ['Flutter', 'PMWeb', 'ABAP RFC', 'SAP RE-FX', 'Human review']) assert.ok(text.includes(name));
  assert.match(text, /not an internal deployment diagram/);
  assert.match(text, /Conceptual flow for a product in development/);
});

test('capabilities lead to work while the complete catalog remains in a secondary viewer', () => {
  const stack = text.slice(text.indexOf('id="stack"'), text.indexOf('id="contact"'));
  for (const title of ['Build the application', 'Connect the business', 'Deliver on the cloud', 'Keep intelligence local']) {
    assert.ok(stack.includes(title));
  }
  assert.match(stack, /data-detail="stack"/);
  assert.match(story, /<dialog\b[^>]*\bid="detail-stack"/);
  assert.match(story, /data-stack-total/);
  assert.doesNotMatch(stack, /data-story-category=/);
});

test('the visual chapter atlas exposes all six destinations and accessible search', () => {
  assert.match(story, /aria-controls="chapter-atlas"/);
  assert.match(story, /<dialog[^>]+id="chapter-atlas"[^>]+aria-labelledby="atlas-title"/);
  assert.match(story, /type="search" data-atlas-search/);
  assert.match(story, /role="status" data-atlas-results/);
  for (const id of ['top', 'about', 'experience', 'systems', 'stack', 'contact']) {
    assert.match(story, new RegExp(`href="#${id}" data-atlas-chapter="${id}"`));
  }
  assert.doesNotMatch(classic, /data-atlas-open|data-atlas-chapter/);
});

test('the spatial hero keeps its artwork decorative and the system chips stay silent', () => {
  assert.match(story, /class="core-art" aria-hidden="true"/);
  for (const name of ['core-object', 'core-poster']) assert.ok(story.includes(`class="${name}"`));
  assert.equal([...story.matchAll(/class="flow-chip" aria-hidden="true"/g)].length, 12);
  assert.match(story, /class="story-field" aria-hidden="true"/);
});

test('system boundaries have labeled inspection controls and live explanations', () => {
  assert.equal([...story.matchAll(/\sdata-system-step(?:\s|>)/g)].length, 12);
  for (const id of ['enterprise', 'sap', 'local-ai']) {
    assert.ok(story.includes(`aria-controls="system-explanation-${id}"`));
    assert.ok(story.includes(`id="system-explanation-${id}" aria-live="polite" aria-atomic="true"`));
  }
  assert.match(story, /Reset to overview/);
  assert.match(story, /Inspect Flutter/);
});

test('the Signal Glass palette keeps readable text on the dark field and glass panels', () => {
  const css = readFileSync(new URL('../src/styles/story.css', import.meta.url), 'utf8');
  const chapters = readFileSync(new URL('../src/data/story.ts', import.meta.url), 'utf8');
  const token = name => {
    const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`));
    assert.ok(value, `Missing ${name} token`);
    return value[1];
  };
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + .05) / (values[1] + .05);
  };
  const chapterColors = [...chapters.matchAll(/color: '(#[0-9a-f]{6})'/g)].map(match => match[1]);
  assert.equal(chapterColors.length, 6);
  assert.deepEqual([...new Set(chapterColors)], [token('bg')]);
  for (const background of [...chapterColors, token('page'), token('card'), token('raised'), token('panel'), token('panel-highlight')]) {
    assert.ok(contrast(token('muted'), background) >= 4.5, `Muted text contrast on ${background}`);
    assert.ok(contrast(token('fg'), background) >= 4.5, `Primary text contrast on ${background}`);
  }
  assert.ok(contrast(token('accent'), token('accent-ink')) >= 4.5);
  assert.ok(contrast(token('accent'), token('panel-highlight')) >= 4.5);
  assert.ok(contrast(token('focus'), token('panel-highlight')) >= 3);
  assert.doesNotMatch(css, /--paper|--ink|color-scheme: light/);
  assert.match(story, /name="theme-color" content="#07090d"/);
});
