export function revealFeed(options: {
	feed: HTMLElement;
	sentinel: HTMLElement;
	end: HTMLElement | null;
	cardSelector: string;
	batch?: number;
	onReveal?: (card: HTMLElement) => void;
	/** Date/reading order of a card when the DOM is laid out column by column. */
	orderOf?: (card: HTMLElement) => number;
}) {
	const { feed, sentinel, end, cardSelector, batch = 6, onReveal, orderOf } =
		options;
	if (feed.dataset.bound) return;
	feed.dataset.bound = "1";

	const cards = [...feed.querySelectorAll<HTMLElement>(cardSelector)];
	if (orderOf) cards.sort((a, b) => orderOf(a) - orderOf(b));
	let remaining = cards.length;
	let loading = false;

	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries[0]?.isIntersecting || loading || remaining <= 0) return;
			loading = true;

			const start = cards.length - remaining;
			const last = Math.min(start + batch, cards.length);
			for (let i = start; i < last; i++) {
				const card = cards[i];
				card.style.setProperty("--enter-i", String(i - start));
				card.classList.add("card-enter");
				card.classList.remove("hidden-post");
				onReveal?.(card);
			}
			remaining = cards.length - last;

			if (remaining <= 0) {
				observer.unobserve(sentinel);
				end?.removeAttribute("hidden");
			}
			loading = false;
		},
		{ rootMargin: "200px" },
	);

	if (cards.length > 0) observer.observe(sentinel);
	else end?.removeAttribute("hidden");
}
