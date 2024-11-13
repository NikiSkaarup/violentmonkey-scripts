type nwsWindow = {
	nws?: nws;
};

type debugType = (message: unknown, name: string) => void;

// type nws = {
//   debugging: boolean;
//   configOpen: boolean;
//   debug: debugType;
//   createElement: <t>(tagName: string, className?: string) => t;
//   createHTMLElement: (tagName: string, className?: string) => HTMLElement;
//   registerConfig: (info: vm_infoType, configContainer: HTMLElement, callback: () => void) => void;
//   unregisterConfig: (info: vm_infoType) => void;
// }

type resource = {
	name: string;
	data: string;
	urls: string[];
	universal?: boolean;
	inline?: boolean;
	at: 'universal' | 'site';
	site?: string;
	shouldLoad?(resource: resource): boolean;
};

type resourceType = 'scripts' | 'stylesheets' | 'json';

type stringKeyedObject = { [key: string]: string };

type shortcutType = 'Global' | 'ConfigOpen' | 'ConfigClosed';

type shortcutCallback = (event: KeyboardEvent) => Promise<boolean>;

type shortcut = {
	name: string;
	callback: shortcutCallback;
};

type registeredShortcut = { shortcutType: shortcutType; shortcut: shortcut };
