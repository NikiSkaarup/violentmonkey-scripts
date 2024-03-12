// ==UserScript==
// @name        floatplane script
// @namespace   https://userscripts.skaarup.dev
// @resource    configuration-ui http://localhost:8732/styles/configuration-ui.css
// #@icon        http://localhost:8732/usericons/floatplane-script-icon.png
// @homepageURL http://localhost:8732/userscripts
// @updateURL   http://localhost:8732/scripts/floatplane-script.user.js
// @downloadURL http://localhost:8732/scripts/floatplane-script.user.js
// #@require     http://localhost:8732/userlibs/nws.lib.js
// @match       https://*floatplane.com/*
// @grant       none
// @version     1.0
// @author      nws
// @description improve the floatplane experience
// @grant       GM_info
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @inject-into content
// @run-at      document-start
// @noframes
// ==/UserScript==

/*
  TODO: Update configurations with options stored in GM_setValue and GM_getValue
    TODO: checkbox, Check for new videos
    TODO: checkbox, Check if live
    TODO: textarea, with creators to check for new videos
    TODO: textarea, with creators to check for if live
    TODO: checkbox, Modifying /live chat
    TODO: checkbox, Modifying /live stream
    TODO: checkbox, Modifying /post/ video
    TODO: input, last notified video id
  TODO: Update to show if a creator is live in sidebar
*/

import nws from './nws.lib.js';

