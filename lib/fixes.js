// The fix library: tested, step-by-step fixes the report's action plan is built from.
// The report writer picks the fixes that match THIS store's evidence and writes the "why";
// the steps ("Do this") and "How you'll know it's working" come from here, word for word.
//
// Rules for this file:
// - Steps name only menus we're confident exist. Where a platform's menus vary, the steps stay general.
// - Never name a paid app. Official, free tools (Google Merchant Center, Bing Webmaster Tools) are fine.
// - "works" is a sign to look for, never a promise (no sales figures, no guarantees).
// - region "US" = only live for US shoppers so far: never offered to stores checked for another country.
//
// Researched 21 November 2026, from official help pages and launch coverage. Review every 3 months
// (next: February 2027): AI shopping is changing fast.
//   Google AI Mode and Gemini shopping draw on Merchant Center and the Shopping Graph (Google, 2025–26).
//   Bing Webmaster Tools: Copilot runs on Bing's index; "AI Performance" report (public preview, Feb 2026).
//   Businesses in ChatGPT / Business Hub: beta from 10 Nov 2026; claim, correct details, see mentions.
//   ChatGPT shopping results: US only so far; Shopify catalogues are included automatically.
//   Earned media: most AI citations come from editorial and third-party sources (Muck Rack, May 2026).

export const PLATFORM_KEYS = { Shopify: "shopify", WooCommerce: "woocommerce", Squarespace: "squarespace", Wix: "wix", BigCommerce: "bigcommerce", WordPress: "wordpress" };
export const platformKey = (p) => PLATFORM_KEYS[p] || "other";

