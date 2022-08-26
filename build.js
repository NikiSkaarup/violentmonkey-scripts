import { readFileSync, statSync, readdirSync } from 'fs';
import { build } from 'esbuild'
import { join } from 'path';

const src = 'src';
const dist = 'dist';
const ending = '.user.ts';
const userScriptEnding = '// ==/UserScript==';

const exit = () => {
  // eslint-disable-next-line no-undef
  process.exit(1);
}

const getAllFiles = (dirPath, arrayOfFiles) => {
  arrayOfFiles = arrayOfFiles || [];
  readdirSync(dirPath).forEach((file) => {
    const path = join(dirPath, '/', file);
    if (statSync(path).isDirectory())
      arrayOfFiles = getAllFiles(path, arrayOfFiles)
    else if (file.endsWith(ending))
      arrayOfFiles.push(file);
  });

  return arrayOfFiles;
}

const bannerFromEntryPoint = (entryPoint) => {
  const data = readFileSync(join(src, entryPoint), 'utf8');
  const splitted = data.split('\n');
  const index = splitted.findIndex(line => line == userScriptEnding);
  if (index === -1) return undefined;
  const sliced = splitted.slice(0, index + 1);
  return { js: sliced.join('\n') + '\n' };
};

const entryPoints = getAllFiles(src);

entryPoints.forEach((entryPoint) => build({
  entryPoints: [join(src, entryPoint)],
  bundle: true,
  outdir: dist,
  banner: bannerFromEntryPoint(entryPoint),
  target: 'es2020',
  tsconfig: 'tsconfig.json',
  color: true,

}).catch(exit));
