import { readdir } from 'node:fs/promises';
import Bun from 'bun';
import { Elysia } from 'elysia';

let files = await readdir('./build');

/** @type {Array<string>} */
let userScripts = [];
/** @type {Array<string>} */
let styles = [];

let lastUpdate = Date.now();

async function updateFiles() {
	if (Date.now() - lastUpdate < 1000) return;
	files = await readdir('./build');
	userScripts = files.filter((file) => file.endsWith('.user.js'));
	styles = files.filter((file) => file.endsWith('.css'));
	lastUpdate = Date.now();
}

const elysia = new Elysia()
	.get('/scripts/:script', async ({ params: { script } }) => {
		console.log('scripts', script, userScripts);
		await updateFiles();

		if (!userScripts.includes(script)) {
			console.error('Not found', script);
			return new Response('Not found', { status: 404 });
		}

		const file = Bun.file(`./build/${script}`);
		const content = await file.text();

		return new Response(content, {
			headers: {
				'Content-Type': 'application/javascript'
			}
		});
	})
	.get('/styles/:style', async ({ params: { style } }) => {
		await updateFiles();

		if (!styles.includes(style)) {
			console.error('Not found', style);
			return new Response('Not found', { status: 404 });
		}

		const file = Bun.file(`./build/${style}`);
		const content = await file.text();

		return new Response(content, {
			headers: {
				'Content-Type': 'text/css'
			}
		});
	});

elysia.listen(8732);
console.log('Listening on port 8732');
