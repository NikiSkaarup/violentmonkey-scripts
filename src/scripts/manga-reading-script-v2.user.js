// ==UserScript==
// @name        manga reading script v2
// @namespace   https://userscripts.skaarup.dev
// @resource    configuration-ui http://localhost:8732/styles/configuration-ui.css
// @resource    nwsLibCss http://localhost:8732/styles/nws-lib.css
// @resource    manganatoOverrides http://localhost:8732/styles/manganato-overrides.css
// @resource    manganatoOverridesNeither http://localhost:8732/styles/manganato-overrides-neither.css
// @resource    manganatoOverridesChapter http://localhost:8732/styles/manganato-overrides-chapter.css
// @resource    manganatoOverridesManga http://localhost:8732/styles/manganato-overrides-manga.css
// @resource    manganatoOverridesChapterOrManga http://localhost:8732/styles/manganato-overrides-chapter-or-manga.css
// @resource    mangaReadingScriptCss http://localhost:8732/styles/manga-reading-script.css
// @resource    manganatoOverridesChapterOrManga http://localhost:8732/styles/manganato-overrides-chapter-or-manga.css
// #@icon        http://localhost:8732/usericons/manga-reading-script-icon.png
// @homepageURL https://userscripts.skaarup.dev
// @updateURL   http://localhost:8732/scripts/manga-reading-script-v2.user.js
// @downloadURL http://localhost:8732/scripts/manga-reading-script-v2.user.js
// @match       https://(readmanganato|manganato|chapmanganato).com/*
// @match       https://manganelo.com/*
// @match       https://readmanganato.com/*
// @match       https://chapmanganato.com/*
// @match       https://manganato.com/*
// @match       https://chapmanganato.to/*
// @grant       none
// @version     1.0
// @author      nws
// @description Adds nearly complete keyboard navigation and cleans up the user interface of manganato
// @grant       GM_info
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @grant       GM_openInTab
// @inject-into content
// @run-at      document-start
// @noframes
// #@unwrap
// ==/UserScript==

/*
 * TODO: Rewrite in jsdoc and get rid of the compile step
 * TODO: store data in json, for more customization per manga.
 * TODO: add a togglable reading mode that lets you press once to scroll each image which will at most 100vh tall
 */

// @ts-ignore
import mangaReadingConfig from '../templates/manga-reading-config.html';
import nws from './nws.lib.js';

