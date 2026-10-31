// The "brain": uses Claude to grade the shop and test whether AI recommends it.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ maxRetries: 2 });

// Models can be changed in Vercel settings without touching the code.
const AUDIT_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const SEARCH_MODEL = process.env.CLAUDE_SEARCH_MODEL || "claude-haiku-5-5";
const QUESTION_COUNT = Number(process.env.QUESTION_COUNT || 5);

function textOf(message) {
  return (message.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(start, end + 1));
}

// Step 1: grade the product data and write realistic shopping questions.
export async function auditShop(shop, category) {
  const evidence = shop.products.length
    ? JSON.stringify(shop.products.slice(0, 10), null, 1)
    : `No product list available. Homepage text:\n${shop.pageText}`;

  const prompt = `You are auditing a small online shop to see how well AI shopping assistants (like ChatGPT, Claude, Gemini and Perplexity) could understand and recommend it.

Shop name: ${shop.shopName}
Website: ${shop.domain}
Category the owner chose: ${category}
Has structured product data on homepage: ${shop.hasStructuredData ? "yes" : "no"}

Product information found:
${evidence}

Do two things:

A) Score the product information from 0 to 100 for how easily an AI assistant could recommend these products. Check for: detailed descriptions, materials, sizes or dimensions, who it's for, use cases, clear prices, and delivery/returns information. Be honest and specific.

B) Write exactly ${QUESTION_COUNT} realistic questions a UK shopper might type into an AI assistant when looking for products in this category. Make them varied (budget, gift, quality, specific features). Do NOT mention this shop's name.

Reply with ONLY this JSON, nothing else:
{
  "dataScore": <number 0-100>,
  "summary": "<one or two plain-English sentences about the overall state of their product info>",
  "fixes": ["<specific fix 1>", "<fix 2>", "<fix 3>", "<fix 4>", "<fix 5>"],
  "questions": ["<question 1>", "..."]
}

Write the fixes in simple, friendly language a non-technical shop owner understands.`;

  const res = await client.messages.create({
    model: AUDIT_MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const data = parseJson(textOf(res));
  return {
    dataScore: Math.max(0, Math.min(100, Math.round(Number(data.dataScore) || 0))),
    summary: String(data.summary || ""),
    fixes: (data.fixes || []).slice(0, 5).map(String),
    questions: (data.questions || []).slice(0, QUESTION_COUNT).map(String),
  };
}

// Step 2: ask one shopping question to Claude with web search, like a shopper would.
async function askAssistant(question) {
  const system = `You are a helpful shopping assistant for a customer in the UK. Search the web, then recommend 3 to 6 specific shops or products, naming the shop each one comes from. Keep it brief.
On the very last line, write exactly: SHOPS: name1 | name2 | name3 (the shop or brand names you recommended, nothing else on that line).`;

  const messages = [{ role: "user", content: question }];
  let text = "";
  const urls = [];

  // The API can pause long searches; continue up to twice.
  for (let i = 0; i < 3; i++) {
    const res = await client.messages.create(
      {
        model: SEARCH_MODEL,
        max_tokens: 1200,
        system,
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1, user_location: { type: "approximate", country: "GB" } }],
      },
      { timeout: 40000 }
    );

    for (const block of res.content || []) {
      if (block.type === "text") {
        text += block.text;
        for (const c of block.citations || []) if (c.url) urls.push(c.url);
      }
    }

    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content });
  }

  return { text, urls };
}

function cleanName(s) {
  return s.replace(/[*_`#]/g, "").trim();
}

// Did the answer mention this shop?
function mentionsShop(answer, shop) {
  const lower = answer.text.toLowerCase();
  const domain = shop.domain.toLowerCase();
  const root = domain.split(".")[0];
  const name = shop.shopName.toLowerCase().trim();

  if (lower.includes(domain)) return true;
  if (name.length >= 4 && lower.includes(name)) return true;
  if (root.length >= 5 && lower.replace(/\s+/g, "").includes(root)) return true;
  return answer.urls.some((u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "").endsWith(domain);
    } catch {
      return false;
    }
  });
}

function shopsListed(answer) {
  const line = answer.text.split("\n").reverse().find((l) => /^\s*\**\s*SHOPS\s*:/i.test(l));
  if (!line) return [];
  return line
    .replace(/^\s*\**\s*SHOPS\s*:\s*/i, "")
    .split("|")
    .map(cleanName)
    .filter((s) => s && s.length < 60);
}

// Run a few questions at a time so we don't hit rate limits.
async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

export async function testVisibility(shop, questions) {
  const results = await inBatches(questions, Number(process.env.PARALLEL_SEARCHES || 5), async (q) => {
    try {
      const answer = await askAssistant(q);
      return { question: q, found: mentionsShop(answer, shop), shops: shopsListed(answer), ok: true };
    } catch (e) {
      console.error("Question failed:", q, e?.message);
      return { question: q, found: false, shops: [], ok: false };
    }
  });

  // Count which other shops come up most.
  const counts = new Map();
  const own = [shop.shopName.toLowerCase(), shop.domain.split(".")[0]];
  for (const r of results) {
    for (const s of r.shops) {
      const key = s.toLowerCase();
      if (own.some((o) => o.length >= 4 && key.includes(o))) continue;
      const existing = counts.get(key) || { name: s, count: 0 };
      existing.count += 1;
      counts.set(key, existing);
    }
  }
  const competitors = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return { results, competitors };
}

export function label(visibilityPct) {
  if (visibilityPct >= 70) return "Often recommended";
  if (visibilityPct >= 40) return "Sometimes seen";
  if (visibilityPct > 0) return "Rarely seen";
  return "Invisible to AI";
}
