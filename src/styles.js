import { $ } from 'bun';

await $`bunx @tailwindcss/cli@next -i src/styles/nws-lib.css -o build/nws-lib.css`;
await $`bunx @tailwindcss/cli@next -i src/styles/manga-reading-script.css -o build/manga-reading-script.css`;
