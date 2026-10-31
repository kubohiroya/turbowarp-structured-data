import {readdir, readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

interface Manifest {
  formatVersion: number;
  id: string;
  blocks: Array<{opcode: string}>;
}

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const distUrl = new URL('../dist/', import.meta.url);
const execFileAsync = promisify(execFile);
const files = (await readdir(distUrl)).sort();
const expectedFiles = ['extension-manifest.json', 'structured-data.js'];

if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
  throw new Error(`dist must contain exactly: ${expectedFiles.join(', ')}; found: ${files.join(', ')}`);
}

const manifest = JSON.parse(await readFile(new URL('extension-manifest.json', distUrl), 'utf8')) as Manifest;
if (manifest.formatVersion !== 2 || manifest.id !== 'kubohiroyastructureddata') {
  throw new Error('dist/extension-manifest.json has unexpected identity or format version.');
}
if (manifest.blocks.length !== 28 || new Set(manifest.blocks.map((block) => block.opcode)).size !== 28) {
  throw new Error('dist/extension-manifest.json must contain all 28 unique integrated opcodes.');
}

const bundle = await readFile(new URL('structured-data.js', distUrl), 'utf8');
if (!bundle.includes('// ID: kubohiroyastructureddata') || !bundle.includes('STRUCTURED_DATA_MVP')) {
  throw new Error('dist/structured-data.js does not match the extension identity or feature flag.');
}

if (process.env.CI === 'true' || process.env.CHECK_TRACKED_DIST === 'true') {
  const {stdout} = await execFileAsync(
    'git',
    ['status', '--short', '--untracked-files=all', '--', 'dist', 'lib-module'],
    {cwd: repositoryRoot}
  );
  if (stdout.length > 0) {
    throw new Error(`Generated dist files are not committed and up to date:\n${stdout}`);
  }
}

process.stdout.write(`Validated generated dist files in ${repositoryRoot}.\n`);
