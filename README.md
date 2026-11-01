# DoesAISeeMyStore

A free tool where a store owner enters their website and sees whether AI shopping assistants (ChatGPT and Claude) recommend them.

## How it works
1. Reads the store: Shopify product list, WooCommerce product list, or product pages from the sitemap.
2. Claude grades the product information and writes realistic UK shopping questions.
3. Each question is asked to ChatGPT and Claude with web search switched on, like a real shopper.
4. Shows a score, which searches mentioned the store, who was recommended instead, and top fixes.
5. Every report gets its own shareable link (/report/xxxx), kept for 90 days.

## Settings (Vercel > Settings > Environment Variables)
Required:
- `ANTHROPIC_API_KEY`: Claude key
- Database: connect Upstash Redis from Vercel's Storage/Marketplace tab (adds its own keys)

Recommended:
- `OPENAI_API_KEY`: turns on ChatGPT testing
- `ADMIN_KEY`: your private owner password. Visit /api/owner?key=YOUR_ADMIN_KEY once per device for the owner allowance. /api/owner?logout=1 removes it.

Optional:
- `NEXT_PUBLIC_CONTACT_EMAIL`: email shown in the footer and on the contact page
- `FREE_SCANS_PER_DAY` (default 2), `OWNER_SCANS_PER_DAY` (default 20), `IP_SCANS_PER_DAY` (default 6)
- `QUESTION_COUNT` (default 10), `CACHE_HOURS` (default 24), `REPORT_DAYS` (default 90)
- `OPENAI_MODEL` (default gpt-5-mini), `CLAUDE_MODEL`, `CLAUDE_SEARCH_MODEL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`: Cloudflare "are you human?" check

Remember to redeploy after changing settings.
