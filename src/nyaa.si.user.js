// ==UserScript==
// @name        nyaa.si
// @namespace   https://userscripts.skaarup.dev
// @resource    configuration-ui http://localhost:8732/styles/configuration-ui.css
// @resource    nyaa.siOverrides http://localhost:8732/styles/nyaa.si-overrides.css
// #@icon        http://localhost:8732/usericons/nyaa.si-icon.png
// @homepageURL https://skaarup.dev/userscripts
// @updateURL   http://localhost:8732/scripts/nyaa.si.user.js
// @downloadURL http://localhost:8732/scripts/nyaa.si.user.js
// @match       https://nyaa.si/*
// @grant       none
// @version     1.0
// @author      nws
// @description Nyaa.si features
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

import nws from './nws.lib';

function initScript() {
	/**
	 * @param {unknown} message
	 */
	function debug(message) {
		nws.debug(message, GM_info.script.name);
	}

	/** @type {Array<manga_reading.resourceType>} */
	const styleResources = [
		{
			name: 'nyaa.siOverrides',
			data: '',
			urls: ['https://nyaa.si'],
			at: 'site',
			site: 'global',
			shouldLoad: () => true
		}
	];
	/** @type {Array<manga_reading.resourceType>} */
	const jsonResources = [];
	/** @type {Array<manga_reading.resourceType>} */
	const scriptResources = [];

	const key = {
		firstRun: 'firstRun',
		dataAttr: 'data-nws-nyaa-si-script'
	};

	/**
	 * @param {string} url
	 */
	function setLocation(url) {
		window.location = /** @type {(string & Location)} */ (url);
	}

	function registerConfig() {
		const subContainer = /** @type {HTMLDivElement} */ (
			nws.createHTMLElement('div', 'nws-sub-container-content')
		);
		const title = /** @type {HTMLParagraphElement} */ (
			nws.createHTMLElement('p', 'nws-current-title nws-border-bottom')
		);
		title.innerText = `${GM_info.script.name} version ${GM_info.script.version} configuration`;
		subContainer.appendChild(title);

		nws.config.register(GM_info, subContainer, () => {
			// callback!
		});
	}

	function siteOverrides() {
		debug('Applying site overrides...');
		// site overrides
		document.body.classList.add('dark');
		debug('Applied site overrides.');
	}

	const shortcutHelpers = nws.shortcut.helpers;

	/** @type {HTMLTableRowElement} */
	let current;

	const getFirstRow = () => {
		const rows = /** @type {NodeListOf<HTMLTableRowElement>} */ (
			document.querySelectorAll(
				'table.table.table-bordered.table-hover.table-striped.torrent-list > tbody > tr'
			)
		);
		return rows[0];
	};

	/**
	 * @param {'up' | 'down'} direction
	 */
	function getRow(direction) {
		let row = current;
		if (!row) {
			row = getFirstRow();
			return row;
		}
		row.classList.remove('nws-selected-row');
		if (direction === 'up') {
			row = /** @type {HTMLTableRowElement} */ (row.previousElementSibling);
		}
		if (direction === 'down') {
			row = /** @type {HTMLTableRowElement} */ (row.nextElementSibling);
		}
		if (!row) {
			row = current;
		}
		row.classList.add('nws-selected-row');
		row.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		window.getSelection()?.removeAllRanges();
		return row;
	}

	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function configClosedShortcuts(e) {
		switch (true) {
			case e.code === 'ArrowLeft' && shortcutHelpers.shiftModifier(e):
				e.preventDefault();
				if (
					!document
						.querySelector('nav > ul.pagination > li:first-child > a')
						?.classList.contains('disabled')
				) {
					setLocation(
						/** @type {HTMLAnchorElement} */ (
							document.querySelector('nav > ul.pagination > li:first-child > a')
						).href
					);
				}
				debug('ArrowLeft');
				return true;
			case e.code === 'ArrowRight' && shortcutHelpers.shiftModifier(e):
				e.preventDefault();
				if (
					!document
						.querySelector('nav > ul.pagination > li:last-child > a')
						?.classList.contains('disabled')
				) {
					setLocation(
						/** @type {HTMLAnchorElement} */ (
							document.querySelector('nav > ul.pagination > li:last-child > a')
						).href
					);
				}
				debug('ArrowRight');
				return true;
			case e.code === 'ArrowUp' && shortcutHelpers.shiftModifier(e):
				e.preventDefault();
				debug('ArrowUp');
				current = getRow('up');
				return true;
			case e.code === 'ArrowDown' && shortcutHelpers.shiftModifier(e):
				e.preventDefault();
				debug('ArrowDown');
				current = getRow('down');
				return true;
			case e.code === 'Enter' && shortcutHelpers.shiftModifier(e):
				e.preventDefault();
				debug('Enter');
				return true;
		}

		return false;
	}

	const registerResources = async () => {
		nws.resources.register('stylesheets', ...styleResources);
		nws.resources.register('json', ...jsonResources);
		nws.resources.register('scripts', ...scriptResources);
	};

	const registerKeyUps = () => {
		const namePrefix = GM_info.script.name;
		nws.shortcut.keyUp.register('ConfigClosed', {
			name: `${namePrefix} - config closed`,
			callback: configClosedShortcuts
		});
	};

	const checkFirstRun = () => {
		debug('First run check...');
		const firstRun = GM_getValue(key.firstRun, true);

		if (firstRun) {
			debug('First run detected.');
			GM_setValue(key.firstRun, false);

			GM_notification('First run setup complete', `NWS - ${GM_info.script.name}`);
		}
		debug('First run checked.');
	};

	const onInit = async () => {
		console.log(`NWS - ${GM_info.script.name} - Loading...`);
		checkFirstRun();
		registerKeyUps();
		siteOverrides();
		console.log(`NWS - ${GM_info.script.name} - Loaded.`);
	};

	registerConfig();
	registerResources();
	nws.init(onInit);
}

initScript();