function mangaReadingScript() {
	/**
	 *
	 * @param {unknown} message
	 */
	function debug(message) {
		nws.debug(message, GM_info.script.name);
	}

	/** @type {manga_reading.globalsType} */
	const globals = {
		nextUrl: '',
		prevUrl: '',
		currentTitle: '',
		uiInitialized: false,
		currentSite: {
			name: 'None',
			urls: ['https://example.com'],
			at: 'neither',
			active: false,
			activeRegex: /(?:)/,
			atChapterRegex: /(?:)/,
			atMangaRegex: /(?:)/,
			titleLinkSelector: '',
			nextChapterSelector: '',
			prevChapterSelector: ''
		},
		titleList: [],
		sites: {
			manganato: {
				name: 'manganato',
				urls: [
					'https://readmanganato.com',
					'https://manganato.com',
					'https://chapmanganato.com',
					'https://chapmanganato.to'
				],
				active: false,
				at: 'neither',
				activeRegex: /https:\/\/(?:read|chap)?manganato\.(?:com|to)\S*/,
				atChapterRegex:
					/https:\/\/(?:read|chap)?manganato.(?:com|to)\/manga-[\w.\-~%]+\/chapter-[\d.-]+/,
				atMangaRegex: /https:\/\/(?:read|chap)?manganato.(?:com|to)\/manga-[\w.\-~%]+$/,
				titleLinkSelector: '.panel-breadcrumb > a:nth-child(3)',
				nextChapterSelector: 'a.navi-change-chapter-btn-next.a-h',
				prevChapterSelector: 'a.navi-change-chapter-btn-prev.a-h'
			},
			manganelo: {
				name: 'manganelo',
				urls: ['https://manganelo.com'],
				active: false,
				at: 'neither',
				activeRegex: /https:\/\/manganelo\.com\S*/,
				atChapterRegex: /https:\/\/(?:manganelo\.com)\/chapter\/[\w.\-~%]+\/[\w.\-~%]+/,
				atMangaRegex: /https:\/\/(?:manganelo\.com)\/(?:manga\/[\w.\-~%]+|read-[\w.\-~%]+)/,
				titleLinkSelector: '.panel-breadcrumb > a:nth-child(3)',
				nextChapterSelector: 'a.navi-change-chapter-btn-next.a-h',
				prevChapterSelector: 'a.navi-change-chapter-btn-prev.a-h'
			}
		}
	};

	/**
	 * @param {resource} resource
	 * @returns {boolean}
	 */
	function shouldLoad(resource) {
		let loadResource =
			resource.at === 'universal' ||
			resource.urls.find((url) => window.location.href.includes(url)) !== undefined;

		if (loadResource) {
			switch (resource.site) {
				case 'global':
					loadResource = true;
					break;
				case 'manga':
					loadResource = atManga();
					break;
				case 'chapter':
					loadResource = atChapter();
					break;
				case 'chapterOrManga':
					loadResource = atChapterOrManga();
					break;
				case 'neither':
					loadResource = atNeither();
					break;
				default:
					loadResource = false;
			}
		}
		return loadResource;
	}

	/** @type {Array<manga_reading.resourceType>} */
	const styleResources = [
		{
			name: 'manganatoOverrides',
			data: '',
			urls: [
				'https://readmanganato.com',
				'https://manganato.com',
				'https://chapmanganato.com',
				'https://chapmanganato.to'
			],
			at: 'site',
			site: 'global',
			shouldLoad: shouldLoad,
			inline: true
		},
		{
			name: 'manganatoOverridesNeither',
			data: '',
			urls: [
				'https://readmanganato.com',
				'https://manganato.com',
				'https://chapmanganato.com',
				'https://chapmanganato.to'
			],
			at: 'site',
			site: 'neither',
			shouldLoad: shouldLoad,
			inline: true
		},
		{
			name: 'manganatoOverridesChapter',
			data: '',
			urls: [
				'https://readmanganato.com',
				'https://manganato.com',
				'https://chapmanganato.com',
				'https://chapmanganato.to'
			],
			at: 'site',
			site: 'chapter',
			shouldLoad: shouldLoad,
			inline: true
		},
		{
			name: 'manganatoOverridesManga',
			data: '',
			urls: [
				'https://readmanganato.com',
				'https://manganato.com',
				'https://chapmanganato.com',
				'https://chapmanganato.to'
			],
			at: 'site',
			site: 'manga',
			shouldLoad: shouldLoad,
			inline: true
		},
		{
			name: 'manganatoOverridesChapterOrManga',
			data: '',
			urls: [
				'https://readmanganato.com',
				'https://manganato.com',
				'https://chapmanganato.com',
				'https://chapmanganato.to'
			],
			at: 'site',
			site: 'chapterOrManga',
			shouldLoad: shouldLoad,
			inline: true
		}
	];
	/** @type {Array<manga_reading.resourceType>} */
	const jsonResources = [];
	/** @type {Array<manga_reading.resourceType>} */
	const scriptResources = [];

	/** @type {{ titleList: Array<string> }} */
	const defaults = {
		titleList: []
	};

	const key = {
		firstRun: 'firstRun',
		titleList: 'titleList',
		dataAttr: 'data-nws-manga-reading-script'
	};

	const temp = document.createElement('div');
	temp.innerHTML = mangaReadingConfig;
	const configElement = /** @type {HTMLDivElement} */ (temp.children[0]);

	const ui = {
		titleList: /** @type {HTMLTextAreaElement} */ (
			configElement.querySelector('[data-mrs-title-list]')
		),
		subTitle: /** @type {HTMLSpanElement} */ (
			configElement.querySelector('[data-mrs-title-current]')
		),
		btnAdd: /** @type {HTMLButtonElement} */ (
			configElement.querySelector('[data-mrs-title-current-add]')
		),
		btnRemove: /** @type {HTMLButtonElement} */ (
			configElement.querySelector('[data-mrs-title-current-remove]')
		),
		btnSave: /** @type {HTMLButtonElement} */ (
			configElement.querySelector('[data-mrs-title-list-save]')
		),
		btnReset: /** @type {HTMLButtonElement} */ (
			configElement.querySelector('[data-mrs-title-list-reset]')
		)
	};

	/**
	 * @param {string} input
	 * @returns {string}
	 */
	function escapeRegExp(input) {
		return input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * @param {string} url
	 */
	function setLocation(url) {
		window.location = /** @type {(string & Location)} */ (url);
	}
	function setTitleList() {
		ui.titleList.value = globals.titleList.join('\r\n');
	}
	function atNeither() {
		return globals.currentSite.at === 'neither';
	}
	function atChapter() {
		return globals.currentSite.at === 'chapter';
	}
	function atManga() {
		return globals.currentSite.at === 'manga';
	}
	function atChapterOrManga() {
		return atChapter() || atManga();
	}
	function getChapterList() {
		return /** @type {HTMLElement} */ (
			document.querySelector('div.panel-story-chapter-list > ul.row-content-chapter')
		);
	}

	/**
	 * @param {NodeListOf<HTMLElement>} array
	 * @param {string} style
	 * @param {string} value
	 */
	function setStyle(array, style, value) {
		const arr = [.../** @type {Array<HTMLElement>} */ (/** @type {any} */ (array))];
		for (const item of arr) {
			item.style[/** @type {any} */ (style)] = value;
		}
	}

	function resize() {
		if (!globals.sites.manganato.active || !atChapter()) return;

		const title = 'Image Width / %';
		const height = "'auto h' to fit images to page height,";
		const width = "'auto w' to fit images to page width.";
		const inp = prompt(`${title}\n${height}\n${width}`);
		const input = inp?.valueOf().toLowerCase();
		if (input === null || input === '0') return;

		const pageWidth = document.body.clientWidth;
		/** @type {Array<HTMLImageElement>} */
		const images = /** @type {any} */ (
			document.querySelectorAll('.container-chapter-reader img')
		);

		if (input === 'auto w' || input === 'w') {
			for (const image of images) {
				image.style.width = `${(pageWidth / image.width) * 100}%`;
			}
		} else if (input === 'auto h' || input === 'h') {
			for (const image of images) {
				image.style.width = `${(pageWidth / image.width) * 100}%`;
				image.style.width = `${
					(window?.visualViewport?.height ?? 1 / image.height) * 100
				}%`;
			}
		} else {
			for (const image of images) {
				image.style.width = image.style.width = `${input}%`;
			}
		}
	}

	function setSubTitle() {
		ui.subTitle.innerText = atChapterOrManga() ? globals.currentTitle : 'No title';
	}

	function registerConfig() {
		setSubTitle();

		console.log(ui);

		ui.btnRemove.onclick = removeTitle;
		ui.btnRemove.disabled = atNeither();

		ui.btnAdd.onclick = addTitle;
		ui.btnAdd.disabled = atNeither();

		ui.btnReset.onclick = () => {
			ui.titleList.value = globals.titleList.join('\r\n');
		};

		ui.btnSave.onclick = saveTitles;

		nws.config.register(GM_info, configElement, () => {
			setTitleList();
			ui.btnRemove.disabled = atNeither();
			ui.btnAdd.disabled = atNeither();
		});
	}

	function addTitle() {
		const trimmedValue = ui.titleList.value.trim();
		const taTitleListValue = trimmedValue.split(/\r?\n/);
		const includes = taTitleListValue.includes(globals.currentTitle);
		if (includes) return;

		const curTAVal = trimmedValue.length > 0 ? `${trimmedValue}\r\n` : '';
		ui.titleList.value = curTAVal + globals.currentTitle;
	}

	function saveTitles() {
		globals.titleList = [...new Set(ui.titleList.value.trim().split(/\r?\n/).sort())];
		GM_setValue(key.titleList, JSON.stringify(globals.titleList));
		if (atChapter()) removeMargins();
	}

	function removeTitle() {
		const curTAVal = ui.titleList.value.trim();
		const regex = new RegExp(`${escapeRegExp(globals.currentTitle)}\\r?\\n?`, 'gi');
		ui.titleList.value = curTAVal.replace(regex, '');
	}

	function goToFirstChapter() {
		if (!globals.sites.manganato.active) return;
		const firstChapter = /** @type {HTMLElement} */ (getChapterList().lastElementChild);
		const firstChapterLink = /** @type {HTMLAnchorElement | null} */ (
			firstChapter.querySelector('a.chapter-name')
		);
		if (firstChapterLink !== null) setLocation(firstChapterLink.href);
	}

	function goToLatestChapter() {
		if (!globals.sites.manganato.active) return;
		const latestChapter = /** @type {HTMLElement} */ (getChapterList().firstElementChild);
		const latestChapterLink = /** @type {HTMLAnchorElement | null} */ (
			latestChapter.querySelector('.chapter-name')
		);
		if (latestChapterLink !== null) setLocation(latestChapterLink.href);
	}

	function removeMargins() {
		if (!atChapter()) return;
		let margin = '5px auto 0';
		if (globals.titleList.includes(globals.currentTitle)) {
			margin = '0 auto';
			setStyle(
				document.querySelectorAll('.container-chapter-reader > div'),
				'display',
				'none'
			);
		}
		setStyle(document.querySelectorAll('.container-chapter-reader img'), 'margin', margin);
	}

	function findUrls() {
		debug('Finding URLs...');

		const titleLink = /** @type {HTMLAnchorElement | null}*/ (
			document.querySelector(globals.currentSite.titleLinkSelector)
		);

		globals.currentTitle = titleLink?.innerText.trim().toLowerCase() ?? 'None';

		setSubTitle();

		if (!atChapter() || titleLink === null) {
			debug('Found URLs.');
			return;
		}

		const nextChapterLink = /** @type {HTMLAnchorElement | null}*/ (
			document.querySelector(globals.currentSite.nextChapterSelector)
		);

		if (nextChapterLink) globals.nextUrl = nextChapterLink.href;
		else globals.nextUrl = titleLink.href;

		const prevChapterLink = /** @type {HTMLAnchorElement | null}*/ (
			document.querySelector(globals.currentSite.prevChapterSelector)
		);

		if (prevChapterLink) globals.prevUrl = prevChapterLink.href;
		else globals.prevUrl = titleLink.href;

		debug('Found URLs.');
	}

	function loadTitleList() {
		debug('Loading title list...');

		globals.titleList = JSON.parse(
			GM_getValue(key.titleList, JSON.stringify(defaults.titleList))
		);

		debug('Loaded title list.');
	}

	function manganatoSiteOverrides() {
		if (!globals.sites.manganato.active) return;

		document.querySelector('.body-site > .container .panel-fb-comment')?.remove();
		document.querySelector('body > #fb-root')?.remove();
		document.querySelector('.body-site > .container-footer')?.remove();

		if (atChapter()) {
			const chapterContainer = document.querySelector('.container-chapter-reader');
			chapterContainer?.nextSibling?.remove();
			chapterContainer?.nextSibling?.remove();

			const firstContainer = document.querySelector('.body-site > .container:first-of-type');
			firstContainer?.classList.add('overrides-header-container');
			const lastContainer = document.querySelector('.body-site > .container:last-of-type');
			lastContainer?.classList.add('overrides-footer-container');
		}

		if (!atChapterOrManga()) {
			genreAllSetFirstActive();
		}
	}

	function siteOverrides() {
		debug('Applying site overrides...');
		manganatoSiteOverrides();
		debug('Applied site overrides.');
	}

	function setActiveSite() {
		debug('Setting active site...');
		const href = window.location.href;
		/** @type {Array<manga_reading.siteType>} */
		const sites = Object.values(globals.sites);
		for (const site of sites) {
			site.active = site.activeRegex.test(href);
			if (!site.active) {
				continue;
			}
			const atChapter = site.atChapterRegex.test(href);
			const atManga = site.atMangaRegex.test(href);

			switch (true) {
				case atChapter:
					site.at = 'chapter';
					break;
				case atManga:
					site.at = 'manga';
					break;
				default:
					site.at = 'neither';
					break;
			}
			globals.currentSite = site;
			break;
		}
		debug(`Set active site: ${globals.currentSite.name}`);
	}

	/** @type {Array<HTMLDivElement>} */
	let genreAllItems = [];
	let genreAllItemsIndex = 0;
	const genreAllActiveItemClass = 'nws-genre-all-active-item';

	/**
	 * @param {string} direction
	 */
	function genreAllGoToPage(direction) {
		const pageSelected = /** @type {HTMLAnchorElement | null} */ (
			document.querySelector(
				'.panel-page-number > .group-page > a.page-select:not(.page-blue)'
			)
		);
		if (!pageSelected) return;

		const previous = /** @type {HTMLAnchorElement | null} */ (
			pageSelected.previousElementSibling
		);

		const next = /** @type {HTMLAnchorElement | null} */ (pageSelected.nextElementSibling);

		switch (direction) {
			case 'ArrowLeft':
				if (previous === null || previous.classList.contains('page-blue')) return;
				setLocation(previous.href);
				break;
			case 'ArrowRight':
				if (next === null || next.classList.contains('page-blue')) return;
				setLocation(next.href);
				break;
		}
	}

	function genreAllSetFirstActive() {
		genreAllItems = [
			.../** @type {Array<HTMLDivElement>} */ (
				/** @type {any} */ (
					document.querySelectorAll('div.panel-content-genres > div.content-genres-item')
				)
			)
		];

		if (genreAllItems.length > 0) {
			genreAllItemsIndex = 0;
			genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
		}
	}

	function genreAllOpenMangaInNewTab() {
		const anchor = /** @type {HTMLAnchorElement|null} */ (
			genreAllItems[genreAllItemsIndex].querySelector('.genres-item-img')
		);

		if (anchor) {
			GM_openInTab(anchor.href, { active: false, insert: true });
		}
	}

	/**
	 * @param {string} direction
	 */
	function genreAllBrowse(direction) {
		switch (direction) {
			case 'ArrowUp':
				if (genreAllItemsIndex < 2) return;
				genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
				genreAllItemsIndex = genreAllItemsIndex - 2;
				genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
				break;
			case 'ArrowDown':
				if (genreAllItemsIndex + 2 > genreAllItems.length - 1) return;
				genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
				genreAllItemsIndex = genreAllItemsIndex + 2;
				genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
				break;
			case 'ArrowLeft':
				if (genreAllItemsIndex === 0) return;
				genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
				genreAllItemsIndex = genreAllItemsIndex - 1;
				genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
				break;
			case 'ArrowRight':
				if (genreAllItemsIndex === genreAllItems.length - 1) return;
				genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
				genreAllItemsIndex = genreAllItemsIndex + 1;
				genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
				break;
		}

		genreAllItems[genreAllItemsIndex].scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});

		window.getSelection()?.removeAllRanges();
	}

	const shortcutHelpers = nws.shortcut.helpers;

	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function configClosedShortcuts(e) {
		const chapter = atChapter();
		const manga = atManga();
		const chapterOrManga = chapter || manga;

		switch (true) {
			case e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && chapter:
				setLocation(globals.prevUrl);
				return true;
			case e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && manga:
				goToLatestChapter();
				return true;
			case e.code === 'ArrowLeft' &&
				shortcutHelpers.noModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllGoToPage(e.code);
				return true;
			case e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && chapter:
				setLocation(globals.nextUrl);
				return true;
			case e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && manga:
				goToFirstChapter();
				return true;
			case e.code === 'ArrowRight' &&
				shortcutHelpers.noModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllGoToPage(e.code);
				return true;
			case e.code === 'ArrowUp' &&
				shortcutHelpers.shiftModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllBrowse(e.code);
				return true;
			case e.code === 'ArrowDown' &&
				shortcutHelpers.shiftModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllBrowse(e.code);
				return true;
			case e.code === 'ArrowLeft' &&
				shortcutHelpers.shiftModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllBrowse(e.code);
				return true;
			case e.code === 'ArrowRight' &&
				shortcutHelpers.shiftModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllBrowse(e.code);
				return true;
			case e.code === 'Enter' &&
				shortcutHelpers.shiftModifier(e) &&
				!chapterOrManga &&
				window.location.href.includes('/genre-all'):
				genreAllOpenMangaInNewTab();
				return true;
			case e.code === 'Quote' && shortcutHelpers.shiftModifier(e) && chapter:
				resize();
				return true;
			case e.code === 'BracketLeft' && shortcutHelpers.shiftModifier(e) && chapterOrManga:
				setTitleList();
				removeTitle();
				saveTitles();
				return true;
			case e.code === 'BracketRight' && shortcutHelpers.shiftModifier(e) && chapterOrManga:
				setTitleList();
				addTitle();
				saveTitles();
				return true;
		}
		return false;
	}

	async function registerResources() {
		nws.resources.register('stylesheets', ...styleResources);
		nws.resources.register('json', ...jsonResources);
		nws.resources.register('scripts', ...scriptResources);
	}

	function registerKeyUps() {
		nws.shortcut.keyUp.register('ConfigClosed', {
			name: `${GM_info.script.name} - config closed`,
			callback: configClosedShortcuts
		});
	}

	function checkFirstRun() {
		debug('First run check...');
		if (GM_getValue(key.firstRun, true)) {
			debug('First run detected.');
			GM_setValue(key.firstRun, false);
			GM_notification('First run setup complete', `NWS - ${GM_info.script.name}`);
		}
		debug('First run checked.');
	}

	async function onInit() {
		console.log(`NWS - ${GM_info.script.name} - Loading...`);
		checkFirstRun();
		registerKeyUps();
		setActiveSite();
		loadTitleList();
		findUrls();
		if (atChapter()) {
			removeMargins();
		}
		siteOverrides();
		console.log(`NWS - ${GM_info.script.name} - Loaded.`);
	}

	registerConfig();
	registerResources();
	nws.init(onInit);
}

mangaReadingScript();
