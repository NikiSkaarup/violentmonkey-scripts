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
	} catch (e) {}
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

const nwsLibFile = Bun.file('./build/nws-lib.css');
const nwsLibBuilt = await nwsLibFile.text();
nwsLibFile.writer().write(nwsLibBuilt.replaceAll(':root', ':root, :host'));

const userScripts = new Glob('./src/**/*.user.js').scan('.');

for await (const userScript of userScripts) {
	const lastIndex = userScript.lastIndexOf('/');
	const fileName = userScript.slice(lastIndex + 1);

	performance.mark(fileName);

	console.log(`Building ${fileName}...`);

	const dest = `./build/${fileName}`;

	const buildResult = await Bun.build({
		entrypoints: [userScript],
		outdir: './build',
		target: 'browser',
		minify: false,
		loader: { '.html': 'text' },
	});

	if (!buildResult.success) {
		console.log(...buildResult.logs);
		continue;
	}

	const builtFile = Bun.file(dest);
	const content = await builtFile.text();

	const srcFile = Bun.file(userScript);
	const srcContent = await srcFile.text();

	const banner = getBannerFromContent(srcContent);

	const result = `${banner}\n\n${content}`;

	await Bun.write(dest, result);

	const perfEntry = performance.measure(`build-${fileName}`, fileName);

	console.log(`Built ${fileName} in \x1b[33m${perfEntry.duration.toFixed(3)}ms\x1b[0m`);
}
