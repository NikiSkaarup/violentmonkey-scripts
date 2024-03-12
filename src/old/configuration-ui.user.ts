// ==UserScript==
// @name          Configuration UI
// @namespace     https://skaarup.dev
// #@resource      stylesheet http://localhost:8432/styles/configuration-ui.css
// #@resource      stylesheet https://skaarup.dev/userstyles/configuration-ui.css
// #@icon          https://skaarup.dev/usericons/configuration-ui-icon.png
// @homepageURL   https://skaarup.dev/userscripts
// @updateURL     http://localhost:8432/configuration-ui.user.js
// @downloadURL   http://localhost:8432/configuration-ui.user.js
// #@updateURL     https://skaarup.dev/userscripts/manga-reading-script.user.js
// #@downloadURL   https://skaarup.dev/userscripts/manga-reading-script.user.js
// @match         *://*/*
// @exclude-match *://localhost:*/*
// @exclude-match *://127.0.0.1:*/*
// @grant         none
// @version       1.0.1
// @author        nws
// @description   Configuration UI for NWS scripts
// @grant         GM_info
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_getResourceText
// @grant         GM_registerMenuCommand
// @grant         GM_notification
// @grant         GM_xmlhttpRequest
// @run-at        document-start
// @inject-into   content
// @noframes
// ==/UserScript==

/*
  TODO: Turn into a library that can be used by other scripts
  TODO: Upload to github or something
  TODO: update / replace old object resources when reloading resources
*/

'use strict';

