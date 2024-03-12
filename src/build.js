import { readdir } from 'node:fs/promises';
import Bun, { $, Glob } from 'bun';

const userScriptEnding = '// ==/UserScript==';

// Start hack job to get watch mode working
for await (const file of new Glob('./src/**/*.user.js').scan('.')) {
	try {
		// hack to get the document object to exist for the user scripts
		// otherwise they throw an error when importing which breaks watch mode
		globalThis.document = /** @type {any}*/ ({});
		await import(`./${file.slice(6)}`);
	} catch (e) {}
}
for await (const file of new Glob('./src/styles/*.css').scan('.')) {
	try {
		await import(`./${file.slice(6)}`);
	} catch (e) {}
}
for await (const file of new Glob('./src/templates/*.html').scan('.')) {
	try {
		await import(`./${file.slice(6)}`);
	} catch (e) {
		console.error(e);
	}
}
// End hack job to get watch mode working

/**
 * @param {string} content
 */
function getBannerFromContent(content) {
	const index = content.indexOf(userScriptEnding);
	if (index === -1) return '';
	return content.slice(0, index + userScriptEnding.length);
}

// create build directory if it doesn't exist
await $`mkdir -p ./build`;

// copy static css to build output
await $`cp ./styles/*.css ./build/`;
await $`bunx @tailwindcss/cli@next --optimize -i src/styles/nws-lib.css -o build/nws-lib.css`;
await $`bunx @tailwindcss/cli@next --optimize -i src/styles/manga-reading-script.css -o build/manga-reading-script.css`;

const files = await readdir('./src');
const userScripts = files.filter((file) => file.endsWith('.user.js'));

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
		loader: { '.html': 'text' }
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
