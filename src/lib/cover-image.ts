import type { CollectionEntry } from "astro:content";

export function coverImage(data: CollectionEntry<"blog">["data"]) {
	if (data.cardImage) {
		return { src: data.cardImage, position: data.cardImagePosition };
	}
	return { src: data.heroImage, position: data.heroImagePosition };
}
