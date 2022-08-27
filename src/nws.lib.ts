export default (() => {
  const focusableSelector = 'a[href].nws, area[href].nws, input:not([disabled]).nws, select:not([disabled]).nws, textarea:not([disabled]).nws, button:not([disabled]).nws, [tabindex].nws, [contenteditable].nws';

  const configGlobals: configuration_ui.globalsType = {
    uiInitialized: false,
    configurationWindowOpen: false,
    debugging: false,
  };

  const objects: stringKeyedObject = {};
  const styleResources: resource[] = [
    {
      name: 'configuration-ui',
      data: '',
      urls: [],
      universal: true,
      at: 'universal',
    },
  ];
  const jsonResources: resource[] = [];
  const scriptResources: resource[] = [];

  const key = {
    firstRun: 'firstRun',
    debugging: 'debugging',
    dataAttr: 'data-nws-lib',
  }

  const createElement = <t>(tag: string, className?: string, innerHTML?: string): t => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    element.classList.add('nws');
    return element as unknown as t;
  }

  const createHTMLElement = (tag: string, className?: string, innerHTML?: string): HTMLElement =>
    createElement<HTMLElement>(tag, className, innerHTML);

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

  const externalDebug: debugType = (message: unknown, name: string): void => {
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
  };

  const debug = (message: unknown): void => {
    if (!configGlobals.debugging) return;
    externalDebug(message, 'Lib');
  };

  const setDebugging = (value: boolean): void => {
    GM_setValue<boolean>(key.debugging, value);
    configGlobals.debugging = value;
    console.log('NWS - Debugging set to:', value);
  }

  const setConfigOpen = (value: boolean) => {
    configGlobals.configurationWindowOpen = value;
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
    ui.debuggingCheckbox.checked = configGlobals.debugging;
    ui.debuggingCheckbox.addEventListener('change', (event) => {
      configGlobals.debugging = (event.target as HTMLInputElement).checked;
      setDebugging(configGlobals.debugging);
    });
    debuggingCheckboxContainer.appendChild(ui.debuggingCheckbox);

    const namespaceURI = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespaceURI, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(namespaceURI, 'path');
    path.setAttribute('d', 'M1.73,12.91 8.1,19.28 22.79,4.59');
    svg.appendChild(path);
    debuggingCheckboxContainer.appendChild(svg);

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

    ui.configurationWindowContainer.onclick = (event) =>
      event.target === ui.configurationWindowContainer && closeConfig();

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

    if (!configGlobals.uiInitialized) {
      initConfigUI();
      configGlobals.uiInitialized = true;
    }
    document.body.appendChild(ui.backdrop);
    for (const registered of Object.values(registeredConfigurations))
      registered.callback();

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

  const shouldLoad = (resource: resource): boolean => resource.at === 'universal' || resource.urls.find((url) => window.location.href.includes(url)) !== undefined;

  const loadScript = (resource: resource) => {
    resource.data = GM_getResourceText(resource.name);
    const script = createElement<HTMLScriptElement>('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('data-name', resource.name);
    script.innerHTML = resource.data;
    document.body.append(script);
  }

  const loadStyle = (resource: resource) => {
    resource.data = GM_getResourceText(resource.name);
    const style = createElement<HTMLScriptElement>('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-name', resource.name);
    style.innerHTML = resource.data;
    document.body.append(style);
  }

  const loadJSON = (resource: resource) => {
    resource.data = GM_getResourceText(resource.name);
    objects[resource.name] = resource.data;
  }

  const loadResource = async (resource: resource, resourceType: resourceType) => {
    const loadResource = resource.shouldLoad !== undefined ? resource.shouldLoad(resource) : shouldLoad(resource);

    if (!loadResource) {
      debug(`Skipping ${resource.name} of type: ${resourceType}...`);
      return;
    }
    debug(`Loading resource: ${resource.name} of type: ${resourceType}...`);

    switch (resourceType) {
      case 'scripts':
        loadScript(resource);
        break;
      case 'stylesheets':
        loadStyle(resource);
        break;
      case 'json':
        loadJSON(resource);
        break;
      default:
        break;
    }
    debug(`Loaded resource: ${resource.name} of type: ${resourceType}.`);
  }

  const registeredResources: { resource: resource, resourceType: resourceType }[] = [];

  const registerResource = (resourceType: resourceType, ...resources: resource[]) =>
    resources.forEach(resource => registeredResources.push({ resource, resourceType }));

  const unregisterResource = (name: string) => {
    const index = registeredResources.findIndex((registered) => registered.resource.name === name);
    if (index > -1) registeredResources.splice(index, 1);
  };

  const registerResources = () => {
    registerResource('stylesheets', ...styleResources);
    registerResource('json', ...jsonResources);
    registerResource('scripts', ...scriptResources);
  };

  const loadResources = async () => {
    debug(`Loading resources...`);
    registeredResources.forEach(async ({ resource, resourceType }) =>
      await loadResource(resource, resourceType));
    debug(`Loaded resources.`);
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

  const noModifier = (e: KeyboardEvent) => !(e.ctrlKey || e.altKey || e.shiftKey);
  const shiftModifier = (e: KeyboardEvent) => e.shiftKey && !(e.ctrlKey || e.altKey);
  const ctrlModifier = (e: KeyboardEvent) => e.ctrlKey && !(e.altKey || e.shiftKey);
  const altModifier = (e: KeyboardEvent) => e.altKey && !(e.ctrlKey || e.shiftKey);

  const globalShortcuts: shortcutCallback = (event: KeyboardEvent): boolean => {
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
  };

  const configOpenShortcuts: shortcutCallback = (event: KeyboardEvent): boolean => {
    switch (true) {
      case event.code === 'Escape' && noModifier(event):
        closeConfig();
        return true;
    }
    return false;
  };

  const configClosedShortcuts: shortcutCallback = (event: KeyboardEvent): boolean => {
    switch (true) {
      case event.code === 'Slash' && ctrlModifier(event):
        openConfig();
        return true;
    }
    return false;
  };

  const registeredKeyUpShortCuts: registeredShortcut[] = [];

  const filterRegisteredShortcut = (shortcutType: shortcutType): registeredShortcut[] =>
    registeredKeyUpShortCuts.filter(registered => registered.shortcutType === shortcutType);

  const attachShortcutEvents = () => {
    debug(`Attaching shortcut events...`);
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      const shortcuts = [
        ...filterRegisteredShortcut('Global'),
        ...(configGlobals.configurationWindowOpen ? filterRegisteredShortcut('ConfigOpen') : filterRegisteredShortcut('ConfigClosed'))
      ];

      for (const registered of shortcuts) {
        if (registered.shortcut.callback(event)) return;
      }
    });
    debug(`Attached shortcut events.`);
  }

  const registerKeyUp = (shortcutType: shortcutType, ...shortcuts: shortcut[]) =>
    shortcuts.forEach(shortcut => registeredKeyUpShortCuts.unshift({ shortcutType, shortcut }));

  const unregisterKeyUp = (name: string) => {
    const index = registeredKeyUpShortCuts.findIndex((registered) => registered.shortcut.name === name);
    if (index > -1) registeredKeyUpShortCuts.splice(index, 1);
  };

  const registerKeyUps = () => {
    const namePrefix = 'nwsLib';
    registerKeyUp('Global', { name: `${namePrefix} - global`, callback: globalShortcuts });
    registerKeyUp('ConfigOpen', { name: `${namePrefix} - config open`, callback: configOpenShortcuts });
    registerKeyUp('ConfigClosed', { name: `${namePrefix} - config closed`, callback: configClosedShortcuts });
  };

  const onInit = async (callback: () => void) => {
    try {
      setDebugging(GM_getValue<boolean>(key.debugging, false));
      console.log(`NWS lib - ${GM_info.script.name} - Loading...`);
      GM_registerMenuCommand(`Configure ${GM_info.script.name}`, () => { openConfig() });
      registerKeyUps();
      registerResources();
      attachFocusEvent();
      attachShortcutEvents();
      await loadResources();
      console.log(`NWS lib - ${GM_info.script.name} - Loaded.`);
      callback();
    } catch (e) {
      console.log('NWS lib - Error:', e);
    }
  }

  const init = async (callback: () => void) => {
    console.log('NWS lib - Initializing...');
    switch (document.readyState) {
      case 'complete':
        await onInit(callback)
        break;
      case 'interactive':
        await onInit(callback)
        break;
      case 'loading':
        setTimeout(init, 0, callback)
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
    createElement: createElement,
    createHTMLElement: createHTMLElement,
    debug: externalDebug,
    init: init,
  };
})();
