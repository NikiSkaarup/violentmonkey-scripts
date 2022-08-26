# NWS - Violent Monkey Scripts

## Installation

Copy the URL(s) from the scripts section and paste it into the `Install from URL` in Violentmonkey after running `npm run dev` not available elsewhere yet

## Development

### How to

When developing copy the url for the script into `Install from URL` in Violentmonkey and check `Track local file before this window is closed` before pressing confirm installation, while the tab is open the script will be updated continuously, so it should only be closed once done

### Commands

- `npm run serve` runs http-server locally on port 8432 to serve the scripts for the extension
- `npm run build` builds the javascript files to be served and outputs them to `dist`
  which is available under `http://localhost:8432/` when served
- `npm run styles` copies the stylesheets to `dist/styles`
  which is available under `http://localhost:8432/styles` when served
- `npm start` does all of the above at the same time

## Scripts

- nws lib, used by other scripts for configuration UI and initialization.
- [manga reading script](http://localhost:8432/manga-reading-script.user.js)
