// ==UserScript==
// @name        manga reading script v2
// @namespace   https://userscripts.skaarup.dev
// @resource    nwsLibCss http://localhost:8732/styles/nws-lib.css
// @resource    manganatoOverrides http://localhost:8732/styles/manganato-overrides.css
// @resource    manganatoOverridesNeither http://localhost:8732/styles/manganato-overrides-neither.css
// @resource    manganatoOverridesChapter http://localhost:8732/styles/manganato-overrides-chapter.css
// @resource    manganatoOverridesManga http://localhost:8732/styles/manganato-overrides-manga.css
// @resource    manganatoOverridesChapterOrManga http://localhost:8732/styles/manganato-overrides-chapter-or-manga.css
// @resource    mangaReadingScriptCss http://localhost:8732/styles/manga-reading-script.css
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
// @match       https://natomanga.com/*
// @match       https://manganelo.com/*
// @match       https://manganato.gg/*
// @match       https://mangakakalot.gg/*
// @match       https://mangakakalove.com/*
// @match       https://nelomanga.com/*
// @match       https://www.manganelo.com/*
// @match       https://www.readmanganato.com/*
// @match       https://www.chapmanganato.com/*
// @match       https://www.manganato.com/*
// @match       https://www.chapmanganato.to/*
// @match       https://www.natomanga.com/*
// @match       https://www.manganelo.com/*
// @match       https://www.manganato.gg/*
// @match       https://www.mangakakalot.gg/*
// @match       https://www.mangakakalove.com/*
// @match       https://www.nelomanga.com/*
// @grant       none
// @version     2.0
// @author      nws
// @description Adds nearly complete keyboard navigation and cleans up the user interface of manganato
// @grant       GM.info
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM_getResourceText
// @grant       GM.registerMenuCommand
// @grant       GM.notification
// @grant       GM.openInTab
// @grant       GM.xmlHttpRequest
// @inject-into content
// @run-at      document-start
// @top-level-await
// @noframes
// #@unwrap
// ==/UserScript==

/*
 * TODO: Rewrite in jsdoc and get rid of the compile step
 * TODO: Add a way to "GOTO" chapter when on a manga page
 * TODO: Add a way to "GOTO" manga when on a chapter page
 * TODO: store data in json, for more customization per manga.
 * TODO: add a togglable reading mode that lets you press once to scroll each image which will at most 100vh tall
 */

// @ts-ignore
import mangaReadingConfig from '../templates/manga-reading-config.html';
// @ts-ignore
import mangaReadingNotificationButton from '../templates/manga-reading-notification-button.html';
// @ts-ignore
import mangaReadingNotificationContainer from '../templates/manga-reading-notification-container.html';
// @ts-ignore
import mangaReadingNotification from '../templates/manga-reading-notification.html';
import nws from './nws.lib.js';

