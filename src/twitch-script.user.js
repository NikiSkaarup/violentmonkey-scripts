// ==UserScript==
// @name        Click the claim button - twitch.tv
// @namespace   https://userscripts.skaarup.dev
// @match       https://www.twitch.tv/*
// @version     1.0
// @author      nws
// @run-at      document-end
// @grant       none
// @description remove distractions
// @updateURL   http://localhost:8732/scripts/twitch-script.user.js
// @downloadURL http://localhost:8732/scripts/twitch-script.user.js
// ==/UserScript==

// biome-ignore lint/suspicious/noRedundantUseStrict: ... I want to use strict mode
'use strict';

function twitchFix() {
	async function onReady() {
		setInterval(() => {
			/** @type {HTMLButtonElement | null} */
			const button = document.querySelector('button[aria-label="Claim Bonus"]');
			if (button !== null) {
				setTimeout((button) => button.click(), Math.random() * 900, button);
			}
		}, 1000);
	}

	async function ready() {
		if (document.readyState !== 'complete') {
			setTimeout(ready, 100);
			return;
		}
		await onReady();
	}
	ready();
}
twitchFix();
