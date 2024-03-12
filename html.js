import { plugin } from 'bun';

plugin({
	name: 'html',
	setup(build) {
		build.onLoad({ filter: /\.(html)$/ }, async (args) => ({
			contents: await Bun.file(args.path).text(),
			loader: 'text'
		}));
	}
});