function floatplaneScript2() {
	/**
	 * @param {unknown} message
	 */
	function debug(message) {
		nws.debug(message, GM_info.script.name);
	}
	/** @type {Array<resource>} */
	const styleResources = [];
	/** @type {Array<resource>} */
	const jsonResources = [];
	/** @type {Array<resource>} */
	const scriptResources = [];

	const key = {
		firstRun: 'firstRun',
		dataAttr: 'data-nws-floatplane-script'
	};

	/** @type {Array<string>} */
	const videoIds = [];
	const baseUrl = 'https://www.floatplane.com/post/';
	const checkUrl = 'https://www.floatplane.com/api/v3/content/creator/list';
	const limit = 'limit=20';
	/** @type {Array<string>} */
	const ids = ['59f94c0bdd241b70349eb72b', '5d48c7be5fa46b731f1d5885'];

	/** @type {Set<string>} */
	const notifiedAboutLive = new Set();

	/**
	 * @param {HTMLAnchorElement} anchor
	 * @returns {string}
	 */
	function getPostedKey(anchor) {
		return anchor.href.replace(baseUrl, '');
	}

	function registerConfig() {
		const subContainer = nws.createHTMLElement('div', 'nws-sub-container-content');
		const title = nws.createHTMLElement('p', 'nws-current-title nws-border-bottom');
		title.innerText = `${GM_info.script.name} version ${GM_info.script.version} configuration`;
		subContainer.appendChild(title);

		nws.config.register(GM_info, subContainer, () => {
			// placeholder
		});
	}

	/**
	 *
	 * @param {string} querySelector
	 * @param {(element: HTMLElement) => unknown} callback
	 * @param {number | undefined} [timeoutMS=undefined]
	 */
	async function waitForElementToExist(querySelector, callback, timeoutMS) {
		debug(`waitForElementToExist: ${querySelector}`);
		const executeCheck = () => {
			const element = /** @type {HTMLElement} */ (document.querySelector(querySelector));
			const timeout = setTimeout(executeCheck, timeoutMS ?? 100);
			if (!element) return;
			clearTimeout(timeout);
			callback(element);
			debug(`waitForElementToExist: ${querySelector} exist...`);
		};
		executeCheck();
	}

	function configuringLiveVideo() {
		const liveStreamView = /** @type {HTMLElement | null} */ (
			document.querySelector('div.route-wrapper.livestream-view')
		);
		if (liveStreamView === null) return;
		liveStreamView.style.display = 'grid';
		liveStreamView.style.gridTemplateColumns = '1fr 400px';
		liveStreamView.style.paddingRight = '0';

		const liveScrollWrapper = /** @type {HTMLElement | null} */ (
			liveStreamView.querySelector('div.live-scroll-wrapper')
		);
		if (liveScrollWrapper === null) return;
		liveScrollWrapper.style.flexShrink = '0';

		const playerContainer = /** @type {HTMLElement | null} */ (
			liveScrollWrapper.querySelector('div.player-container.livestream')
		);
		if (playerContainer === null) return;
		playerContainer.style.width = 'auto';
		playerContainer.style.maxWidth = '100%';
		playerContainer.style.maxHeight = '100vh';

		const innerContainer = /** @type {HTMLElement | null} */ (
			playerContainer.querySelector('div.inner-container')
		);
		if (innerContainer === null) return;
		innerContainer.style.paddingBottom = '0';
		innerContainer.style.overflow = 'auto';

		const streamContainer = /** @type {HTMLElement | null} */ (
			innerContainer.querySelector('div.stream-container')
		);
		if (streamContainer === null) return;
		streamContainer.style.position = 'relative';

		const videoJS = /** @type {HTMLElement | null} */ (
			streamContainer.querySelector('div[aria-label="video player"]')
		);
		if (videoJS === null) return;
		videoJS.style.paddingTop = '0';
		videoJS.style.height = 'auto';
		videoJS.style.backgroundColor = 'transparent';

		const video = /** @type {HTMLElement | null} */ (videoJS.querySelector('video.vjs-tech'));
		if (video === null) return;
		video.style.position = 'relative';
		video.style.top = 'unset';
		video.style.left = 'unset';
		video.style.display = 'block';
		video.style.maxHeight = '100vh';
	}

	/**
	 * @param {HTMLElement} liveChatWrapper
	 */
	function configuringLiveChat(liveChatWrapper) {
		liveChatWrapper.style.width = '100%';
		liveChatWrapper.style.height = '100vh';

		const chatInputContainer = /** @type {HTMLElement | null} */ (
			liveChatWrapper.querySelector(
				'div.chat-view-container.chat-messages-container > div.chat-input-container'
			)
		);
		if (chatInputContainer === null) return;
		chatInputContainer.style.height = '65px';
		chatInputContainer.style.display = 'flex';
		chatInputContainer.style.flexFlow = 'row nowrap';
		chatInputContainer.style.padding = '8px 0 0 8px';
		chatInputContainer.style.gap = '4px';

		const iconSelf = /** @type {HTMLElement | null} */ (
			chatInputContainer.querySelector('div.icon-self')
		);
		if (iconSelf === null) return;
		iconSelf.style.height = '20px';
		iconSelf.style.width = '20px';
		iconSelf.style.position = 'relative';
		iconSelf.style.left = 'unset';
		iconSelf.style.bottom = 'unset';

		const chatInput = /** @type {HTMLElement | null} */ (
			chatInputContainer.querySelector('textarea.chat-input')
		);
		if (chatInput === null) return;
		chatInput.style.fontSize = '16px';
		chatInput.style.height = '60px';
		chatInput.style.marginTop = '0';
		chatInput.style.paddingLeft = '0';

		const hintContainer = /** @type {HTMLElement | null} */ (
			chatInputContainer.querySelector('div.hint-container')
		);
		if (hintContainer === null) return;
		hintContainer.remove();
	}

	const setupLive = () => {
		if (!window.location.href.includes('/live')) return;
		waitForElementToExist('div.live-chat-wrapper', configuringLiveChat);
		waitForElementToExist('video.vjs-tech', configuringLiveVideo);
	};

	const configuringVideo = () => {
		const routeWrapper = /** @type {HTMLElement | null} */ (
			document.querySelector('div.route-wrapper')
		);
		if (routeWrapper === null) return;
		routeWrapper.style.display = 'grid';
		routeWrapper.style.gridTemplateColumns = '1fr';

		const playerContainer = /** @type {HTMLElement | null} */ (
			routeWrapper.querySelector('div.player-container')
		);
		if (playerContainer === null) return;
		playerContainer.style.width = 'auto';
		playerContainer.style.maxWidth = '100%';
		playerContainer.style.maxHeight = '100vh';

		const innerContainer = /** @type {HTMLElement | null} */ (
			playerContainer.querySelector('div.inner-container')
		);
		if (innerContainer === null) return;
		innerContainer.style.paddingBottom = '0';
		innerContainer.style.overflow = 'auto';

		const videoJS = /** @type {HTMLElement | null} */ (
			innerContainer.querySelector('div[aria-label="video player"]')
		);
		if (videoJS === null) return;
		videoJS.style.paddingTop = '0';
		videoJS.style.height = 'auto';
		videoJS.style.backgroundColor = 'transparent';

		setTimeout(() => {
			const interval = setInterval(() => {
				const video = /** @type {HTMLElement | null} */ (
					videoJS.querySelector('video.vjs-tech')
				);
				if (video === null || video.style.position === 'relative') return;
				video.style.position = 'relative';
				video.style.left = 'unset';
				video.style.bottom = 'unset';
				video.style.display = 'block';
				video.style.maxHeight = '100vh';
				clearInterval(interval);
			}, 100);
		}, 1000);
	};

	const setupVideo = () => {
		if (!window.location.href.includes('/post/')) return;
		debug('Setting up video...');
		waitForElementToExist('video.vjs-tech', configuringVideo);
		debug('Set up video.');
	};

	const defaultOptions = {
		title: 'Floatplane: ',
		videos: 'Uploaded @@ new videos',
		live: 'Is currently live',
		noLongerLive: 'Is no longer live'
	};

	const baseOptions = {
		image: 'https://pbs.floatplane.com/icons/favicon-196x196.png'
	};

	/**
	 * @param {floatplane.creator} creator
	 */
	function notLive(creator) {
		if (notifiedAboutLive.has(creator.id)) {
			notifiedAboutLive.delete(creator.id);
			const options = {
				...baseOptions,
				title: `${defaultOptions.title}${creator.title}`,
				text: defaultOptions.noLongerLive
			};
			GM_notification(options);
		}
	}

	/**
	 * @param {floatplane.creator} creator
	 */
	function live(creator) {
		if (notifiedAboutLive.has(creator.id)) return;
		notifiedAboutLive.add(creator.id);
		const options = {
			...baseOptions,
			title: `${defaultOptions.title}${creator.title}`,
			text: defaultOptions.live
		};
		GM_notification(options);
	}

	/**
	 * @param {floatplane.listResponse} list
	 */
	async function checkIfLive(list) {
		const creators = list.blogPosts
			.map((item) => item.creator)
			.reduce((acc, curr) => {
				if (acc.find((creator) => creator.id === curr.id)) return acc;

				acc.push(curr);
				return acc;
			}, /** @type {Array<floatplane.creator>} */ ([]));

		for (const creator of creators) {
			if (creator.liveStream.offline) {
				notLive(creator);
				continue;
			}
			live(creator);
		}
	}

	/**
	 * @param {floatplane.listResponse} list
	 */
	async function checkForNewVideos(list) {
		const index = list.blogPosts.findIndex((blogPost) => videoIds.includes(blogPost.id));

		if (index === -1) return;
		const newList = list.blogPosts.slice(0, index);
		if (newList.length === 0) return;

		/** @type {{ [key: string]: string[] }} */
		const creatorsWithIds = {};

		for (const blogPost of newList) {
			videoIds.push(blogPost.id);
			creatorsWithIds[blogPost.creator.title] = creatorsWithIds[blogPost.creator.title] || [];
			creatorsWithIds[blogPost.creator.title].push(blogPost.id);
		}

		for (const creatorName in creatorsWithIds) {
			const options = {
				...baseOptions,
				title: `${defaultOptions.title}${creatorName}`,
				text: defaultOptions.videos.replace(
					'@@',
					creatorsWithIds[creatorName].length.toString()
				)
			};
			GM_notification(options);
		}
	}

	async function fetchList() {
		const idList = ids.map((value, index) => `ids[${index}]=${value}`).join('&');
		const url = `${checkUrl}?${idList}&${limit}`;
		const resp = await fetch(url);
		if (resp.status !== 200) return;

		/** @type {floatplane.listResponse} */
		const list = await resp.json();
		checkForNewVideos(list);
		checkIfLive(list);
	}

	/**
	 * @param {HTMLElement} feed
	 */
	function checkers(feed) {
		const latestFeedItem = /** @type {HTMLAnchorElement | null} */ (
			feed.querySelector('div.ReactElementGridItem > a.ReactPostTile.video')
		);
		if (latestFeedItem === null) return;
		const key = getPostedKey(latestFeedItem);
		videoIds.push(key);
		setInterval(fetchList, 5 * 60 * 1000);
	}

	function setupCheckers() {
		if (window.location.href !== 'https://www.floatplane.com/') return;
		waitForElementToExist('div.ReactVideoFeed.grid', checkers);
	}

	async function registerResources() {
		nws.resources.register('stylesheets', ...styleResources);
		nws.resources.register('json', ...jsonResources);
		nws.resources.register('scripts', ...scriptResources);
	}

	function checkFirstRun() {
		debug('First run check...');
		const firstRun = GM_getValue(key.firstRun, true);

		if (firstRun) {
			debug('First run detected.');
			GM_setValue(key.firstRun, false);

			GM_notification('First run setup complete', `NWS - ${GM_info.script.name}`);
		}
		debug('First run checked.');
	}

	async function onInit() {
		console.log(`NWS - ${GM_info.script.name} - Loading...`);
		checkFirstRun();
		setupCheckers();
		setupLive();
		setupVideo();
		console.log(`NWS - ${GM_info.script.name} - Loaded.`);
	}

	registerConfig();
	registerResources();
	nws.init(onInit);
}
floatplaneScript2();
