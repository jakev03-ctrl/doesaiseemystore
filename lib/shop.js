// Reads a shop's website and pulls out the useful product information.
// Works best with Shopify, also supports WooCommerce, and falls back to
// reading product pages listed in the shop's sitemap (Wix, Squarespace, etc).

const UA =
  "Mozilla/5.0 (compatible; DoesAISeeMyStore/1.0; +https://www.doesaiseemystore.com/bot)";

// Turn whatever the person typed into a clean web address.
export function normaliseUrl(input) {
  let raw = String(input || "").trim();
  if (!raw) throw new Error("Please enter your store's web address.");
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a web address. Try something like mystore.com");
  }

  const host = url.hostname.toLowerCase();
  // Basic safety: only real public websites, not internal addresses.
  const isIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (isIp || host === "localhost" || !host.includes(".") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Please enter a public store website address.");
  }

  const domain = host.replace(/^www\./, "");
  return { origin: `https://${host}`, domain };
}

// ---- Safety: only ever visit normal public websites ----
// A store's own files (sitemap, product links, redirects) decide some of the addresses we visit,
// so every address, and every redirect, is checked first. Internal or private network addresses
// are refused, including names that secretly point at them.
function privateIp(ip) {
  const v = String(ip).toLowerCase();
  if (v.includes(":")) {
    // IPv6: loopback, unspecified, unique-local, link-local, or IPv4-mapped
    if (v === "::1" || v === "::" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v)) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? privateIp(mapped[1]) : false;
  }
  const [a, b] = v.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

const hostChecks = new Map();
let resolveHost = async (host) => {
  const { lookup } = await import("node:dns/promises");
  return lookup(host, { all: true });
};
// For tests only: replace the address lookup.
export function _setResolver(fn) {
  resolveHost = fn;
  hostChecks.clear();
}
async function publicHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) return false;
  if (/^[\d.]+$/.test(host) || host.includes(":")) return !privateIp(host);
  if (hostChecks.has(host)) return hostChecks.get(host);
  let ok = false;
  try {
    const addrs = await resolveHost(host);
    ok = addrs.length > 0 && addrs.every((a) => !privateIp(a.address));
  } catch {
    ok = false;
  }
  hostChecks.set(host, ok);
  return ok;
}

async function get(url, timeoutMs = 10000) {
  const deadline = AbortSignal.timeout(timeoutMs);
  let current = String(url);
  for (let hop = 0; hop < 6; hop++) {
    const u = new URL(current);
    if (!/^https?:$/.test(u.protocol) || !(await publicHost(u.hostname))) throw new Error("Blocked address");
    const res = await fetch(u, { headers: { "User-Agent": UA, Accept: "*/*", "Accept-Language": "en-GB,en;q=0.9" }, redirect: "manual", signal: deadline });
    const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!next) {
      // Keep the final address (fetch's own copy is read-only), so callers can see where we ended up.
      try {
        Object.defineProperty(res, "url", { value: u.toString() });
      } catch {}
      return res;
    }
    current = new URL(next, u).toString();
  }
  throw new Error("Too many redirects");
}

