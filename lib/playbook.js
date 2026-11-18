// The AI Shopping Playbook (docs/DoesAISeeMyStore-AI-Shopping-Playbook.pdf), as the system uses it.
// Every piece of advice in a report must point to one of these factors AND to evidence from that check.
// Researched 16 November 2026. Review every 3 months (next: February 2027).

export const FACTORS = {
  F1: { title: "Let AI's search robots in", why: "Stores that block AI search robots can't appear in those assistants' answers (OpenAI and Anthropic say so).", conf: "official" },
  F2: { title: "Make the words readable by machines", why: "Key details hidden in images, late-loading tabs or scripts are invisible to AI. Product pages are the weakest pages for this (Adobe, 2026).", conf: "industry" },
  F3: { title: "Provide clean, consistent product data", why: "AI shopping uses structured product data (price, description) from stores and feeds. Prices should match everywhere.", conf: "official" },
  F4: { title: "Clear, current price and stock", why: "ChatGPT ranks sellers partly on availability and price (OpenAI, reported).", conf: "reported" },
  F5: { title: "Say you're the maker", why: "ChatGPT considers whether a seller makes or is the main seller of a product (OpenAI, reported).", conf: "reported" },
  F6: { title: "Specific facts beat vague praise", why: "Adding facts, figures and sources raised visibility in AI answers by up to 40%, most for smaller sites; keyword stuffing didn't help (GEO study, KDD 2024).", conf: "research" },
  F7: { title: "Answer the questions shoppers ask", why: "AI weighs price, reviews, delivery and fit depending on the question, so those answers need to be on the page.", conf: "reported" },
  F8: { title: "Reviews AI can see", why: "Some assistants check claims against independent reviews, and Google's Shopping Graph stores reviews with products.", conf: "reported" },
  F9: { title: "Be talked about on sites AI reads", why: "AI answers lean heavily on Reddit, review sites and lists (680M citations studied, 2025). Fake mentions don't help.", conf: "industry" },
  F10: { title: "A clear story and identity", why: "AI also uses what it already knows about a store, so a clear About page and consistent name matter.", conf: "reported" },
  F11: { title: "Join the free shopping programmes", why: "Google Merchant Center free listings feed Google's AI shopping; ChatGPT and Perplexity accept merchant feeds.", conf: "official" },
  F12: { title: "Match the shopper's intent", why: "What matters changes with the request (a budget makes price matter more), so pages for common intents help.", conf: "reported" },
  F14: { title: "Be easy to find as a local shop", why: "For town and 'near me' searches, AI leans on map listings (like Google Business Profile), local guides and the address and opening hours on your own site.", conf: "reported" },
  F13: { title: "Fresh, up-to-date information", why: "AI shopping reads store information in real time; stale prices, stock or old policy pages work against you.", conf: "reported" },
};

export function factorList() {
  return Object.entries(FACTORS)
    .map(([id, f]) => `${id} ${f.title}: ${f.why} [${f.conf}]`)
    .join("\n");
}