const nwsConfigurationUI = () => {
  const focusableSelector = 'a[href].nws, area[href].nws, input:not([disabled]).nws, select:not([disabled]).nws, textarea:not([disabled]).nws, button:not([disabled]).nws, [tabindex].nws, [contenteditable].nws';

  const globals: configuration_ui.globalsType = {
    uiInitialized: false,
    configurationWindowOpen: false,
    debugging: true,
  };

  const objects: stringKeyedObject = {};
  const styleResources: resource[] = [
    {
      name: 'stylesheet',
      urls: [],
      url: 'http://localhost:8432/styles/configuration-ui.css',
      universal: true,
      at: 'universal',
    },
  ];
  const jsonResources: resource[] = [];
  const scriptResources: resource[] = [];

  const key = {
    firstRun: 'firstRun',
    debugging: 'debugging',
    dataAttr: 'data-nws-configuration-ui',
  }

  const createElement = <t>(tag: string, className?: string, innerHTML?: string): t => {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    element.classList.add('nws');
    return element as unknown as t;
  }

  const createHTMLElement = (tag: string, className?: string, innerHTML?: string): HTMLElement => {
    return createElement<HTMLElement>(tag, className, innerHTML);
  }

  // UI elements
  const ui = {
    configurationWindowContainer: createHTMLElement('div', 'nws-configuration-window-container'),
    configurationWindow: createHTMLElement('div', 'nws-configuration-window'),
    header: createHTMLElement('h1', 'nws-header'),
    configurationWindowSubContainer: createHTMLElement('div', 'nws-sub-container nws-sub-container-extra'),
    backdrop: createHTMLElement('div', 'nws-backdrop'),
    debuggingCheckbox: createElement<HTMLInputElement>('input', 'nws-checkbox'),
    btnClose: createHTMLElement('button', 'nws-button nws-button-close'),
  };

  const registeredConfigurations: { [key: string]: { name: string, container: HTMLElement, callback: () => void } } = {};

  const registerConfig = (info: vm_infoType, container: HTMLElement, callback: () => void) => {
    registeredConfigurations[info.script.name] = {
      name: info.script.name,
      container,
      callback,
    };
    ui.configurationWindowSubContainer.appendChild(container);
  };

  const unregisterConfig = (info: vm_infoType) => {
    registeredConfigurations[info.script.name].container.remove();
    delete registeredConfigurations[info.script.name];
  };

  const debugTyped: debugType = (message: unknown, info: vm_infoType): void => {
    if (!globals.debugging) return;
    switch (typeof message) {
      case 'object':
        console.log(`NWS - ${info.script.name}`);
        console.log(message);
        break;
      case 'string':
        console.log(`NWS - ${info.script.name} -`, message);
        break;
      case 'number':
        console.log(`NWS - ${info.script.name} -`, message);
        break;
      default:
        console.log(`NWS - ${info.script.name} -`, message);
    }
  };

  const debug = (message: unknown): void => debugTyped(message, GM_info);

  const setDebugging = (value: boolean): void => {
    GM_setValue<boolean>(key.debugging, value);
    globals.debugging = value;
    if (unsafeWindow.nws) unsafeWindow.nws.debugging = value;
    console.log('NWS - Debugging set to:', value);
  }

  const setConfigOpen = (value: boolean) => {
    globals.configurationWindowOpen = value;
    if (unsafeWindow.nws) unsafeWindow.nws.configOpen = value;
  }

  // Initializes configuration UI elements
  const initConfigUI = () => {
    ui.header.innerText = 'NWS - Configuration UI';
    ui.configurationWindow.appendChild(ui.header);

    const subContainer = createHTMLElement('div', 'nws-sub-container');
    ui.configurationWindow.appendChild(subContainer);

    const subContainerContent = createHTMLElement('div', 'nws-sub-container-content');
    subContainer.appendChild(subContainerContent);

    const debuggingInputId = 'nws-debugging-checkbox';
    const debugging = createHTMLElement('div', 'nws-form-group');
    subContainerContent.appendChild(debugging);
    const debuggingLabel = createElement<HTMLLabelElement>('label', 'nws-label');
    debuggingLabel.innerText = 'Debugging:';
    debuggingLabel.htmlFor = debuggingInputId;
    debugging.appendChild(debuggingLabel);
    const debuggingCheckboxContainer = createHTMLElement('div', 'nws-checkbox-container');
    debuggingLabel.appendChild(debuggingCheckboxContainer);
    ui.debuggingCheckbox.type = 'checkbox';
    ui.debuggingCheckbox.id = debuggingInputId;
    ui.debuggingCheckbox.checked = globals.debugging;
    ui.debuggingCheckbox.addEventListener('change', (event) => {
      globals.debugging = (event.target as HTMLInputElement).checked;
      setDebugging(globals.debugging);
    });
    debuggingCheckboxContainer.appendChild(ui.debuggingCheckbox);

    const namespaceURI = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespaceURI, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(namespaceURI, 'path');
    path.setAttribute('d', 'M1.73,12.91 8.1,19.28 22.79,4.59');
    svg.appendChild(path);
    debuggingCheckboxContainer.appendChild(svg);
    // const svgTemplate = createElement<HTMLTemplateElement>('template');
    // svgTemplate.innerHTML = `<svg class="nws" viewBox="0 0 24 24"><path d="M1.73,12.91 8.1,19.28 22.79,4.59"></path></svg>`;
    // if (svgTemplate.content.firstElementChild === null) return;
    // debuggingCheckboxContainer.appendChild(svgTemplate.content.firstElementChild);

    // Configuration window sub container
    ui.configurationWindow.appendChild(ui.configurationWindowSubContainer);
    // /Configuration window sub container

    const footer = createHTMLElement('div', 'nws-footer');
    ui.configurationWindow.appendChild(footer);

    const footerHeading = createHTMLElement('h2', 'nws-footer-heading');
    footerHeading.innerText = 'These settings are stored in each scripts own values';
    footer.appendChild(footerHeading);

    const divButtons = createHTMLElement('div', 'nws-buttons-container');
    footer.appendChild(divButtons);
    const divSubButtons = createHTMLElement('div', 'nws-sub-buttons-container');
    divButtons.appendChild(divSubButtons);

    ui.btnClose.innerText = 'Close';
    ui.btnClose.onclick = closeConfig;
    divSubButtons.appendChild(ui.btnClose);

    ui.configurationWindowContainer.onclick = (event) => {
      if (event.target === ui.configurationWindowContainer) closeConfig();
    };
    ui.configurationWindowContainer.appendChild(ui.configurationWindow);
  }

  const disableScrolling = () => {
    document.documentElement.style.top = -(document.documentElement.scrollTop) + 'px';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.overflowY = 'scroll';
    document.body.style.overflowY = 'scroll';
    document.documentElement.style.width = '100vw';
  }

  const enableScrolling = () => {
    const scrollTop = Math.abs(parseInt(document.documentElement.style.top, 10));
    document.documentElement.removeAttribute('style');
    document.body.removeAttribute('style');
    document.documentElement.scrollTop = scrollTop;
    document.body.scrollTop = scrollTop;
  }

  const openConfig = () => {
    setConfigOpen(true);

    if (!globals.uiInitialized) {
      initConfigUI();
      globals.uiInitialized = true;
    }
    document.body.appendChild(ui.backdrop);
    for (const registered of Object.values(registeredConfigurations)) {
      registered.callback();
    }
    document.body.appendChild(ui.configurationWindowContainer);
    disableScrolling();
    document.querySelector<HTMLElement>('.nws input')?.focus();
  }

  const closeConfig = () => {
    ui.configurationWindowContainer.remove();
    ui.backdrop.remove();
    setConfigOpen(false);
    enableScrolling();
  }

  const configOpenSwitch = (event: KeyboardEvent) => {
    if (!globals.configurationWindowOpen) return false;
    switch (true) {
      case event.code === 'Escape':
        closeConfig();
        return true;
    }
    return false;
  };

  const configClosedSwitch = (event: KeyboardEvent) => {
    if (globals.configurationWindowOpen) return false;
    switch (true) {
      case event.code === 'Slash' && event.ctrlKey:
        openConfig();
        return true;
    }
    return false;
  };

  const tabSwitch = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const elements = ui.configurationWindowContainer.querySelectorAll<HTMLElement>(focusableSelector);
    if (elements.length === 0) return;
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

  const globalHotkeys = (event: KeyboardEvent) => {
    switch (true) {
      case event.code === 'Backslash' && event.ctrlKey:
        setDebugging(!globals.debugging);
        ui.debuggingCheckbox.checked = globals.debugging;
        return true;
      case event.code === 'Semicolon' && event.ctrlKey:
        reloadResources();
        return true;
    }
    return false;
  }

  const attachFocusEvent = () => {
    debug(`Attaching focus event...`);
    ui.configurationWindowContainer.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (true) {
        case event.code === 'Tab':
          tabSwitch(event);
          return true;
        case event.code === 'Tab' && event.shiftKey:
          tabSwitch(event);
          return true;
      }
    });
    debug(`Attached focus events.`);
  }

  const attachHotkeyEvents = () => {
    debug(`Attaching hotkey event...`);
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (globalHotkeys(event)) return;
      if (configOpenSwitch(event)) return;
      if (configClosedSwitch(event)) return;
    });
    debug(`Attached hotkey events.`);
  }

  const loadResource = async (resources: resource[], resourceType: resourceType) => {
    if (resources.length === 0) {
      debug(`No ${resourceType} resources to load.`);
      return;
    }
    debug(`Loading resources of type ${resourceType}...`);

    for (const resource of resources) {
      const loadResource = resource.at === 'universal'
        || resource.urls.find((url) => window.location.href.includes(url)) !== undefined;

      if (!loadResource) {
        debug(`Skipping ${resource.name}...`);
        continue;
      }
      debug(`Loading ${resource.name}...`);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      let onload: (response: vm_responseObjectType) => void = () => { };

      switch (resourceType) {
        case 'scripts':
          onload = (response: vm_responseObjectType) => {
            const script = createElement<HTMLScriptElement>('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute(key.dataAttr, `nws - ${resource.name}`);
            script.innerHTML = response.responseText;
            document.body.append(script);
            debug(`Loaded ${resource.name}`);
          };
          break;
        case 'stylesheets':
          onload = (response: vm_responseObjectType) => {
            const style = createElement<HTMLStyleElement>('style');
            style.setAttribute('type', 'text/css');
            style.setAttribute(key.dataAttr, `nws - ${resource.name}`);
            style.innerHTML = response.responseText;
            document.body.append(style);
            debug(`Loaded ${resource.name}`);
          };
          break;
        case 'json':
          onload = (response: vm_responseObjectType) => {
            const parsedData = JSON.parse(response.responseText);
            objects[resource.name] = parsedData;
            debug(`Loaded ${resource.name}`);
          };
          break;
      }

      const request: vm_xmlhttpRequestType = {
        url: resource.url,
        method: 'GET',
        onload,
      }
      await GM_xmlhttpRequest(request);
    }
    debug(`Loaded resources of type: ${resourceType}.`);
  }

  const loadResources = async () => {
    await loadResource(styleResources, 'stylesheets');
    await loadResource(jsonResources, 'json');
    await loadResource(scriptResources, 'scripts');
  }

  const reloadResources = async () => {
    debug('Reloading resources...');

    debug('Removing old resources...');
    document.body.querySelectorAll(`style[${key.dataAttr}]`).forEach((el) => el.remove());
    document.body.querySelectorAll(`script[${key.dataAttr}]`).forEach((el) => el.remove());
    debug('Removed old resources.');

    await loadResources();

    debug('Reloaded resources.');
  };

  const checkFirstRun = () => {
    debug('First run check...');
    const firstRun = GM_getValue<boolean>(key.firstRun, true);

    if (firstRun) {
      debug('First run detected.');
      GM_setValue(key.firstRun, false);

      GM_notification('First run setup complete', `NWS - ${GM_info.script.name}`);
    }
    debug('First run checked.');
  }

  const onReady = async () => {
    console.log(`NWS - ${GM_info.script.name} - Loading...`);
    GM_registerMenuCommand('Configure configuration ui', () => { openConfig() });
    checkFirstRun();
    attachFocusEvent();
    attachHotkeyEvents();
    loadResources();
    console.log(`NWS - ${GM_info.script.name} - Loaded.`);
  }

  const ready = async () => {
    if (document.readyState !== 'complete') {
      setTimeout(ready, 0);
      return;
    }
    if (unsafeWindow.nws === undefined) throw new Error('NWS failed to setup.');
    await onReady();
  }

  const asap = async () => {
    unsafeWindow.nws = {
      debugging: false,
      configOpen: false,
      debug,
      createElement,
      createHTMLElement,
      registerConfig,
      unregisterConfig,
    };

    setDebugging(GM_getValue<boolean>(key.debugging, false));
    ready();
  }
  asap();
};
nwsConfigurationUI();
