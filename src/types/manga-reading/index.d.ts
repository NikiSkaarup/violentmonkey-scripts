/* eslint-disable @typescript-eslint/no-unused-vars */
namespace manga_reading {
	type siteType = {
		name: string;
		urls: string[];
		active: boolean;
		at: 'neither' | 'chapter' | 'manga';
		atChapterRegex: RegExp;
		atMangaRegex: RegExp;
		titleLinkSelector: string;
		nextChapterSelector: string;
		prevChapterSelector: string;
	};

	type globalsType = {
		nextUrl: string;
		prevUrl: string;
		currentTitle: string;
		uiInitialized: boolean;
		site: SiteType;
		titleList: string[];
		ptApi: {
			url: string;
			bearerToken: string;
		};
	};

	type resourceType = resource & {
		site: 'global' | 'manga' | 'chapter' | 'chapterOrManga' | 'neither';
	};
}