function mangaReadingScript() {
	/**
	 *
	 * @param {unknown} message
	 */
	function debug(message) {
		nws.debug(message, GM.info.script.name);
	}

	const urls = [
		'https://readmanganato.com',
		'https://manganato.com',
		'https://chapmanganato.com',
		'https://chapmanganato.to',
		'https://natomanga.com',
		'https://manganelo.com',
		'https://manganato.gg',
		'https://mangakakalot.gg',
		'https://mangakakalove.com',
		'https://nelomanga.com',
		'https://www.manganelo.com',
		'https://www.readmanganato.com',
		'https://www.chapmanganato.com',
		'https://www.manganato.com',
		'https://www.chapmanganato.to',
		'https://www.natomanga.com',
		'https://www.manganelo.com',
		'https://www.manganato.gg',
		'https://www.mangakakalot.gg',
		'https://www.mangakakalove.com',
		'https://www.nelomanga.com',
	];

	/** @type {manga_reading.globalsType} */
	const globals = {
		nextUrl: '',
		prevUrl: '',
		currentTitle: '',
		uiInitialized: false,
		site: {
			name: 'manganato',
			urls,
			active: true,
			at: 'neither',
			atChapterRegex: /\/manga\/[\w.\-~%]+\/chapter-[\d.-]+/,
			atMangaRegex: /\/manga\/[\w.\-~%]+$/,
			titleLinkSelector: 'div.breadcrumb > p > span > a',
			nextChapterSelector: '.btn-navigation-chap a.back', // ... wtf why are they reversed on their site..
			prevChapterSelector: '.btn-navigation-chap a.next', // ... wtf why are they reversed on their site..
		},
		titleList: [],
		ptApi: {
			url: '',
			bearerToken: '',
		},
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
			urls,
			at: 'site',
			site: 'global',
			shouldLoad,
			inline: true,
		},
		{
			name: 'manganatoOverridesNeither',
			data: '',
			urls,
			at: 'site',
			site: 'neither',
			shouldLoad,
			inline: true,
		},
		{
			name: 'manganatoOverridesChapter',
			data: '',
			urls,
			at: 'site',
			site: 'chapter',
			shouldLoad,
			inline: true,
		},
		{
			name: 'manganatoOverridesManga',
			data: '',
			urls,
			at: 'site',
			site: 'manga',
			shouldLoad,
			inline: true,
		},
		{
			name: 'manganatoOverridesChapterOrManga',
			data: '',
			urls,
			at: 'site',
			site: 'chapterOrManga',
			shouldLoad,
			inline: true,
		},
	];
	/** @type {Array<manga_reading.resourceType>} */
	const jsonResources = [];
	/** @type {Array<manga_reading.resourceType>} */
	const scriptResources = [];

	/** @type {{ titleList: Array<string> }} */
	const defaults = {
		titleList: [],
	};

	const key = {
		firstRun: 'firstRun',
		titleList: 'titleList',
		dataAttr: 'data-nws-manga-reading-script',
		ptAPi: 'ptApi',
	};

	const containerTemplate = document.createElement('section');
	containerTemplate.innerHTML = mangaReadingNotificationContainer;
	const customElementRegistry = window.customElements;
	customElementRegistry.define(
		'mrs-notification-container',
		class extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: 'open' }).appendChild(containerTemplate.cloneNode(true));
			}
		}
	);
	const outerFrame = document.createElement('mrs-notification-container');
	const shadowRoot = /** @type {ShadowRoot} */ (outerFrame.shadowRoot);
	const container = /** @type {HTMLDivElement} */ (shadowRoot.children[0]);
	const notificationList = /** @type {HTMLOListElement} */ (container.querySelector('ol'));

	notificationList.style.setProperty('--offset', '32px');
	notificationList.style.setProperty('--width', '356px');
	notificationList.style.setProperty('--gap', '14px');
	notificationList.style.setProperty('--border-radius', '8px');
	notificationList.style.setProperty('--z-index', '999999999');

	function initToastContainer() {
		debug('Initializing Toast Container.');
		for (let i = 0; i < nws.shadowRoot.children.length; i++) {
			const element = nws.shadowRoot.children[i];
			if (element.tagName.toLowerCase() === 'style') {
				shadowRoot.appendChild(element.cloneNode(true));
			}
		}
		debug('Initialized Toast Container.');
	}

	function insertToastContainer() {
		debug('Inserting Toast Container.');
		document.body.appendChild(outerFrame);
		debug('Inserted Toast Container.');
	}

	const notificationTemp = document.createElement('div');
	notificationTemp.innerHTML = mangaReadingNotification;
	const notificationElement = /** @type {HTMLDivElement} */ (notificationTemp.children[0]);
	const notificationButtonTemp = document.createElement('div');
	notificationButtonTemp.innerHTML = mangaReadingNotificationButton;
	const notificationButton = /** @type {HTMLDivElement} */ (notificationButtonTemp.children[0]);

	const temp = document.createElement('div');
	temp.innerHTML = mangaReadingConfig;
	const configElement = /** @type {HTMLDivElement} */ (temp.children[0]);

	const ui = {
		ptApiUrl: /** @type {HTMLInputElement} */ (
			configElement.querySelector('[data-mrs-pt-api-url]')
		),
		ptApiBearerToken: /** @type {HTMLInputElement} */ (
			configElement.querySelector('[data-mrs-pt-api-bearer-token]')
		),
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
		),
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

	function setPTUi() {
		ui.ptApiUrl.value = globals.ptApi.url;
		ui.ptApiBearerToken.value = globals.ptApi.bearerToken;
	}

	function atNeither() {
		return globals.site.at === 'neither';
	}

	function atChapter() {
		return globals.site.at === 'chapter';
	}

	function atManga() {
		return globals.site.at === 'manga';
	}

	function atChapterOrManga() {
		return atChapter() || atManga();
	}

	function getChapterList() {
		return /** @type {HTMLElement} */ (document.querySelector('div.chapter-list'));
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
		if (!globals.site.active || !atChapter()) {
			return;
		}

		const title = 'Image Width / %';
		const height = "'auto h' to fit images to page height,";
		const width = "'auto w' to fit images to page width.";
		const inp = prompt(`${title}\n${height}\n${width}`);
		const input = inp?.valueOf().toLowerCase();

		if (input === null || input === '0') {
			return;
		}

		const pageWidth = document.body.clientWidth;

		/** @type {Array<HTMLImageElement>} */
		const images = /** @type {any} */ (document.querySelectorAll('.container-chapter-reader img'));

		if (input === 'auto w' || input === 'w') {
			for (const image of images) {
				image.style.width = `${(pageWidth / image.width) * 100}%`;
			}

			return;
		}

		if (input === 'auto h' || input === 'h') {
			for (const image of images) {
				image.style.width = `${(pageWidth / image.width) * 100}%`;
				image.style.width = `${(window?.visualViewport?.height ?? 1 / image.height) * 100}%`;
			}

			return;
		}

		for (const image of images) {
			image.style.width = image.style.width = `${input}%`;
		}
	}

	function setSubTitle() {
		ui.subTitle.innerText = atChapterOrManga() ? globals.currentTitle : 'No title';
	}

	function registerConfig() {
		setSubTitle();

		ui.btnRemove.onclick = removeTitle;
		ui.btnRemove.disabled = atNeither();

		ui.btnAdd.onclick = addTitle;
		ui.btnAdd.disabled = atNeither();

		ui.btnReset.onclick = () => {
			ui.titleList.value = globals.titleList.join('\r\n');
		};

		ui.btnSave.onclick = () => {
			saveTitles();
			savePtApi();
		};

		nws.config.register(GM.info, configElement, () => {
			setTitleList();
			setPTUi();
			ui.btnRemove.disabled = atNeither();
			ui.btnAdd.disabled = atNeither();
		});
	}

	function addTitle() {
		const trimmedValue = ui.titleList.value.trim();
		const taTitleListValue = trimmedValue.split(/\r?\n/);

		if (taTitleListValue.includes(globals.currentTitle)) {
			return;
		}

		const curTAVal = trimmedValue.length > 0 ? `${trimmedValue}\r\n` : '';
		ui.titleList.value = curTAVal + globals.currentTitle;
	}

	async function saveTitles() {
		globals.titleList = [...new Set(ui.titleList.value.trim().split(/\r?\n/).sort())];
		await GM.setValue(key.titleList, JSON.stringify(globals.titleList));

		if (atChapter()) {
			removeMargins();
		}
	}

	async function savePtApi() {
		globals.ptApi.url = ui.ptApiUrl.value.trim();
		globals.ptApi.bearerToken = ui.ptApiBearerToken.value.trim();
		await GM.setValue(key.ptAPi, JSON.stringify(globals.ptApi));
	}

	function removeTitle() {
		const curTAVal = ui.titleList.value.trim();
		const regex = new RegExp(`${escapeRegExp(globals.currentTitle)}\\r?\\n?`, 'gi');
		ui.titleList.value = curTAVal.replace(regex, '');
	}

	function goToFirstChapter() {
		if (!globals.site.active) {
			return;
		}

		const firstChapter = /** @type {HTMLDivElement} */ (getChapterList().lastElementChild);
		const firstChapterLink = /** @type {HTMLAnchorElement | null} */ (
			firstChapter.querySelector('& > span > a')
		);

		if (firstChapterLink !== null) {
			setLocation(firstChapterLink.href);
		}
	}

	function goToLatestChapter() {
		if (!globals.site.active) {
			return;
		}

		const latestChapter = /** @type {HTMLDivElement} */ (getChapterList().firstElementChild);
		const latestChapterLink = /** @type {HTMLAnchorElement | null} */ (
			latestChapter.querySelector('& > span > a')
		);

		if (latestChapterLink !== null) {
			setLocation(latestChapterLink.href);
		}
	}

	function removeMargins() {
		if (!atChapter()) {
			return;
		}

		let margin = '5px auto 0';

		if (globals.titleList.includes(globals.currentTitle)) {
			margin = '0 auto';

			// setStyle(document.querySelectorAll('.container-chapter-reader > img'), 'display', 'none');
		}

		setStyle(document.querySelectorAll('.container-chapter-reader > img'), 'margin', margin);
	}

	function findUrls() {
		debug('Finding URLs...');

		/** @type {NodeListOf<HTMLAnchorElement>}*/
		const links = document.querySelectorAll(globals.site.titleLinkSelector);
		const titleLink = links[1];

		globals.currentTitle = titleLink?.innerText.trim().toLowerCase() ?? 'None';

		setSubTitle();

		if (!atChapter() || titleLink === undefined) {
			debug('Found URLs.');
			return;
		}

		const nextChapterLink = /** @type {HTMLAnchorElement | null}*/ (
			document.querySelector(globals.site.nextChapterSelector)
		);

		if (nextChapterLink) {
			globals.nextUrl = nextChapterLink.href;
		} else {
			globals.nextUrl = titleLink.href;
		}

		const prevChapterLink = /** @type {HTMLAnchorElement | null}*/ (
			document.querySelector(globals.site.prevChapterSelector)
		);

		if (prevChapterLink) {
			console.log(prevChapterLink);
			globals.prevUrl = prevChapterLink.href;
		} else {
			globals.prevUrl = titleLink.href;
		}

		debug('Found URLs.');
	}

	async function loadTitleList() {
		debug('Loading title list...');

		const value = await GM.getValue(key.titleList, JSON.stringify(defaults.titleList));
		globals.titleList = JSON.parse(value);

		debug('Loaded title list.');
	}

	async function loadPtApi() {
		debug('Loading progress tracker api...');

		const value = await GM.getValue(key.ptAPi, JSON.stringify({ url: '', bearerToken: '' }));
		globals.ptApi = JSON.parse(value);

		debug('Loaded progress tracker api.');
	}

	function manganatoSiteOverrides() {
		if (!globals.site.active) {
			return;
		}

		document.querySelector('body .comments')?.remove();
		document.querySelector('#fb-root')?.remove();
		const div = document.createElement('div');
		div.id = 'current-time';
		div.style.display = 'none';
		document.body.appendChild(div);
		document.querySelector('body > footer')?.remove();

		const containers = document.querySelectorAll('.ads-contain');
		containers.forEach((container) => container.remove());

		if (atChapter()) {
			const chapterContainer = document.querySelector('.container-chapter-reader');
			chapterContainer?.nextSibling?.remove();
			chapterContainer?.nextSibling?.remove();

			const removables = document.querySelectorAll(
				'body > div.info-top-chapter > p.info-top-chapter-text'
			);
			removables.forEach((removable) => removable.remove());
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
		const path = window.location.pathname;

		globals.site = globals.site;
		const atChapter = globals.site.atChapterRegex.test(path);
		const atManga = globals.site.atMangaRegex.test(path);

		switch (true) {
			case atChapter:
				globals.site.at = 'chapter';
				break;
			case atManga:
				globals.site.at = 'manga';
				break;
			default:
				globals.site.at = 'neither';
				break;
		}

		debug(`Set active site: ${globals.site.name}`);
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
				'div.panel_page_number > .group_page > a.page-select:not(.page_blue)'
			)
		);
		if (!pageSelected) return;

		const previous = /** @type {HTMLAnchorElement | null} */ (pageSelected.previousElementSibling);

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
					document.querySelectorAll('div.truyen-list > div.list-truyen-item-wrap')
				)
			),
		];

		if (genreAllItems.length > 0) {
			genreAllItemsIndex = 0;
			genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
		}
	}

	function genreAllOpenMangaInNewTab() {
		const anchor = /** @type {HTMLAnchorElement|null} */ (
			genreAllItems[genreAllItemsIndex].querySelector('.list-story-item')
		);

		if (anchor) {
			GM.openInTab(anchor.href, { active: false, insert: true });
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
			block: 'center',
		});

		window.getSelection()?.removeAllRanges();
	}

	/**
	 * @param {string} headersString
	 * @returns {Headers}
	 */
	function parseHeaders(headersString) {
		const headers = new Headers();
		const arr = headersString.trim().split('\n');
		for (const header of arr) {
			const [key, value] = header.split(':');
			headers.append(key, value);
		}
		return headers;
	}

	/**
	 * @param {string | URL | globalThis.Request} input
	 * @param {RequestInit | undefined} init
	 */
	async function nwsFetch(input, init = undefined) {
		const method = init?.method ?? 'GET';
		/** @type {{[key: string]: string}} */
		const headers = method !== 'GET' ? { 'content-type': 'application/json' } : {};

		if (init?.headers !== undefined) {
			if (init.headers instanceof Headers) {
				init.headers.forEach((value, key) => {
					headers[key.toLowerCase()] = value;
				});
			} else if (typeof init.headers === 'object') {
				for (const [key, value] of Object.entries(init.headers)) {
					headers[key.toLowerCase()] = value;
				}
			}
		}

		const resp = await GM.xmlHttpRequest({
			url: input.toString(),
			method,
			headers,
			timeout: 5000,
			responseType: 'json',
			anonymous: true,
			data: init?.body ?? undefined,
		});

		const respHeaders = parseHeaders(resp.responseHeaders);

		return new Response(resp.responseText, {
			status: resp.status,
			statusText: resp.statusText,
			headers: respHeaders,
		});
	}

	const shortcutHelpers = nws.shortcut.helpers;

	/** @typedef {{input: string; headers: HeadersInit}} Options */
	/** @typedef {{name: string; href: string}} PTBody */

	/**
	 * @param {Options} options
	 * @param {string | undefined} q
	 * @returns {Promise<Array<any>>}
	 */
	async function query(options, q = undefined) {
		try {
			const input = q !== undefined ? `${options.input}?q=${q}` : options.input;
			const response = await nwsFetch(input, {
				method: 'GET',
				headers: options.headers,
			});

			if (!response.ok) {
				console.error('Failed to fetch bookmarks');
				return [];
			}

			return response.json();
		} catch (e) {
			console.error('Failed to fetch bookmarks');
			console.error(e);
			return [];
		}
	}

	/**
	 * @param {Options} options
	 * @param {number} id
	 */
	async function remove(options, id) {
		try {
			const response = await nwsFetch(`${options.input}/${id}`, {
				method: 'DELETE',
				headers: options.headers,
			});

			if (!response.ok) {
				console.error('Failed to delete bookmark');
				return false;
			}
			return true;
		} catch (e) {
			console.error('Failed to delete bookmarks');
			console.error(e);
			return false;
		}
	}

	/**
	 * @param {Options} options
	 * @param {PTBody} body
	 */
	async function createOrUpdate(options, body) {
		try {
			console.log('Creating or updating bookmark', options.input, body);
			const response = await nwsFetch(options.input, {
				method: 'PUT',
				body: JSON.stringify(body),
				headers: options.headers,
			});

			if (!response.ok) {
				console.error('Failed to create or update bookmark');
				return { success: false, created: false };
			}

			try {
				/** @type {{success:boolean; created:boolean;}} */
				const json = await response.json();
				json.success = true;
				return json;
			} catch (e) {
				console.error('Failed to parse response');
				console.error(e);
				return { success: false, created: false };
			}
		} catch (e) {
			console.error('Failed to create or update bookmarks');
			console.error(e);
			return { success: false, created: false };
		}
	}

	/**
	 * @param {Options} options
	 * @param {number} id
	 * @param {boolean} finished
	 */
	async function check(options, id, finished) {
		try {
			const response = await nwsFetch(`${options.input}/${id}/check/${finished}`, {
				method: 'PUT',
				headers: options.headers,
			});

			if (!response.ok) {
				console.error('Failed to check bookmark');
				return false;
			}
			return true;
		} catch (e) {
			console.error('Failed to check bookmark');
			console.error(e);
			return false;
		}
	}

	function getProgressTrackerApi() {
		const baseUrl = globals.ptApi.url;
		const input = `${baseUrl}/bookmarks`;
		const bearerToken = globals.ptApi.bearerToken;
		const noBodyHeaders = new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${bearerToken}`,
		});
		const bodyHeaders = new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${bearerToken}`,
		});

		return { baseUrl, input, bearerToken, noBodyHeaders, bodyHeaders };
	}

	/**
	 * @returns {HTMLLIElement}
	 */
	function getNotificationElement() {
		return /** @type {any} */ (notificationElement.cloneNode(true));
	}

	/** @typedef {{text: string; onclick?: () => (Promise<void> | void); dismiss?: boolean;}} NotificationButton */

	/**
	 * @param {NotificationButton} options
	 * @returns {HTMLButtonElement}
	 */
	function getNotificationButtonElement(options) {
		const button = /** @type {HTMLButtonElement} */ (notificationButton.cloneNode(true));

		button.innerText = options.text;
		if (options.onclick) {
			button.onclick = options.onclick;
		}

		return button;
	}

	/** @typedef {{title: string; description?: string; autoDismiss?: boolean; buttons?: Array<NotificationButton>}} NotificationOptions */

	/**
	 * @param {NotificationOptions} options
	 */
	function htmlNotification(options) {
		const notification = getNotificationElement();

		/** @type {HTMLDivElement | null} */
		const title = notification.querySelector('[data-title]');
		/** @type {HTMLDivElement | null} */
		const description = notification.querySelector('[data-description]');
		/** @type {HTMLDivElement | null} */
		const content = notification.querySelector('[data-content]');

		if (title === null || description === null || content === null) {
			console.error('Notification elements not found.');
			return;
		}

		title.innerText = options.title;
		description.innerText = options.description ?? '';

		if (Array.isArray(options.buttons)) {
			for (const button of options.buttons) {
				const btn = getNotificationButtonElement(button);
				if (button.dismiss) {
					btn.onclick = () => {
						notification.remove();
						if (button.onclick) {
							button.onclick();
						}
					};
				}
				content.appendChild(btn);
			}
		}

		notificationList.appendChild(notification);

		if (options.autoDismiss === undefined || options.autoDismiss) {
			setTimeout(() => notification.remove(), 2500);
		}
	}

	/**
	 * @param {NotificationOptions} options
	 */
	function triggerNotification(options) {
		debug(options);
		setTimeout(htmlNotification, 0, options);
	}

	async function removeMangaFromProgressTracker() {
		const chapter = atChapter();
		const manga = atManga();
		const chapterOrManga = chapter || manga;

		if (!chapterOrManga) {
			return;
		}

		if (globals.ptApi.url === '' || globals.ptApi.bearerToken === '') {
			triggerNotification({
				title: 'Configuration Error',
				description: 'Progress Tracker API URL and Bearer Token must be set.',
			});
			return;
		}

		const { input, noBodyHeaders, bodyHeaders } = getProgressTrackerApi();

		const title = globals.currentTitle;

		const bookmarks = await query({ input, headers: noBodyHeaders }, title);

		if (bookmarks.length === 0) {
			return;
		}

		if (bookmarks.length === 1) {
			if (chapter) {
				const id = bookmarks[0].id;
				await remove({ input, headers: bodyHeaders }, id);
				triggerNotification({
					title: 'Bookmark Removed',
					description: title,
				});
			}
		} else {
			const bookmark = bookmarks.find((b) => b.name === title);

			if (bookmark === undefined) {
				triggerNotification({
					title: 'No bookmark found for title.',
					description: title,
				});
				return;
			}

			if (chapter) {
				const id = bookmark.id;
				await remove({ input, headers: bodyHeaders }, id);
				triggerNotification({
					title: 'Bookmark Removed',
					description: title,
				});
			}
		}
	}

	async function updateOrAddMangaToProgressTracker() {
		const chapter = atChapter();
		const manga = atManga();
		const chapterOrManga = chapter || manga;

		if (!chapterOrManga) {
			return;
		}

		if (globals.ptApi.url === '' || globals.ptApi.bearerToken === '') {
			triggerNotification({
				title: 'Configuration Error',
				description: 'Progress Tracker API URL and Bearer Token must be set.',
			});
			return;
		}

		const { input, bodyHeaders } = getProgressTrackerApi();
		const title = globals.currentTitle;

		/** @type {PTBody} */
		const body = {
			name: title.trim().toLocaleLowerCase(),
			href: window.location.href,
		};

		const result = await createOrUpdate({ input, headers: bodyHeaders }, body);

		if (!result.success) {
			return;
		}

		if (result.created) {
			triggerNotification({
				title: 'Bookmark created',
				description: title,
			});
		} else {
			triggerNotification({
				title: 'Bookmark updated',
				description: title,
			});
		}
	}

	/**
	 * @param {KeyboardEvent} e
	 * @returns {Promise<boolean>}
	 */
	async function configClosedShortcuts(e) {
		const chapter = atChapter();
		const manga = atManga();
		const chapterOrManga = chapter || manga;

		if (e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && chapter) {
			setLocation(globals.prevUrl);
			return true;
		}

		if (e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && manga) {
			goToLatestChapter();
			return true;
		}

		if (
			e.code === 'ArrowLeft' &&
			shortcutHelpers.noModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllGoToPage(e.code);
			return true;
		}

		if (e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && chapter) {
			setLocation(globals.nextUrl);
			return true;
		}

		if (e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && manga) {
			goToFirstChapter();
			return true;
		}

		if (
			e.code === 'ArrowRight' &&
			shortcutHelpers.noModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllGoToPage(e.code);
			return true;
		}

		if (
			e.code === 'ArrowUp' &&
			shortcutHelpers.shiftModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllBrowse(e.code);
			return true;
		}

		if (
			e.code === 'ArrowDown' &&
			shortcutHelpers.shiftModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllBrowse(e.code);
			return true;
		}

		if (
			e.code === 'ArrowLeft' &&
			shortcutHelpers.shiftModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllBrowse(e.code);
			return true;
		}

		if (
			e.code === 'ArrowRight' &&
			shortcutHelpers.shiftModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllBrowse(e.code);
			return true;
		}

		if (
			e.code === 'Enter' &&
			shortcutHelpers.shiftModifier(e) &&
			!chapterOrManga &&
			(window.location.pathname.startsWith('/genre/all') ||
				window.location.pathname.startsWith('/manga-list/latest-manga'))
		) {
			genreAllOpenMangaInNewTab();
			return true;
		}

		if (e.code === 'Quote' && shortcutHelpers.shiftModifier(e) && chapter) {
			resize();
			return true;
		}

		if (e.code === 'BracketLeft' && shortcutHelpers.shiftModifier(e) && chapterOrManga) {
			setTitleList();
			removeTitle();
			await saveTitles();
			return true;
		}

		if (e.code === 'BracketRight' && shortcutHelpers.shiftModifier(e) && chapterOrManga) {
			setTitleList();
			addTitle();
			await saveTitles();
			return true;
		}

		if (e.code === 'BracketLeft' && shortcutHelpers.altModifier(e) && chapterOrManga) {
			setTimeout(removeMangaFromProgressTracker, 0);
			return true;
		}

		if (e.code === 'BracketRight' && shortcutHelpers.altModifier(e) && chapterOrManga) {
			setTimeout(updateOrAddMangaToProgressTracker, 0);
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
			name: `${GM.info.script.name} - config closed`,
			callback: configClosedShortcuts,
		});
	}

	async function checkFirstRun() {
		debug('First run check...');
		const value = await GM.getValue(key.firstRun, true);
		if (value) {
			debug('First run detected.');
			GM.setValue(key.firstRun, false);
			GM.notification('First run setup complete', `NWS - ${GM.info.script.name}`);
		}
		debug('First run checked.');
	}

	async function onInit() {
		console.log(`NWS - ${GM.info.script.name} - Loading...`);
		await checkFirstRun();
		registerKeyUps();
		setActiveSite();
		await loadTitleList();
		await loadPtApi();
		findUrls();
		if (atChapter()) {
			removeMargins();
		}
		siteOverrides();
		console.log(`NWS - ${GM.info.script.name} - Loaded.`);
	}
	async function postInit() {
		console.log(`NWS - ${GM.info.script.name} - Post Loading...`);
		initToastContainer();
		insertToastContainer();
		console.log(`NWS - ${GM.info.script.name} - Post Loaded.`);
	}

	registerConfig();
	registerResources();
	nws.init(onInit, postInit);
}

mangaReadingScript();
