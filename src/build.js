import { readdir } from 'node:fs/promises';
import Bun, { $ } from 'bun';

const userScriptEnding = '// ==/UserScript==';

/**
 * @param {string} content
 */
function getBannerFromContent(content) {
	const index = content.indexOf(userScriptEnding);
	if (index === -1) return '';
	return content.slice(0, index + userScriptEnding.length);
}

const files = await readdir('./src');
const userScripts = files.filter((file) => file.endsWith('.user.js'));

await $`mkdir -p ./build`;

// copy static css to build output
await $`cp ./styles/*.css ./build/`;

for (const userScript of userScripts) {
	const markName = `mark-${userScript}`;
	performance.mark(markName);

	const src = `./src/${userScript}`;
	const dest = `./build/${userScript}`;

	const buildResult = await Bun.build({
		entrypoints: [src],
		outdir: './build',
		target: 'browser',
		minify: false,
		plugins: [
			{
				name: 'html',
				setup(build) {
					build.onLoad({ filter: /\.(html)$/ }, async (args) => ({
						contents: await Bun.file(args.path).text(),
						loader: 'text'
					}));
				}
			}
		]
	});

	if (!buildResult.success) {
		console.log(...buildResult.logs);
		continue;
	}

	const builtFile = Bun.file(dest);
	const content = await builtFile.text();

	const srcFile = Bun.file(src);
	const srcContent = await srcFile.text();

	const banner = getBannerFromContent(srcContent);

	const result = `${banner}\n\n${content}`;

	await Bun.write(dest, result);

	const perfEntry = performance.measure(`build-${userScript}`, markName);

	console.log(`Built ${userScript} in \x1b[33m${perfEntry.duration.toFixed(3)}ms\x1b[0m`);
}
