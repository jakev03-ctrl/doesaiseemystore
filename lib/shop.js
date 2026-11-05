// Reads a shop's website and pulls out the useful product information.
// Works best with Shopify, also supports WooCommerce, and falls back to
// reading product pages listed in the shop's sitemap (Wix, Squarespace, etc).

const UA =
  "Mozilla/5.0 (compatible; DoesAISeeMyStore/1.0; +https://doesaiseemystore.com)";

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

async function get(url, timeoutMs = 10000) {
  return fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
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

async function readFromSitemap(origin) {
  let xml = await getText(`${origin}/sitemap.xml`, 10000);
  if (!xml) return null;
  let urls = locs(xml);

  // A sitemap index points to other sitemaps; pick the product one.
  if (urls.length && urls.every((u) => /\.xml(\?|$)/i.test(u))) {
    const child = urls.find((u) => /product|shop|store|item/i.test(u)) || urls[0];
    xml = await getText(child, 10000);
    urls = locs(xml);
  }

  const productUrls = urls
    .filter((u) => /\/(product|products|shop|store|item|items|p)\/[^/]+/i.test(u))
    .slice(0, 10);
  if (!productUrls.length) return null;

  const pages = await Promise.all(productUrls.map(async (u) => ({ u, html: await getText(u, 8000) })));
  const products = [];
  for (const { u, html } of pages) {
    if (!html) continue;
    const schema = productSchemaFrom(html);
    const offer = [].concat(schema?.offers || [])[0] || {};
    products.push({
      title: stripHtml(schema?.name) || pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
      url: u,
      type: stripHtml(schema?.category || ""),
      tags: [],
      price: offer.price ? String(offer.price) : "",
      options: [],
      description: (
        stripHtml(schema?.description) ||
        pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      ).slice(0, 1200),
      hasSchema: Boolean(schema),
    });
  }
  return products.length ? products : null;
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
  if (sampleProductUrl) {
    const html = await getText(sampleProductUrl, 8000);
    if (html) {
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
  };
}

// Plain-English list of what we verified, for the audit and the report.
export function describeChecks(c) {
  if (!c) return "No technical checks were possible.";
  const yes = (v) => (v ? "YES" : "NO");
  const lines = [];
  lines.push(`Sitemap found: ${yes(c.sitemap.found)}${c.sitemap.found ? ` (lists product pages: ${yes(c.sitemap.products)})` : ""}`);
  lines.push(`AI readers blocked from the whole site by robots.txt: ${c.blockedBots.length ? c.blockedBots.join(", ") : "none"}`);
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

export async function readShop(input) {
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
  if (!products) {
    platform = "Other";
    products = await readFromSitemap(finalOrigin);
  }
  products = products || [];

  if (!homeHtml && products.length === 0) {
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

  return {
    origin: finalOrigin,
    domain: finalDomain,
    shopName: shopNameFrom(homeHtml, finalDomain),
    platform: products.length ? platform : "Unknown",
    products: products.map(({ hasSchema, ...p }) => p),
    pageText: stripHtml(homeHtml).slice(0, 6000),
    productSchema,
    checks,
  };
}
