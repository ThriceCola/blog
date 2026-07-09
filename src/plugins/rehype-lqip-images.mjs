// @ts-check
import { getPlaiceholder } from "plaiceholder";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin: wraps markdown <img> tags with astro-lqip LQIP overlay.
 *
 * At build time, downloads each remote image, generates a tiny base64 PNG
 * (LQIP), reads its natural dimensions, and outputs HTML that matches the
 * astro-lqip <Image> component structure — so the same global CSS handles
 * both astro-lqip components and markdown images identically.
 */

/** @param {string} url */
function isRemote(url) {
  return /^https?:\/\//.test(url);
}

/**
 * Fetch image, generate LQIP + read dimensions.
 * @param {string} url
 * @returns {Promise<{base64: string, width: number, height: number} | null>}
 */
async function generateLQIP(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { base64, metadata } = await getPlaiceholder(buffer, { size: 10 });
    return { base64, width: metadata.width, height: metadata.height };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`[rehype-lqip] Failed for ${url}:`, message);
    return null;
  }
}

/**
 * @returns {import('unified').Transformer<import('hast').Root, import('hast').Root>}
 */
export default function rehypeLqipImages() {
  /** @type {Map<string, Promise<{base64: string, width: number, height: number} | null>>} */
  const lqipCache = new Map();

  return async (tree) => {
    /** @type {Array<{node: any, index: number | undefined, parent: any, src: string}>} */
    const tasks = [];

    visit(tree, "element", (node, index, parent) => {
      if (index === undefined) return;
      if (node.tagName !== "img") return;
      const src = node.properties?.src;
      if (!src || !isRemote(String(src))) return;
      tasks.push({ node, index, parent, src: String(src) });
    });

    if (tasks.length === 0) return;

    // Generate LQIPs (deduped by URL), collecting dimensions
    const results = await Promise.all(
      tasks.map(async (t) => {
        if (!lqipCache.has(t.src)) {
          lqipCache.set(t.src, generateLQIP(t.src));
        }
        return { task: t, data: await lqipCache.get(t.src) };
      }),
    );

    // Replace img nodes with wrapped versions
    for (const { task, data } of results) {
      if (!data) continue;

      const { node, index, parent } = task;
      const { base64, width, height } = data;

      // Set natural dimensions on the img (prevents 0×0 wrapper before load)
      node.properties.width = String(width);
      node.properties.height = String(height);
      // Sync decoding ensures the image is fully decoded before onload fires
      node.properties.decoding = "sync";
      // Fade out the LQIP ::after overlay when image loads
      node.properties.onload =
        "parentElement.style.setProperty('--z-index', 1);parentElement.style.setProperty('--opacity', 0);";

      const wrapper = {
        type: "element",
        tagName: "span",
        properties: {
          "data-astro-lqip": "",
          // base64 is already a full data URL from getPlaiceholder
          style: `--lqip-background:url('${base64}')`,
        },
        children: [node],
      };

      parent.children.splice(index, 1, wrapper);
    }
  };
}