export const FIXES = {
  "let-ai-in": {
    factor: "F1",
    title: "Let AI search robots read your site",
    when: "the checklist shows AI search robots are blocked",
    effort: "20 min",
    steps: {
      shopify: [
        "Shopify: Online Store → Themes → ⋯ → Edit code, and look for a robots.txt.liquid file.",
        "If it blocks OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot or Google, remove those lines (or ask your developer to).",
        "If there's no robots.txt.liquid file, the block is coming from elsewhere (an app or your domain settings): ask your developer.",
      ],
      other: [
        "Ask your web person to check your robots.txt file (yourstore.co.uk/robots.txt).",
        "Make sure it doesn't block the AI search robots: OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot and Googlebot.",
        "Also check any firewall or bot protection isn't turning them away.",
      ],
    },
    works: "Your next check shows \"AI search robots allowed\" ticked, and AI answers can start quoting your pages.",
  },

  "merchant-center": {
    factor: "F11",
    title: "List your products free on Google",
    when: "any store selling products online: Google's AI shopping answers draw on Merchant Center",
    effort: "1 hr",
    steps: {
      shopify: [
        "Shopify: Settings → Apps and sales channels → Shopify App Store, and add Google's free \"Google & YouTube\" channel.",
        "Connect (or create) your Google Merchant Center account and let it sync your products.",
        "In Merchant Center, check free listings are switched on and fix any products marked \"Not approved\".",
      ],
      woocommerce: [
        "WooCommerce: Plugins → Add New, search for Google's free \"Google for WooCommerce\" plugin and install it.",
        "Follow its set-up to connect Google Merchant Center and sync your products.",
        "In Merchant Center, check free listings are switched on and fix any products marked \"Not approved\".",
      ],
      bigcommerce: [
        "BigCommerce: Channel Manager → Create channel, and add Google Shopping (free to connect).",
        "Connect (or create) your Google Merchant Center account and let it sync your products.",
        "In Merchant Center, check free listings are switched on and fix any products marked \"Not approved\".",
      ],
      other: [
        "Go to merchants.google.com and set up a free Google Merchant Center account for your shop.",
        "Add your products (most shop platforms have a free Google connection; otherwise upload a product file).",
        "Check free listings are switched on and fix any products marked \"Not approved\".",
      ],
    },
    works: "Merchant Center shows your products as approved. Over the following weeks they can start showing in Google's shopping results, including its AI answers.",
  },

  "bing-webmaster": {
    factor: "F11",
    title: "Add your shop to Bing Webmaster Tools",
    when: "stores not yet set up with Bing: Microsoft Copilot answers from Bing's index",
    effort: "20 min",
    steps: {
      other: [
        "Go to bing.com/webmasters and sign in (it's free).",
        "Add your site. If you use Google Search Console, choose \"Import\" to copy it across in one go.",
        "Submit your sitemap (yourstore.co.uk/sitemap.xml).",
      ],
    },
    works: "Bing shows your pages as indexed, and its \"AI Performance\" report shows when Copilot cites your site.",
  },

  "claim-chatgpt": {
    factor: "F10",
    title: "Claim your business in ChatGPT",
    when: "AI got facts about the store wrong or missing (accuracy table), or AI didn't know the store by name",
    effort: "30 min",
    steps: {
      other: [
        "In ChatGPT, open Business Hub from the sidebar (a new beta, so it may not be available to every business yet).",
        "Search for your business, claim it and complete the verification.",
        "Check the details ChatGPT shows and correct anything that's wrong or out of date.",
      ],
    },
    works: "When asked about you by name, ChatGPT describes you the way your own pages do. Business Hub also shows how often you're mentioned.",
  },

  "chatgpt-products": {
    factor: "F11",
    region: "US",
    title: "Get your products into ChatGPT shopping",
    when: "stores selling to US shoppers",
    effort: "30 min",
    steps: {
      shopify: [
        "Shopify catalogues are shared with ChatGPT automatically. In Shopify admin, check your store's AI channels (agentic storefronts) are switched on.",
        "Keep product titles, prices and stock accurate: that's what ChatGPT shows.",
      ],
      other: [
        "Apply at chatgpt.com/merchants to share a product feed with ChatGPT.",
        "Keep product titles, prices and stock accurate in the feed: that's what ChatGPT shows.",
      ],
    },
    works: "Your products can appear as product cards when US shoppers ask ChatGPT what to buy.",
  },

  "delivery-on-product": {
    factor: "F7",
    title: "Show delivery details on every product page",
    when: "delivery info is only at checkout or on a separate page, or AI gave unclear delivery answers",
    effort: "30 min",
    steps: {
      shopify: [
        "Shopify: Online Store → Themes → Customize, then open a product page template.",
        "Add a text or collapsible-row block called \"Delivery\" with your costs, free-delivery threshold and dispatch time.",
        "Make sure it says exactly the same as your delivery page.",
      ],
      woocommerce: [
        "Write one short delivery line: costs, free-delivery threshold and dispatch time.",
        "Add it where it shows on every product page (your theme's product template, or each product's short description).",
        "Make sure it says exactly the same as your delivery page.",
      ],
      other: [
        "Write one short delivery line: costs, free-delivery threshold and dispatch time.",
        "Add it to your product page template so it shows on every product (ask your web person if you can't find the template).",
        "Make sure it says exactly the same as your delivery page.",
      ],
    },
    works: "When AI is asked about your delivery, it gives one clear answer instead of a warning.",
  },

  "one-story": {
    factor: "F13",
    title: "Make your delivery and returns say the same everywhere",
    when: "AI found conflicting prices, thresholds or return periods for the store",
    effort: "1 hr",
    steps: {
      other: [
        "Decide your current delivery costs, free-delivery threshold and returns window.",
        "Update your delivery page, returns page, product pages, banner and FAQ so they all match.",
        "Update any marketplace or retailer listings that quote your terms too.",
      ],
    },
    works: "AI stops quoting different figures for you, and the \"Does AI get you right?\" table shows fewer mismatches.",
  },

  "returns-page": {
    factor: "F7",
    title: "Add a clear returns page",
    when: "no returns page was found and the site isn't one we couldn't read",
    effort: "30 min",
    steps: {
      shopify: [
        "Shopify: Settings → Policies, and fill in your return and refund policy in plain words.",
        "Online Store → Navigation → Footer menu, and add a link to it.",
      ],
      woocommerce: [
        "Pages → Add New, and write your returns policy in plain words (window, condition, who pays postage).",
        "Appearance → Menus (or the site editor), and link it in your footer.",
      ],
      squarespace: [
        "Squarespace: Pages panel → +, and add a page for your returns policy, in plain words: the window, the condition items must be in, and who pays postage.",
        "Link it from your footer so it's on every page.",
      ],
      wix: [
        "Wix: Pages & Menu → + Add Page for your returns policy, in plain words: the window, the condition items must be in, and who pays postage.",
        "Link it from your footer so it's on every page.",
      ],
      bigcommerce: [
        "BigCommerce: Storefront → Web Pages → Create a web page for your returns policy, in plain words: the window, the condition items must be in, and who pays postage.",
        "Link it from your footer so it's on every page.",
      ],
      other: [
        "Add a returns page: the window, the condition items must be in, and who pays postage.",
        "Link it from your footer so it's on every page.",
      ],
    },
    works: "When asked about returns, AI quotes your own policy instead of guessing or using another site.",
  },

  "reviews-visible": {
    factor: "F8",
    title: "Make your reviews visible to AI",
    when: "the checklist shows reviews aren't visible to AI",
    effort: "Ask your web person",
    steps: {
      shopify: [
        "Open a product page with your browser's \"view page source\" and search for a review: if it isn't in the page text, AI can't see it either.",
        "Ask your reviews app's support to show star ratings and review text in the page itself (not only after clicking) and to switch on review structured data.",
      ],
      woocommerce: [
        "WooCommerce: Settings → Products, and make sure product reviews and star ratings are switched on.",
        "Check a product page shows its reviews without clicking a tab that loads later.",
      ],
      other: [
        "Check your product pages show star ratings and review text without clicking or waiting.",
        "Ask your reviews provider or web person to add review structured data to product pages.",
      ],
    },
    works: "Your next check shows \"Reviews AI can see\" ticked, and AI answers start mentioning what customers say.",
  },

  "review-requests": {
    factor: "F9",
    title: "Ask happy customers for reviews on independent sites",
    when: "few or no independent reviews were found, or reviews are thin compared with the stores AI picked",
    effort: "30 min",
    steps: {
      other: [
        "Pick one independent review site AI already quotes for shops like yours (often Trustpilot or Google).",
        "Add a polite, honest request to your order follow-up email: no incentives, and ask for honest reviews, good or bad.",
        "Reply to reviews, especially critical ones, calmly and helpfully.",
      ],
    },
    works: "Over the next few months, AI answers about you start quoting more recent reviews.",
  },

  "product-details": {
    factor: "F6",
    title: "Add specific facts to your product pages",
    when: "few products list specific details (sizes, materials, ingredients, measurements)",
    effort: "Half a day",
    steps: {
      shopify: [
        "Shopify: Products → open a best-seller, and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Fill in the product's category and its attributes (just below the description) so the details are labelled too.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
      woocommerce: [
        "WooCommerce: Products → All Products → edit a best-seller, and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Product data → Attributes, and add them there too so they're labelled.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
      squarespace: [
        "Squarespace: Commerce → Inventory → open a best-seller, and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Write them as plain facts (\"100% organic cotton, 220gsm\") rather than adjectives.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
      wix: [
        "Wix: Catalog → Store Products → Products → open a best-seller, and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Write them as plain facts (\"100% organic cotton, 220gsm\") rather than adjectives.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
      bigcommerce: [
        "BigCommerce: Products → View → edit a best-seller, and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Write them as plain facts (\"100% organic cotton, 220gsm\") rather than adjectives.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
      other: [
        "Open a best-seller and add the facts a shopper asks about: size, materials, weight, ingredients, care.",
        "Write them as plain facts (\"100% organic cotton, 220gsm\") rather than adjectives.",
        "Start with your 10–20 best-sellers, then work through the rest.",
      ],
    },
    works: "Your next check shows more products with specific details, and AI starts quoting those facts when it recommends you.",
  },

  "question-answers": {
    factor: "F7",
    title: "Answer shoppers' questions on your pages",
    when: "AI chose other stores because their pages answered the question asked (fit, warmth, durability, suitability)",
    effort: "1 hr",
    steps: {
      shopify: [
        "Take 3–5 questions from your lost searches in this report.",
        "Shopify: Online Store → Themes → Customize, and add a collapsible-row (FAQ) block to the product or collection page they're about.",
        "Use each question as the heading and answer it in one or two plain sentences.",
      ],
      other: [
        "Take 3–5 questions from your lost searches in this report.",
        "Add them as headings on the product or collection page they're about, with a short, plain answer under each.",
      ],
    },
    works: "When shoppers ask those questions, AI has an answer of yours it can quote. Watch those searches in your next check.",
  },

  "intent-collection": {
    factor: "F12",
    title: "Make a page for a common shopper request",
    when: "AI picked stores with a page for a budget, occasion or need (e.g. gifts under £20) that this store doesn't have",
    effort: "20 min",
    steps: {
      shopify: [
        "Shopify: Products → Collections → Create collection.",
        "Choose \"Automated\" and set a condition, e.g. price is less than 20, or a tag like \"gift\".",
        "Give it a plain title that matches how shoppers ask (\"Gifts under £20\"), add a short intro, and link it in your menu.",
      ],
      woocommerce: [
        "WooCommerce: Products → Categories, and add a category named how shoppers ask (\"Gifts under £20\").",
        "Add the matching products to it, write a short description, and link it in your menu.",
      ],
      other: [
        "Create a collection or category named the way shoppers ask (\"Gifts under £20\").",
        "Add the matching products, write a short intro, and link it in your menu.",
      ],
    },
    works: "When shoppers ask for that kind of thing, there's a page of yours that answers it. Watch that search in your next check.",
  },

  "about-page": {
    factor: "F10",
    title: "Tell your story clearly on an About page",
    when: "no clear About page was found, or AI got who the store is wrong",
    effort: "1 hr",
    steps: {
      shopify: [
        "Shopify: Online Store → Pages → Add page, called \"About us\".",
        "Say who you are, where you're based, how long you've been trading, what you make or choose, and what makes you different.",
        "Online Store → Navigation, and link it in your main menu and footer.",
      ],
      woocommerce: [
        "Pages → Add New, called \"About us\".",
        "Say who you are, where you're based, how long you've been trading, what you make or choose, and what makes you different.",
        "Link it in your main menu and footer.",
      ],
      squarespace: [
        "Squarespace: Pages panel → +, and add a page called \"About us\".",
        "Say who you are, where you're based, how long you've been trading, what you make or choose, and what makes you different.",
        "Link it in your main menu and footer.",
      ],
      wix: [
        "Wix: Pages & Menu → + Add Page called \"About us\".",
        "Say who you are, where you're based, how long you've been trading, what you make or choose, and what makes you different.",
        "Link it in your main menu and footer.",
      ],
      bigcommerce: [
        "BigCommerce: Storefront → Web Pages → Create a web page called \"About us\".",
        "Say who you are, where you're based, how long you've been trading, what you make or choose, and what makes you different.",
        "Link it in your main menu and footer.",
      ],
      other: [
        "Add an \"About us\" page: who you are, where you're based, how long you've been trading, and what makes you different.",
        "Link it in your main menu and footer.",
      ],
    },
    works: "When asked about you by name, AI describes you in your own words.",
  },

  "say-maker": {
    factor: "F5",
    title: "Say clearly that you make or design your products",
    when: "the store makes, designs or chooses its own products but the pages don't say so",
    effort: "20 min",
    steps: {
      other: [
        "Add one plain line to your About page and product descriptions: who makes the product and where (\"Designed and made by us in Leeds\").",
        "Make sure the brand name on your products matches your shop name.",
      ],
    },
    works: "AI starts describing you as the maker, not just another seller.",
  },

  "shop-addresses": {
    factor: "F14",
    title: "Put your shop addresses and opening hours on your site",
    when: "the store has physical shops but no addresses were found on its site",
    effort: "1 hr",
    steps: {
      shopify: [
        "Shopify: Online Store → Pages → Add page called \"Our shops\", with each address, postcode and opening hours as text (not only a map).",
        "Online Store → Navigation, and link it in your footer.",
        "Check each shop's Google Business Profile matches it exactly.",
      ],
      squarespace: [
        "Squarespace: Pages panel → +, and add a page called \"Our shops\", with each address, postcode and opening hours as text (not only a map).",
        "Link it in your footer, and check each shop's Google Business Profile matches it exactly.",
      ],
      wix: [
        "Wix: Pages & Menu → + Add Page called \"Our shops\", with each address, postcode and opening hours as text (not only a map).",
        "Link it in your footer, and check each shop's Google Business Profile matches it exactly.",
      ],
      bigcommerce: [
        "BigCommerce: Storefront → Web Pages → Create a web page called \"Our shops\", with each address, postcode and opening hours as text (not only a map).",
        "Link it in your footer, and check each shop's Google Business Profile matches it exactly.",
      ],
      other: [
        "Add an \"Our shops\" page with each address, postcode and opening hours written as text (not only a map).",
        "Link it in your footer, and check each shop's Google Business Profile matches it exactly.",
      ],
    },
    works: "For town and \"near me\" searches, AI can name your shop with its address.",
  },

  "tidy-listings": {
    factor: "F13",
    title: "Tidy out-of-date and wrong listings",
    when: "stale items (old seasons, out of stock), £0 prices or contradictory options were found",
    effort: "30 min",
    steps: {
      shopify: [
        "Shopify: Products, and filter to old or out-of-stock items.",
        "Tick them → More actions → Archive (or set as Draft), and fix any wrong prices or options.",
      ],
      woocommerce: [
        "WooCommerce: Products → All Products, and find old or out-of-stock items.",
        "Move them to draft (or set them out of stock and hidden), and fix any wrong prices or options.",
      ],
      other: [
        "Find old-season, out-of-stock or wrongly priced products.",
        "Hide or remove them, and fix any wrong prices or options.",
      ],
    },
    works: "AI stops quoting old prices or products, and your next check has fewer stale items.",
  },

  "one-currency": {
    factor: "F3",
    title: "Show one currency and one price everywhere",
    when: "prices, banners or feeds disagree on price or currency",
    effort: "1 hr",
    steps: {
      shopify: [
        "Shopify: Settings → Markets, and check your main market sells in the right currency.",
        "Online Store → Themes → Customize, and make the announcement bar and any price text use the same currency.",
      ],
      other: [
        "Check your product pages, banners and any product feeds all show the same price in the same currency.",
        "Fix any text that still mentions an old price or currency.",
      ],
    },
    works: "AI quotes one correct price for your products.",
  },

  "check-product-data": {
    factor: "F3",
    title: "Check your product data shows price and stock",
    when: "the checklist shows product structured data is missing price, availability or brand",
    effort: "20 min",
    steps: {
      other: [
        "Paste one of your product page links into Google's free Rich Results Test (search.google.com/test/rich-results).",
        "Check it finds a \"Product\" with price, currency and availability.",
        "If anything's missing, ask your web person or theme support to add it.",
      ],
    },
    works: "The Rich Results Test shows your price and stock, and AI can quote them with confidence.",
  },

  "homepage-summary": {
    factor: "F10",
    title: "Add a short summary of your shop",
    when: "the homepage has no meta description or no plain-text summary of the business",
    effort: "10 min",
    steps: {
      shopify: [
        "Shopify: Online Store → Preferences.",
        "Fill in the homepage meta description in one or two plain sentences: what you sell, who for, and where you're based.",
      ],
      other: [
        "In your site's SEO or page settings for the homepage, add a one or two sentence description: what you sell, who for, and where you're based.",
      ],
    },
    works: "AI's one-line description of your shop matches your own words.",
  },

  "readable-without-scripts": {
    factor: "F2",
    title: "Make your pages readable without scripts",
    when: "the site only showed a 'please enable JavaScript' notice to our reader",
    effort: "Ask your web person",
    steps: {
      other: [
        "Ask your web person to make sure your homepage, collection pages and product pages put their main text, prices and links in the page itself, not only in scripts.",
        "They can test it by viewing a page with JavaScript switched off.",
      ],
    },
    works: "Our next check can read your pages, and so can AI tools that don't run scripts.",
  },

  "get-featured": {
    factor: "F9",
    title: "Get featured in guides AI reads",
    when: "AI's picks were backed by guides, lists, press or blogs that don't mention this store",
    effort: "2 hrs",
    steps: {
      other: [
        "Look at the sources in your report's searches: note 5 gift guides, blogs or local sites that cover shops like yours.",
        "Send each a short, personal email: what's special about one or two products, with a photo and the price, and offer a sample if it suits.",
        "When you're featured, link to it from your site (an \"As seen in\" line is enough).",
      ],
    },
    works: "Over the coming months, more sites show up under \"Your online reputation\" in your checks.",
  },

  "local-listing": {
    factor: "F14",
    title: "Check your Google Business Profile",
    when: "the store has physical shops and lost a local or 'near me' search",
    effort: "30 min",
    steps: {
      other: [
        "Search for your shop on Google Maps and check the listing exists and is claimed by you.",
        "Make sure the name, address, opening hours, website and photos are complete and match your site.",
      ],
    },
    works: "For local searches, AI can name your shop with the right address and hours.",
  },
};

// The library as the report writer sees it: only fixes for this store's region, with this platform's steps.
export function fixList({ platform, country }) {
  return Object.entries(FIXES)
    .filter(([, f]) => !f.region || f.region === country)
    .map(([id, f]) => `${id} | ${f.factor} | ${f.title} | use when: ${f.when}`)
    .join("\n");
}

export function fixSteps(id, platform) {
  const f = FIXES[id];
  if (!f) return null;
  const k = platformKey(platform);
  return f.steps[k] || f.steps.other || Object.values(f.steps)[0];
}
