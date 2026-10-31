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

export async function readShop(input) {
  const { origin, domain } = normaliseUrl(input);

  // Homepage (for the name, and as a backup).
  let homeHtml = "";
  let finalDomain = domain;
  let finalOrigin = origin;
  try {
    const res = await get(origin);
    if (res.ok) {
      homeHtml = await res.text();
      const u = new URL(res.url);
      finalDomain = u.hostname.replace(/^www\./, "");
      finalOrigin = u.origin;
    }
  } catch {}

  let platform = "Shopify";
  let products = await readShopify(finalOrigin);
  if (!products) {
    platform = "WooCommerce";
    products = await readWoo(finalOrigin);
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

  // Do product pages carry structured product data? Check one to be fair.
  let productSchema = "unknown";
  if (platform === "Other") {
    productSchema = products.some((p) => p.hasSchema) ? "yes" : products.length ? "no" : "unknown";
  } else if (products[0]?.url) {
    const html = await getText(products[0].url, 8000);
    if (html) productSchema = productSchemaFrom(html) ? "yes" : "no";
  }

  return {
    origin: finalOrigin,
    domain: finalDomain,
    shopName: shopNameFrom(homeHtml, finalDomain),
    platform: products.length ? platform : "Unknown",
    products: products.map(({ hasSchema, ...p }) => p),
    pageText: stripHtml(homeHtml).slice(0, 6000),
    productSchema,
  };
}
