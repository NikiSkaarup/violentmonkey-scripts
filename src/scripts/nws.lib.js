// @ts-ignore
import nwsLibFrame from '../templates/nws-lib-frame.html';

export default (() => {
	const focusableSelector =
		'a[href].nws, area[href].nws, input:not([disabled]).nws, select:not([disabled]).nws, textarea:not([disabled]).nws, button:not([disabled]).nws, [tabindex].nws, [contenteditable].nws';

	/** @type {configuration_ui.globalsType} */
	const configGlobals = {
		uiInitialized: false,
		configurationWindowOpen: false,
		debugging: false,
	};

	/** @type {stringKeyedObject} */
	const objects = {};
	/** @type {Array<resource>} */
	const styleResources = [
		{
			name: 'nwsLibCss',
			data: '',
			urls: [],
			universal: true,
			at: 'universal',
		},
	];
	/** @type {Array<resource>} */
	const jsonResources = [];
	/** @type {Array<resource>} */
	const scriptResources = [];

	const key = {
		firstRun: 'firstRun',
		debugging: 'debugging',
		dataAttr: 'data-nws-lib',
	};

	/**
	 * @param {string} tag
	 * @param {string | undefined} [className=undefined]
	 * @param {string | undefined} [innerHTML=undefined]
	 */
	function createHTMLElement(tag, className, innerHTML) {
		const element = document.createElement(tag);
		if (className) element.className = className;
		if (innerHTML) element.innerHTML = innerHTML;
		element.classList.add('nws');
		return element;
	}

	const frameTemplate = createHTMLElement('div', 'nws-lib-outer-frame');
	frameTemplate.innerHTML = nwsLibFrame;

	const customElementRegistry = window.customElements;
	customElementRegistry.define(
		'nws-lib-frame',
		class extends HTMLElement {
			constructor() {
				super();
				const shadowRoot = this.attachShadow({ mode: 'open' }).appendChild(
					frameTemplate.cloneNode(true),
				);
			}
		},
	);

	const outerFrame = document.createElement('nws-lib-frame');
	const shadowRoot = /** @type {ShadowRoot} */ (outerFrame.shadowRoot);
	const frame = /** @type {HTMLDivElement} */ (shadowRoot.children[0]);
	const backdrop = /** @type {HTMLDivElement} */ (frame.querySelector('[data-nws-lib-backdrop]'));
	backdrop.onclick = closeConfig;

	const subConfigTarget = /** @type {HTMLDivElement} */ (
		frame.querySelector('[data-nws-lib-sub-config-target]')
	);
	const debuggingCheckbox = /** @type {HTMLInputElement} */ (
		frame.querySelector('[data-nws-lib-debugging-checkbox]')
	);
	const closeConfigButtons = /** @type {Array<HTMLButtonElement>} */ (
		/** @type {any} */ (frame.querySelectorAll('[data-nws-lib-close]'))
	);

	for (const button of closeConfigButtons) {
		button.onclick = closeConfig;
	}

	// UI elements
	const ui = {
		backdrop,
		outerFrame,
		shadowRoot,
		frame,
		subConfigTarget,
		debuggingCheckbox,
	};

	/**
	 * @type {{
	 *   [key: string]: {
	 *     name: string;
	 *     container: HTMLElement;
	 *     callback: () => void;
	 *   };
	 * }}
	 * */
	const registeredConfigurations = {};

	/**
	 * @param {vm_infoType} info
	 * @param {HTMLElement} container
	 * @param {() => void} callback
	 */
	function registerConfig(info, container, callback) {
		registeredConfigurations[info.script.name] = {
			name: info.script.name,
			container,
			callback,
		};

		ui.subConfigTarget.appendChild(container);
	}

	/**
	 * @param {vm_infoType} info
	 */
	function unregisterConfig(info) {
		registeredConfigurations[info.script.name].container.remove();
		delete registeredConfigurations[info.script.name];
	}

	/**
	 * @param {unknown} message
	 * @param {string} name
	 */
	function externalDebug(message, name) {
		if (!configGlobals.debugging) return;
		switch (typeof message) {
			case 'object':
				console.log(`NWS - ${name}`);
				console.log(message);
				break;
			case 'string':
				console.log(`NWS - ${name} -`, message);
				break;
			case 'number':
				console.log(`NWS - ${name} -`, message);
				break;
			default:
				console.log(`NWS - ${name} -`, message);
		}
	}

	/**
	 * @param {unknown} message
	 */
	function debug(message) {
		if (!configGlobals.debugging) {
			return;
		}

		externalDebug(message, 'lib');
	}

	/**
	 * @param {boolean} value
	 */
	function setDebugging(value) {
		GM_setValue(key.debugging, value);
		configGlobals.debugging = value;
		console.log('NWS - lib - Debugging set to:', value);
	}

	/**
	 * @param {boolean} value
	 */
	function setConfigOpen(value) {
		configGlobals.configurationWindowOpen = value;
	}

	// Initializes configuration UI elements
	function initConfigUI() {
		ui.debuggingCheckbox.checked = configGlobals.debugging;
		ui.debuggingCheckbox.addEventListener('change', () => {
			configGlobals.debugging = ui.debuggingCheckbox.checked;
			setDebugging(configGlobals.debugging);
		});
	}

	function disableScrolling() {
		document.documentElement.style.top = `${-document.documentElement.scrollTop}px`;
		document.documentElement.style.position = 'fixed';
		document.documentElement.style.overflowY = 'scroll';
		document.body.style.overflowY = 'scroll';
		document.documentElement.style.width = '100vw';
	}

	function enableScrolling() {
		const scrollTop = Math.abs(Number.parseInt(document.documentElement.style.top, 10));
		document.documentElement.removeAttribute('style');
		document.body.removeAttribute('style');
		document.documentElement.scrollTop = scrollTop;
		document.body.scrollTop = scrollTop;
	}

	function openConfig() {
		setConfigOpen(true);

		if (!configGlobals.uiInitialized) {
			initConfigUI();
			configGlobals.uiInitialized = true;
		}

		for (const registered of Object.values(registeredConfigurations)) {
			registered.callback();
		}

		document.body.appendChild(outerFrame);

		disableScrolling();

		/** @type {HTMLInputElement | null} */ (shadowRoot.querySelector('input'))?.focus();
	}

	function closeConfig() {
		outerFrame.remove();
		setConfigOpen(false);
		enableScrolling();
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function tabSwitch(event) {
		const target = /** @type {HTMLElement} */ (event.target);
		const elements = /** @type {NodeListOf<HTMLElement>} */ (
			ui.frame.querySelectorAll(focusableSelector)
		);

		if (elements.length === 0) {
			return;
		}

		const firstElement = elements[0];
		const lastElement = elements[elements.length - 1];

		if (event.code === 'Tab' && event.shiftKey && target === firstElement) {
			event.preventDefault();
			setTimeout(() => lastElement.focus(), 0);
		} else if (event.code === 'Tab' && !event.shiftKey && target === lastElement) {
			event.preventDefault();
			setTimeout(() => firstElement.focus(), 0);
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function keydownEventListener(event) {
		if (event.code === 'Tab') {
			tabSwitch(event);
			return true;
		}

		if (event.code === 'Tab' && event.shiftKey) {
			tabSwitch(event);
			return true;
		}

		return false;
	}

	function attachFocusEvent() {
		debug('Attaching focus event...');
		ui.frame.addEventListener('keydown', keydownEventListener);
		debug('Attached focus events.');
	}

	/**
	 * @param {resource} resource
	 * @returns {boolean}
	 */
	function shouldLoad(resource) {
		return (
			resource.at === 'universal' ||
			resource.urls.find((url) => window.location.href.includes(url)) !== undefined
		);
	}

	/**
	 * @param {resource} resource
	 */
	function loadScript(resource) {
		resource.data = GM_getResourceText(resource.name);
		const script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('data-nws-lib-script', '');
		script.setAttribute('data-name', resource.name);
		script.innerHTML = resource.data;

		document.body.append(script);
	}

	/**
	 * @param {resource} resource
	 */
	function loadStyle(resource) {
		resource.data = GM_getResourceText(resource.name);
		const style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.setAttribute('data-nws-lib-style', '');
		style.setAttribute('data-name', resource.name);
		style.innerHTML = resource.data;

		if (resource.inline) {
			document.head.append(style);
		} else {
			shadowRoot.appendChild(style);
		}
	}

	/**
	 * @param {resource} resource
	 */
	function loadJSON(resource) {
		resource.data = GM_getResourceText(resource.name);
		objects[resource.name] = resource.data;
	}

	/**
	 * @param {resource} resource
	 * @param {resourceType} resourceType
	 */
	async function loadResource(resource, resourceType) {
		const loadResource =
			resource.shouldLoad !== undefined ? resource.shouldLoad(resource) : shouldLoad(resource);

		if (!loadResource) {
			debug(`Skipping ${resource.name} of type: ${resourceType}...`);
			return;
		}

		debug(`Loading resource: ${resource.name} of type: ${resourceType}...`);

		if (resourceType === 'scripts') {
			loadScript(resource);
		} else if (resourceType === 'stylesheets') {
			loadStyle(resource);
		} else if (resourceType === 'json') {
			loadJSON(resource);
		}

		debug(`Loaded resource: ${resource.name} of type: ${resourceType}.`);
	}

	/**
	 * @type {Array<{
	 *   resource: resource;
	 *   resourceType: resourceType;
	 * }>}
	 */
	const registeredResources = [];

	/**
	 * @param {resourceType} resourceType
	 * @param {Array<resource>} resources
	 */
	function registerResource(resourceType, ...resources) {
		for (const resource of resources) {
			registeredResources.push({ resource, resourceType });
		}
	}

	/**
	 * @param {string} name
	 */
	function unregisterResource(name) {
		const index = registeredResources.findIndex((registered) => registered.resource.name === name);
		if (index > -1) registeredResources.splice(index, 1);
	}

	function registerResources() {
		registerResource('stylesheets', ...styleResources);
		registerResource('json', ...jsonResources);
		registerResource('scripts', ...scriptResources);
	}

	async function loadResources() {
		debug('Loading resources...');
		for (const { resource, resourceType } of registeredResources) {
			await loadResource(resource, resourceType);
		}
		debug('Loaded resources.');
	}

	async function reloadResources() {
		debug('Reloading resources...');

		debug('Removing old resources...');

		const styles = [
			// @ts-ignore
			...document.head.querySelectorAll(`style[${key.dataAttr}]`),
		];
		for (const el of styles) {
			el.remove();
		}
		const stylesInShadowroot = [
			// @ts-ignore
			...shadowRoot.querySelectorAll(`style[${key.dataAttr}]`),
		];
		for (const el of stylesInShadowroot) {
			el.remove();
		}

		const scripts = [
			// @ts-ignore
			...document.body.querySelectorAll(`script[${key.dataAttr}]`),
		];
		for (const el of scripts) {
			el.remove();
		}
		debug('Removed old resources.');

		await loadResources();

		debug('Reloaded resources.');
	}
	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function noModifier(e) {
		return !(e.ctrlKey || e.altKey || e.shiftKey);
	}
	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function shiftModifier(e) {
		return e.shiftKey && !(e.ctrlKey || e.altKey);
	}
	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function ctrlModifier(e) {
		return e.ctrlKey && !(e.altKey || e.shiftKey);
	}
	/**
	 * @param {KeyboardEvent} e
	 * @returns {boolean}
	 */
	function altModifier(e) {
		return e.altKey && !(e.ctrlKey || e.shiftKey);
	}

	/**
	 * @param {KeyboardEvent} event
	 * @returns {boolean}
	 */
	function globalShortcuts(event) {
		switch (true) {
			case event.code === 'Backslash' && ctrlModifier(event):
				setDebugging(!configGlobals.debugging);
				ui.debuggingCheckbox.checked = configGlobals.debugging;
				return true;
			case event.code === 'Semicolon' && ctrlModifier(event):
				reloadResources();
				return true;
		}
		return false;
	}

	/**
	 * @param {KeyboardEvent} event
	 * @returns {boolean}
	 */
	function configOpenShortcuts(event) {
		if (event.code === 'Escape' && noModifier(event)) {
			closeConfig();
			return true;
		}
		return false;
	}

	/**
	 * @param {KeyboardEvent} event
	 * @returns {boolean}
	 */
	function configClosedShortcuts(event) {
		if (event.code === 'Slash' && ctrlModifier(event)) {
			openConfig();
			return true;
		}
		return false;
	}

	/** @type {Array<registeredShortcut>} */
	const registeredKeyUpShortCuts = [];

	/**
	 * @param {shortcutType} shortcutType
	 * @returns {registeredShortcut[]}
	 */
	function filterRegisteredShortcut(shortcutType) {
		return registeredKeyUpShortCuts.filter(
			(registered) => registered.shortcutType === shortcutType,
		);
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function keyupEventListener(event) {
		const shortcuts = [
			...filterRegisteredShortcut('Global'),
			...(configGlobals.configurationWindowOpen
				? filterRegisteredShortcut('ConfigOpen')
				: filterRegisteredShortcut('ConfigClosed')),
		];

		for (const registered of shortcuts) {
			if (registered.shortcut.callback(event)) {
				return;
			}
		}
	}

	function attachShortcutEvents() {
		debug('Attaching shortcut events...');
		document.addEventListener('keyup', keyupEventListener);
		debug('Attached shortcut events.');
	}

	/**
	 * @param {shortcutType} shortcutType
	 * @param {Array<shortcut>} shortcuts
	 */
	function registerKeyUp(shortcutType, ...shortcuts) {
		for (const shortcut of shortcuts) {
			registeredKeyUpShortCuts.unshift({ shortcutType, shortcut });
		}
	}

	/**
	 * @param {string} name
	 */
	function unregisterKeyUp(name) {
		const index = registeredKeyUpShortCuts.findIndex(
			(registered) => registered.shortcut.name === name,
		);
		if (index > -1) {
			registeredKeyUpShortCuts.splice(index, 1);
		}
	}

	function registerKeyUps() {
		const namePrefix = 'nwsLib';
		registerKeyUp('Global', {
			name: `${namePrefix} - global`,
			callback: globalShortcuts,
		});
		registerKeyUp('ConfigOpen', {
			name: `${namePrefix} - config open`,
			callback: configOpenShortcuts,
		});
		registerKeyUp('ConfigClosed', {
			name: `${namePrefix} - config closed`,
			callback: configClosedShortcuts,
		});
	}

	/**
	 * @param {() => Promise<void>} callback
	 * @param {() => Promise<void> | undefined} [postCallback=undefined]
	 */
	async function onInit(callback, postCallback = undefined) {
		try {
			setDebugging(GM_getValue(key.debugging, false));
			console.log(`NWS - lib - ${GM_info.script.name} - Loading...`);
			GM_registerMenuCommand(`Configure ${GM_info.script.name}`, () => {
				openConfig();
			});
			registerKeyUps();
			registerResources();
			attachFocusEvent();
			attachShortcutEvents();
			console.log(`NWS - lib - ${GM_info.script.name} - Loaded.`);
			await callback();
			await loadResources();
			if (postCallback !== undefined) {
				await postCallback();
			}
		} catch (e) {
			console.log('NWS - lib - Error:', e);
		}
	}

	/**
	 * @param {() => Promise<void>} callback
	 * @param {() => Promise<void> | undefined} [postCallback=undefined]
	 */
	async function init(callback, postCallback = undefined) {
		console.log('NWS - lib - Initializing...');
		switch (document.readyState) {
			case 'complete':
				await onInit(callback, postCallback);
				break;
			case 'interactive':
				await onInit(callback, postCallback);
				break;
			case 'loading':
				setTimeout(init, 10, callback, postCallback);
				break;
		}
	}

	return {
		config: {
			register: registerConfig,
			unregister: unregisterConfig,
			isOpen: () => configGlobals.configurationWindowOpen,
		},
		resources: {
			register: registerResource,
			unregister: unregisterResource,
		},
		shortcut: {
			keyUp: {
				register: registerKeyUp,
				unregister: unregisterKeyUp,
			},
			helpers: {
				noModifier,
				shiftModifier,
				ctrlModifier,
				altModifier,
			},
		},
		createHTMLElement,
		outerFrame,
		shadowRoot,
		frame,
		debug: externalDebug,
		init,
	};
})();
