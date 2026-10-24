import {URL} from 'node:url';
import process from 'node:process';
import {readFile, writeFile, mkdir} from 'node:fs/promises';

// Owner documentation source; regenerating the README cannot erase this block help.
const opcode = "forEachAtPath";
const argument = "MAX";
const pages = ["docs/index.html"];
const help = "When the fixed-input editor is enabled, MAX can be edited as a whole number from 1 to 1000. Partial, blank, or non-finite new values cannot be saved. NAME and PATH are not changed.";
const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
const start = '<!-- BEGIN FIXED INPUT HELP -->';
const end = '<!-- END FIXED INPUT HELP -->';
const body = `${start}<p id="fixed-input-${opcode}-${argument}" class="fixed-input-editor">${help} The editor is off by default: enable both the <code>blockEditorDialogs</code> and <code>blockEditorFixedInputs</code> GUI startup options, then reload. Unchanged raw values are never rewritten, and connected reporters are never evaluated.</p>${end}`;
for (const page of pages) {
  const target = new URL(page, root);
  const current = await readFile(target, 'utf8');
  const article = new RegExp(`(<article id="block-${opcode}"[^>]*>)([\\s\\S]*?)(</article>)`);
  if (!article.test(current)) throw new Error(`Missing block anchor: ${page}#block-${opcode}`);
  const next = current.replace(article, (_whole, opening, text, closing) => {
    const existing = new RegExp(`${start}[\\s\\S]*?${end}`);
    return opening + text.replace(existing, '') + body + closing;
  });
  if (check) {
    if (current !== next) throw new Error(`${page}: fixed-input help is out of date.`);
  } else await writeFile(target, next);
}
const siteRoot = pages[0].split('/')[0];
const canonical = await readFile(new URL('schemas/block-editor-fixed-inputs.schema.json', root));
const generated = new URL(`${siteRoot}/schemas/block-editor-fixed-inputs.schema.json`, root);
if (check) {
  if (!(await readFile(generated)).equals(canonical)) throw new Error('Published Schema copy differs from the canonical owner Schema.');
} else {
  await mkdir(new URL(`${siteRoot}/schemas/`, root), {recursive: true});
  await writeFile(generated, canonical);
}
