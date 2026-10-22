const pageLoadBound = new Set<string>();

function revealImage(img: HTMLImageElement, onReady: () => void) {
	if (img.complete) {
		img.style.transition = "none";
		onReady();
		img.offsetHeight;
		img.style.transition = "";
		return;
	}
	img.addEventListener("load", onReady, { once: true });
	img.addEventListener("error", onReady, { once: true });
}

export function initLqipImages(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>("[data-astro-lqip]").forEach((wrapper) => {
		const img = wrapper.querySelector("img");
		if (!img || img.dataset.lqipInit) return;
		img.dataset.lqipInit = "1";
		if (img.complete) {
			wrapper.classList.add("lqip-cached");
			img.style.transition = "none";
			img.classList.add("loaded");
			img.offsetHeight;
			img.style.transition = "";
			return;
		}
		const show = () => img.classList.add("loaded");
		img.addEventListener("load", show, { once: true });
		img.addEventListener("error", show, { once: true });
	});
}

export function initContentImages(selector: string, root: ParentNode = document) {
	root.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
		if (img.dataset.progressive) return;
		img.dataset.progressive = "1";
		revealImage(img, () => img.classList.add("loaded"));
	});
}

export function onceOnPageLoad(
	key: string,
	init: () => void,
	extraEvents: string[] = [],
) {
	init();
	if (pageLoadBound.has(key)) return;
	pageLoadBound.add(key);
	document.addEventListener("astro:page-load", init);
	for (const event of extraEvents) document.addEventListener(event, init);
}