const DELIVERY = /deliver|shipping|dispatch|next[- ]day|free uk|free shipping/i;
const RETURNS = /return|refund|exchange/i;
// A specific, quotable detail: a measurement, weight, percentage or size. (Symbols like % and " are
// matched without a word-boundary after them, so "100% cotton" and "32\" leg" count.)
export const DETAIL = /\b\d+(\.\d+)?\s?(%|"|(cm|mm|m|kg|g|ml|l|oz|lb|inch(es)?|in|hours?|hrs?|gsm)\b)|\b(uk|eu|us)\s?\d{1,2}\b|\bsizes?\s?\d|\bdimensions\b|\bmeasurements\b/i;

// The AI-ready checklist: things we can check directly on the store, each tied to a factor.
// ok: true (met), false (not met), or null (we couldn't check it). "Couldn't check" is OUR limitation
// (the page loads by script, the site turned our reader away, there are no product pages), so it never
// counts against the store: it isn't scored and the advice must not treat it as a problem.
export function readiness(shop, profile = {}) {
  const c = shop.checks || null;
  const f = c && c.productSchema && typeof c.productSchema === "object" ? c.productSchema : null;
  const pageText = c?.productPageText || "";
  const pages = shop.pages || {};
  const sample = (shop.products || []).slice(0, 30);
  const productsReadable = sample.length >= 3 || Boolean(f) || c?.productSchema === "microdata";
  const all = shop.products || [];
  const detailed = all.filter((p) => DETAIL.test(`${p.description} ${(p.options || []).join(" ")}`)).length;
  const list = [];
  const add = (factor, title, ok, yes, no, unknown = "Couldn't check: we couldn't read this part of your site") =>
    list.push({ factor, title, ok: ok === null ? null : Boolean(ok), detail: ok === null ? unknown : ok ? yes : no });
  const noProducts = "Couldn't check: we couldn't read your product pages";

  if (!c) {
    const why = shop.unreachable ? "Couldn't check: your website didn't open for us" : undefined;
    add("F1", "AI search robots allowed", null, "", "", why);
    add("F1", "Sitemap lists your products", null, "", "", why);
    add("F3", "Product data AI can read", null, "", "", why);
    add("F10", "About page with your story", pages.about ? pages.about.text.length > 400 : null, "Your story is clear on your About page", "No About page with your story found", why);
    return list;
  }

  const blocked = c.searchBlocked || [];
  const training = (c.blockedBots || []).filter((b) => /training|^Claude$|Gemini/i.test(b));
  add("F1", "AI search robots allowed", !blocked.length,
    training.length ? "AI search can read your site (you block AI training robots, which doesn't affect recommendations)" : "ChatGPT, Claude, Perplexity and Google can all read your site",
    `Blocked in robots.txt: ${blocked.join(", ")}`);
  add("F1", "Sitemap lists your products", c.sitemap?.found && (c.sitemap?.products || sample.length >= 3), `${shop.productsListed || (shop.products || []).length || "Your"} products found`, c.sitemap?.found ? "Sitemap found, but it doesn't list products" : "No sitemap found");
  add("F3", "Product data AI can read", productsReadable || c.productSchema ? (f || c.productSchema === "microdata" ? true : c.productSchema === "none" ? false : null) : null,
    f ? `Includes ${["price", "availability", "brand", "reviews"].filter((k) => f[k]).join(", ") || "basic details"}` : "Found on product pages", "No product data found on a product page", noProducts);
  add("F4", "Prices and stock clear", f ? f.price && f.availability : sample.length >= 3 ? sample.some((p) => p.price) : null, f ? "Price and stock in your product data" : "Prices found on your products", f && !f.availability ? "Stock status missing from product data" : "Prices or stock not clear to AI", noProducts);
  add("F5", "Says who makes your products", profile.maker || (f && f.brand) ? true : productsReadable ? false : null, profile.maker ? "Your pages say you make or design your products" : "Brands are set on your products", "Your products don't say who makes them", noProducts);
  add("F10", "About page with your story", pages.about && pages.about.text.length > 400, "Your story is clear on your About page", "No About page with your story found");
  add("F7", "Delivery info on product pages", pageText ? DELIVERY.test(pageText) : null, "Delivery shown on product pages", "Only shown at checkout or on a separate page", noProducts);
  add("F7", "Returns policy easy to find", pages.returns || c.policies?.returns, "Returns page found", "No returns page found");
  add("F8", "Reviews AI can see", f || pageText ? (f && f.reviews) || /\b\d[\d,]*\s+reviews?\b|★|rated \d/i.test(pageText) : null, "Reviews visible in your product page or data", "Reviews aren't visible to AI (or load too late)", noProducts);
  // Judged only on a fair sample (8+ products); fewer than that and we say we couldn't check.
  add("F6", "Specific product details", all.length >= 8 ? detailed / all.length >= 0.5 : null, `${detailed} of ${all.length} products list sizes, weights or measurements`, `Only ${detailed} of ${all.length} products list specific details`, all.length ? `Couldn't check: we could only read ${all.length} of your products, too few to judge` : noProducts);
  // Only for shops customers can visit.
  if (profile.local) {
    const all = [shop.pageText, ...Object.values(pages).map((p) => p.text)].join(" ");
    const postcode = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b|\b\d{5}(-\d{4})?\b/.test(all);
    const hours = /opening (hours|times)|open (mon|tue|wed|thu|fri|sat|sun|daily|7 days)|(mon|monday)\s*[-–:]/i.test(all);
    // A shops page we found but couldn't read addresses on (often a map that loads by script) is our limit, not theirs.
    const finder = Boolean(pages.stores);
    add("F14", "Shop address and opening hours", postcode ? hours || (finder ? null : false) : finder ? null : false, "Your address and opening hours are on your site", postcode ? "Address found, but no opening hours on your site" : "No shop address found on your site",
      `Couldn't check: we found your shops page but couldn't read the ${postcode ? "opening hours" : "addresses"} on it (it may load them by script)`);
  }
  return list;
}

export function hasText(shop, kind) {
  return Boolean(shop.pages?.[kind]?.text);
}
export const RE = { DELIVERY, RETURNS };
