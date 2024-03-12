# NWS - Violent Monkey Scripts

## Installation

Copy the URL(s) from the scripts section and paste it into the `Install from URL` in Violentmonkey after running `npm run dev` not available elsewhere yet

## Development

### How to

When developing copy the url for the script into `Install from URL` in Violentmonkey and check `Track local file before this window is closed` before pressing confirm installation, while the tab is open the script will be updated continuously, so it should only be closed once done

### Commands

```sh
# Install dependencies
bun install
```

```sh
# Run development server
bun run dev
```

Gotta fix the hardcoded urls in the scripts for production use since it is currently hardcoded to `http://localhost:8732`

```sh
# Run for production
bun run start
```

## Scripts

- [nws lib](src/scripts/nws.lib.js), used by other scripts for configuration UI in a web component for style isolation and initialization.
- [manga reading script](src/scripts/manga-reading-script.user.js)