async function getText(url, timeoutMs) {
  try {
    const res = await get(url, timeoutMs);
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

async function getJsonSafe(url, timeoutMs) {
  try {
    const res = await get(url, timeoutMs);
    if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function pick(html, regex) {
  const m = html.match(regex);
  return m ? stripHtml(m[1]) : "";
}

// Work out the shop's name from its homepage.
function shopNameFrom(html, domain) {
  const site = pick(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (site) return site;
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) {
    const parts = title.split(/\s[|–—-]\s/).map((s) => s.trim()).filter(Boolean);
    const best = parts.sort((a, b) => a.length - b.length)[0];
    if (best && best.length <= 40) return best;
  }
  return domain.split(".")[0];
}

// Find JSON-LD "Product" data inside a page.
function productSchemaFrom(html) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let data;
    try {
      data = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const items = Array.isArray(data) ? data : data["@graph"] || [data];
    for (const item of items) {
      const type = [].concat(item?.["@type"] || []).join(",");
      if (/Product/i.test(type)) return item;
    }
  }
  return null;
}

// ---------- Shopify ----------
async function readShopify(origin) {
  const data = await getJsonSafe(`${origin}/products.json?limit=250`, 15000);
  if (!data || !Array.isArray(data.products) || !data.products.length) return null;
  return data.products.map((p) => ({
    title: p.title,
    url: `${origin}/products/${p.handle}`,
    type: p.product_type || "",
    tags: Array.isArray(p.tags) ? p.tags.slice(0, 15) : String(p.tags || "").split(",").slice(0, 15),
    price: p.variants?.[0]?.price || "",
    options: (p.options || []).map((o) => `${o.name}: ${(o.values || []).slice(0, 8).join(", ")}`),
    description: stripHtml(p.body_html).slice(0, 1200),
  }));
}

// ---------- WooCommerce ----------
async function readWoo(origin) {
  const data = await getJsonSafe(`${origin}/wp-json/wc/store/v1/products?per_page=100`, 15000);
  if (!Array.isArray(data) || !data.length) return null;
  return data.map((p) => {
    const minor = Number(p.prices?.currency_minor_unit ?? 2);
    const price = p.prices?.price ? (Number(p.prices.price) / 10 ** minor).toFixed(minor) : "";
    return {
      title: stripHtml(p.name),
      url: p.permalink || "",
      type: p.categories?.[0]?.name || "",
      tags: (p.tags || []).map((t) => t.name).slice(0, 15),
      price,
      options: (p.attributes || []).map((a) => `${a.name}: ${(a.terms || []).map((t) => t.name).slice(0, 8).join(", ")}`),
      description: stripHtml(`${p.short_description || ""} ${p.description || ""}`).slice(0, 1200),
    };
  });
}

// ---------- Any other shop: sitemap + product pages ----------
function locs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}

// Product pages often sit at /products/x, /product/x, /shop/x, or (on many platforms) just /x inside a product sitemap.
const PRODUCT_PATH = /\/(product|products|shop|store|item|items|p)\/[^/]+/i;
const NOT_PRODUCT = /\/(blog|blogs|news|pages|page|collections?|category|categories|tag|tags|account|cart|checkout|search|policies|policy|journal|stories)\b/i;

async function productUrlsFromSitemaps(origin, robotsSitemaps = []) {
  const starts = [...new Set([...robotsSitemaps, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])].slice(0, 3);
  for (const start of starts) {
    const xml = await getText(start, 10000);
    if (!xml) continue;
    let urls = locs(xml);
    // A sitemap index points to other sitemaps: read the product ones (or the first two if none are named).
    if (urls.length && urls.every((u) => /\.xml(\.gz)?(\?|$)/i.test(u))) {
      const named = urls.filter((u) => /product|shop|store|item/i.test(u));
      const children = (named.length ? named : urls).slice(0, 3);
      const found = [];
      for (const child of children) {
        const cx = await getText(child, 10000);
        const list = locs(cx).filter((u) => !/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u));
        // In a sitemap named for products, every address is a product.
        found.push(...(named.includes(child) ? list.filter((u) => !NOT_PRODUCT.test(u)) : list.filter((u) => PRODUCT_PATH.test(u))));
      }
      if (found.length) return found;
      continue;
    }
    const direct = urls.filter((u) => PRODUCT_PATH.test(u) && !NOT_PRODUCT.test(u.replace(PRODUCT_PATH, "")));
    if (direct.length) return direct;
  }
  return [];
}

async function readFromSitemap(origin, robotsSitemaps = []) {
  const all = await productUrlsFromSitemaps(origin, robotsSitemaps);
  if (!all.length) return null;
  // Prefer the store's main language pages (skip /en-us/, /fr/ style copies when there's a plain version).
  const plain = all.filter((u) => !/\/[a-z]{2}(-[a-z]{2})?\/(products?|shop|item)\//i.test(new URL(u).pathname));
  const pool = (plain.length >= 5 ? plain : all).filter((u, i, a) => a.indexOf(u) === i);
  // Spread the sample across the list, not just the first few.
  const step = Math.max(1, Math.floor(pool.length / 24));
  const productUrls = pool.filter((_, i) => i % step === 0).slice(0, 24);

  const products = [];
  // A few at a time, so we don't hammer small stores (and don't get turned away).
  for (let i = 0; i < productUrls.length; i += 6) {
    const batch = await Promise.all(productUrls.slice(i, i + 6).map(async (u) => ({ u, html: await getText(u, 8000) })));
    for (const { u, html } of batch) {
      if (!html) continue;
      const schema = productSchemaFrom(html);
      const offer = [].concat(schema?.offers || [])[0] || {};
      const inner = [].concat(offer.offers || [])[0] || {};
      const title = stripHtml(schema?.name) || pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const price = offer.price || offer.lowPrice || inner.price || pick(html, /<meta[^>]+property=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([^"']+)["']/i);
      if (!title) continue;
      products.push({
        title,
        url: u,
        type: stripHtml(schema?.category || ""),
        tags: [],
        // A price we couldn't read (often filled in by script) is unknown, never "0".
        price: Number(String(price || "").replace(/[^0-9.]/g, "")) > 0 ? String(price) : "",
        options: [],
        description: (
          stripHtml(schema?.description) ||
          pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        ).slice(0, 1200),
        hasSchema: Boolean(schema),
      });
    }
  }
  return products.length ? { products, listed: pool.length } : null;
}

// ---------- Real checks on the store (so our advice is never wrong) ----------
const AI_BOTS = [
  { id: "GPTBot", name: "ChatGPT (training)" },
  { id: "OAI-SearchBot", name: "ChatGPT search" },
  { id: "ChatGPT-User", name: "ChatGPT browsing" },
  { id: "ClaudeBot", name: "Claude" },
  { id: "Claude-SearchBot", name: "Claude search" },
  { id: "PerplexityBot", name: "Perplexity" },
  { id: "Google-Extended", name: "Google Gemini" },
];

// The robots that decide whether a store can appear in AI search answers (AI Shopping Playbook, F1).
const SEARCH_BOTS = [
  { id: "OAI-SearchBot", name: "ChatGPT search" },
  { id: "ChatGPT-User", name: "ChatGPT browsing" },
  { id: "Claude-SearchBot", name: "Claude search" },
  { id: "Claude-User", name: "Claude browsing" },
  { id: "PerplexityBot", name: "Perplexity" },
  { id: "Googlebot", name: "Google" },
];

// Read robots.txt into groups of { agents: [...], disallow: [...], allow: [...] }.
function parseRobots(txt) {
  const groups = [];
  const sitemaps = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of String(txt || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "sitemap") {
      if (val) sitemaps.push(val);
      continue;
    }
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], disallow: [], allow: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === "disallow" && val) cur.disallow.push(val);
    if (key === "allow" && val) cur.allow.push(val);
  }
  return { groups, sitemaps };
}

// Is a bot blocked from the whole site (or from product pages)?
function botBlocked(robots, botId, path = "/") {
  const id = botId.toLowerCase();
  const specific = robots.groups.filter((g) => g.agents.some((a) => a !== "*" && id.includes(a)));
  const groups = specific.length ? specific : robots.groups.filter((g) => g.agents.includes("*"));
  const rules = groups.flatMap((g) => [
    ...g.disallow.map((r) => ({ r, allow: false })),
    ...g.allow.map((r) => ({ r, allow: true })),
  ]);
  const matches = rules.filter(({ r }) => {
    const pattern = r.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$");
    return new RegExp("^" + pattern).test(path);
  });
  if (!matches.length) return false;
  const best = matches.sort((a, b) => b.r.length - a.r.length || (a.allow ? -1 : 1))[0];
  return !best.allow;
}

// What a product page's structured data actually contains.
function schemaFields(schema) {
  if (!schema) return null;
  const offers = [].concat(schema.offers || []);
  const offer = offers[0] || {};
  const inner = [].concat(offer.offers || [])[0] || {};
  const has = (v) => v !== undefined && v !== null && String(typeof v === "object" ? JSON.stringify(v) : v).trim() !== "" && String(v) !== "{}";
  return {
    name: has(schema.name),
    description: has(schema.description),
    image: has(schema.image),
    price: has(offer.price) || has(offer.lowPrice) || has(inner.price),
    currency: has(offer.priceCurrency) || has(inner.priceCurrency),
    availability: has(offer.availability) || has(inner.availability),
    brand: has(schema.brand),
    identifier: has(schema.sku) || has(schema.gtin) || has(schema.gtin13) || has(schema.gtin12) || has(schema.mpn),
    reviews: has(schema.aggregateRating) || has(schema.review),
    shipping: has(offer.shippingDetails) || has(inner.shippingDetails),
    returns: has(offer.hasMerchantReturnPolicy) || has(schema.hasMerchantReturnPolicy),
  };
}

async function fetchSitemap(origin, robots) {
  const sitemapUrl = robots.sitemaps[0] || `${origin}/sitemap.xml`;
  return getText(sitemapUrl, 8000);
}

async function siteChecks(origin, homeHtml, sampleProductUrl, robotsTxt, sitemapPromise) {
  const robots = parseRobots(robotsTxt);

  // Sitemap: listed in robots.txt or at the usual place (fetched earlier, alongside the products).
  const sitemapXml = await sitemapPromise;
  let sitemap = { found: Boolean(sitemapXml && /<(urlset|sitemapindex)/i.test(sitemapXml)), products: false };
  if (sitemap.found) {
    const list = locs(sitemapXml);
    sitemap.products =
      list.some((u) => /product/i.test(u)) || /<url>[\s\S]*?\/(products?|shop|item)\//i.test(sitemapXml);
  }

  // Which AI readers are blocked.
  const blockedBots = AI_BOTS.filter((b) => botBlocked(robots, b.id, "/")).map((b) => b.name);
  const blockedProducts = AI_BOTS.filter((b) => !blockedBots.includes(b.name) && botBlocked(robots, b.id, "/products/example")).map((b) => b.name);

  // Product page structured data.
  let fields = null;
  let productPageText = "";
  if (sampleProductUrl) {
    const html = await getText(sampleProductUrl, 8000);
    if (html) {
      productPageText = stripHtml(html).slice(0, 6000);
      fields = schemaFields(productSchemaFrom(html));
      if (!fields) fields = /itemtype=["']https?:\/\/schema\.org\/Product/i.test(html) ? "microdata" : "none";
    }
  }

  // Policies the homepage links to.
  const links = (homeHtml.match(/<a[^>]+href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) || []).join(" ").toLowerCase();
  const policies = {
    returns: /refund|return/.test(links),
    delivery: /shipping|delivery/.test(links),
    contact: /contact/.test(links),
    about: /about|our-story|our story/.test(links),
  };

  const metaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(homeHtml);
  const organisation = /"@type"\s*:\s*"(Organization|OnlineStore|Store|LocalBusiness)"/i.test(homeHtml);

  return {
    robotsFound: Boolean(robotsTxt),
    blockedBots,
    blockedProducts,
    sitemap,
    productSchema: fields,
    policies,
    metaDescription,
    organisation,
    // Does the store ask tools like ours not to read it?
    blocksUs: botBlocked(robots, "DoesAISeeMyStore", "/"),
    // Search robots only (training robots like GPTBot and ClaudeBot don't affect search answers).
    searchBlocked: SEARCH_BOTS.filter((b) => botBlocked(robots, b.id, "/")).map((b) => b.name),
    productPageText,
  };
}

// ---------- Stage 1: get to know the store ----------
// The pages that tell us who a store is: about, delivery, returns, contact, FAQ.
const PAGE_KINDS = {
  about: { words: /about|our[- ]story|who[- ]we[- ]are|meet[- ]the/i, paths: ["/pages/about-us", "/pages/about", "/about", "/about-us", "/our-story"] },
  delivery: { words: /shipping|delivery/i, paths: ["/policies/shipping-policy", "/pages/shipping", "/pages/delivery", "/shipping", "/delivery"] },
  returns: { words: /return|refund/i, paths: ["/policies/refund-policy", "/pages/returns", "/returns", "/refund-policy"] },
  contact: { words: /contact/i, paths: ["/pages/contact", "/contact", "/contact-us"] },
  faq: { words: /\bfaq|frequently|help/i, paths: ["/pages/faq", "/pages/faqs", "/faq", "/faqs"] },
  // The shop finder page (for stores with physical shops).
  stores: {
    // Link text like "Our shops", "TOAST Shops" or "Find a store", or a page address like /pages/toast-shops.
    words: /store[- ]?(locator|finder)|find[- ](a|your|our|us|the)?[- ]?(store|shop)|our[- ](stores|shops)|visit[- ]us|\b(stores|shops|locations)\s*$|\/pages\/[a-z0-9-]*(stores|shops|locations|store-locator|find-a-store|find-your-store|visit-us)\/?$/i,
    paths: ["/pages/stores", "/pages/our-stores", "/pages/shops", "/pages/our-shops", "/pages/store-locator", "/pages/locations", "/pages/find-a-store"],
  },
};
const POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b|\b\d{5}(-\d{4})?\b/;

function homeLinks(html, origin) {
  const out = [];
  for (const m of String(html || "").matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const u = new URL(m[1], origin);
      if (u.origin !== new URL(origin).origin) continue;
      out.push({ url: u.toString().split("?")[0], text: stripHtml(m[2]).slice(0, 60) });
    } catch {}
  }
  return out;
}

async function explorePages(origin, homeHtml, robotsTxt) {
  const robots = parseRobots(robotsTxt);
  const links = homeLinks(homeHtml, origin);
  const pages = {};
  await Promise.all(
    Object.entries(PAGE_KINDS).map(async ([kind, k]) => {
      const fromLinks = links.filter((l) => k.words.test(l.text) || k.words.test(new URL(l.url).pathname)).map((l) => l.url);
      const tries = [...new Set([...fromLinks.slice(0, 2), ...k.paths.map((p) => origin + p)])].slice(0, 4);
      for (const url of tries) {
        const path = new URL(url).pathname;
        if (botBlocked(robots, "DoesAISeeMyStore", path)) continue;
        const html = await getText(url, 7000);
        let text = stripHtml(html);
        if (kind === "stores" && text.length > 100 && !POSTCODE.test(text)) {
          // A list of shops whose addresses sit on each shop's own page: read the first two of those.
          // Each shop's own page: its address says "store"/"shop", or it sits beside the shops page and
          // shares its first word (toa.st/pages/toast-shops links to /pages/toast-bloomsbury).
          const here = new URL(url).pathname.replace(/\/$/, "");
          const dir = here.slice(0, here.lastIndexOf("/") + 1);
          const stem = (here.slice(dir.length).split(/[-_.]/)[0] || "").toLowerCase();
          const COMMON = /about|contact|faq|deliver|shipping|return|privacy|terms|cookie|career|job|blog|gift|size|care|account|login|cart|search|repair|exchange|event|donat|sale/i;
          const shopPages = [
            ...new Set(
              homeLinks(html, origin)
                .map((l) => l.url)
                .filter((u) => {
                  const p = new URL(u).pathname.replace(/\/$/, "");
                  if (p === here || COMMON.test(p)) return false;
                  if (/\/pages\/[a-z0-9-]*(store|shop)[a-z0-9-]*$/i.test(p)) return true;
                  const slug = p.slice(dir.length).toLowerCase();
                  return dir.length > 1 && p.startsWith(dir) && !slug.includes("/") && stem.length >= 3 && slug.startsWith(stem + "-");
                })
            ),
          ].slice(0, 2);
          for (const p of shopPages) if (!botBlocked(robots, "DoesAISeeMyStore", new URL(p).pathname)) text += " " + stripHtml(await getText(p, 6000));
        }
        if (text.length > (kind === "stores" ? 100 : 200)) {
          pages[kind] = { url, text: text.slice(0, kind === "stores" ? 5000 : 3500) };
          break;
        }
      }
    })
  );
  return pages;
}

// Collection names (Shopify), to see how the range is organised.
async function readCollections(origin) {
  const data = await getJsonSafe(`${origin}/collections.json?limit=50`, 8000);
  return Array.isArray(data?.collections) ? data.collections.map((c) => stripHtml(c.title)).filter(Boolean).slice(0, 30) : [];
}

// Social links on the homepage.
function socialLinks(html) {
  const found = new Set();
  for (const m of String(html || "").matchAll(/https?:\/\/(?:www\.)?(instagram|facebook|tiktok|pinterest|youtube|x|twitter|linkedin)\.com\/[^"'\s<>]+/gi)) found.add(m[1].toLowerCase());
  return [...found];
}

// Plain-English list of what we verified, for the audit and the report.
export function describeChecks(c) {
  if (!c) return "No technical checks were possible.";
  const yes = (v) => (v ? "YES" : "NO");
  const lines = [];
  lines.push(`Sitemap found: ${yes(c.sitemap.found)}${c.sitemap.found ? ` (lists product pages: ${yes(c.sitemap.products)})` : ""}`);
  const searchBlocked = c.searchBlocked || [];
  const trainingOnly = (c.blockedBots || []).filter((b) => /training|^Claude$|Gemini/i.test(b));
  lines.push(`AI SEARCH robots (these decide whether the store can appear in AI answers) blocked by robots.txt: ${searchBlocked.length ? searchBlocked.join(", ") : "none: AI search can read the site"}`);
  if (trainingOnly.length) lines.push(`AI TRAINING robots blocked: ${trainingOnly.join(", ")}. This only stops the store's pages being used to train AI models; it does NOT stop AI search recommending the store. Never tell the owner this blocks recommendations.`);
  if (c.blockedProducts.length) lines.push(`AI readers blocked from product pages: ${c.blockedProducts.join(", ")}`);
  if (c.productSchema === "none") lines.push("Product structured data (schema) on a product page: NONE FOUND in the page code (it may be added by scripts we can't see, so word any advice gently)");
  else if (c.productSchema === "microdata") lines.push("Product structured data on a product page: FOUND (older microdata format; individual fields not checked, so do NOT recommend adding product schema)");
  else if (c.productSchema) {
    const f = c.productSchema;
    const present = Object.keys(f).filter((k) => f[k]);
    const missing = Object.keys(f).filter((k) => !f[k]);
    lines.push(`Product structured data (schema) on a product page: FOUND. Includes: ${present.join(", ") || "nothing useful"}. Missing: ${missing.join(", ") || "nothing"}`);
  } else lines.push("Product structured data: could not check");
  lines.push(`Homepage links to: returns/refunds ${yes(c.policies.returns)}, delivery/shipping ${yes(c.policies.delivery)}, contact ${yes(c.policies.contact)}, about ${yes(c.policies.about)}`);
  lines.push(`Homepage meta description: ${yes(c.metaDescription)}; business (Organization) structured data: ${yes(c.organisation)}`);
  return lines.join("\n");
}

// What the site is built with. Shopify and WooCommerce are confirmed by their product lists answering;
// otherwise we look for each builder's fingerprints in the homepage code (its own file addresses).
export function builtWith(html, fromApi) {
  if (fromApi === "Shopify" || fromApi === "WooCommerce") return fromApi;
  const h = String(html || "");
  if (/cdn\.shopify\.com|shopify-section|Shopify\.theme/i.test(h)) return "Shopify";
  if (/wp-content\/plugins\/woocommerce|woocommerce-(page|product|cart)/i.test(h)) return "WooCommerce";
  if (/static1\.squarespace\.com|images\.squarespace-cdn\.com|<!-- This is Squarespace/i.test(h)) return "Squarespace";
  if (/static\.wixstatic\.com|static\.parastorage\.com|<meta[^>]+content="Wix\.com Website Builder"/i.test(h)) return "Wix";
  if (/cdn\d*\.bigcommerce\.com|stencil-utils/i.test(h)) return "BigCommerce";
  if (/wp-content\/|wp-includes\//i.test(h)) return "WordPress";
  return "Other";
}

export async function readShop(input, opts = {}) {
  const { origin, domain } = normaliseUrl(input);

  // Homepage (for the name, and as a backup).
  // Homepage and robots.txt at the same time (robots.txt follows any redirect to the main address).
  let homeHtml = "";
  let finalDomain = domain;
  let finalOrigin = origin;
  const [, robotsTxt] = await Promise.all([
    (async () => {
      try {
        const res = await get(origin);
        if (res.ok) {
          homeHtml = await res.text();
          const u = new URL(res.url);
          finalDomain = u.hostname.replace(/^www\./, "");
          finalOrigin = u.origin;
        }
      } catch {}
    })(),
    getText(`${origin}/robots.txt`, 6000),
  ]);

  // Respect the store's wishes: if robots.txt asks all tools like ours not to read the site, stop.
  if (robotsTxt && botBlocked(parseRobots(robotsTxt), "DoesAISeeMyStore", "/")) {
    const err = new Error(
      "This store's settings ask automated tools not to read its pages, so we've respected that and not checked it. This setting may also stop AI assistants from reading it."
    );
    err.code = "ROBOTS_BLOCKED";
    throw err;
  }

  // Fetch the sitemap at the same time as the products, to keep checks quick.
  const sitemapPromise = fetchSitemap(finalOrigin, parseRobots(robotsTxt));

  let platform = "Shopify";
  let products = null;
  // Try Shopify and WooCommerce at the same time (each store only answers one of them).
  const [shopify, woo] = await Promise.all([readShopify(finalOrigin), readWoo(finalOrigin)]);
  if (shopify) products = shopify;
  else if (woo) {
    platform = "WooCommerce";
    products = woo;
  }
  let listed = null;
  // "api": the shop's own product list (Shopify/WooCommerce), so prices are exact. "pages": read one page at a time.
  let productsFrom = products ? "api" : "";
  if (!products) {
    platform = "Other";
    const fromSitemap = await readFromSitemap(finalOrigin, parseRobots(robotsTxt).sitemaps);
    products = fromSitemap?.products || null;
    listed = fromSitemap?.listed || null;
    if (products) productsFrom = "pages";
  }
  products = products || [];

  if (!homeHtml && products.length === 0) {
    // We couldn't open the site at all. The check can still ask AI about the store (that doesn't need
    // our reader), and "we couldn't open your website" is itself worth telling the owner.
    // Only when the address really exists (a typo shouldn't run a whole check).
    if (opts.allowUnreachable && (await publicHost(new URL(finalOrigin).hostname))) {
      return {
        origin: finalOrigin,
        domain: finalDomain,
        shopName: finalDomain.split(".")[0],
        platform: "Unknown",
        products: [],
        productsListed: null,
        pageText: "",
        productSchema: "unknown",
        checks: null,
        pages: {},
        collections: [],
        social: [],
        unreachable: true,
      };
    }
    throw new Error(
      "We couldn't open that website. Check the address is right and the site is public, then try again."
    );
  }

  // Real checks: sitemap, AI access, product structured data, policies.
  let checks = null;
  try {
    checks = await siteChecks(finalOrigin, homeHtml, products[0]?.url, robotsTxt, sitemapPromise);
  } catch (e) {
    console.error("Site checks failed:", e?.message);
  }
  const productSchema = checks?.productSchema ? (checks.productSchema === "none" ? "no" : "yes") : "unknown";

  // Stage 1: explore the store like a curious customer (about, delivery, returns, contact, FAQ, collections).
  let pages = {};
  let collections = [];
  if (opts.deep !== false) {
    [pages, collections] = await Promise.all([
      explorePages(finalOrigin, homeHtml, robotsTxt).catch(() => ({})),
      platform === "Shopify" ? readCollections(finalOrigin).catch(() => []) : Promise.resolve([]),
    ]);
  }

  return {
    origin: finalOrigin,
    domain: finalDomain,
    // The address the owner typed, if it sent us somewhere else (e.g. a UK .com sending our reader to a .us store).
    redirectedFrom: finalDomain !== domain.replace(/^www\./, "") ? domain.replace(/^www\./, "") : null,
    shopName: shopNameFrom(homeHtml, finalDomain),
    platform: homeHtml ? builtWith(homeHtml, products.length ? platform : "") : products.length ? platform : "Unknown",
    products: products.map(({ hasSchema, ...p }) => p),
    // How many product pages the sitemap lists (for non-Shopify stores we only read a sample of them).
    productsListed: listed,
    productsFrom,
    pageText: stripHtml(homeHtml).slice(0, 6000),
    // A site that only shows "please enable JavaScript" to readers like ours: pages we can't find may still exist.
    jsOnly: !products.length && stripHtml(homeHtml).length < 1500 && /enable javascript|requires? javascript|relies on javascript|javascript (is )?(required|disabled)/i.test(stripHtml(homeHtml)),
    productSchema,
    checks,
    pages,
    collections,
    social: socialLinks(homeHtml),
  };
}
