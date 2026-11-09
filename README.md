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
- `RESEND_API_KEY`: emails you each new enquiry (to NOTIFY_EMAIL, default doesaiseemystore@outlook.com)
- `NEXT_PUBLIC_CONTACT_EMAIL`: email shown in the footer and on the contact page
- `FREE_SCANS_PER_DAY` (default 2), `OWNER_SCANS_PER_DAY` (default 20), `IP_SCANS_PER_DAY` (default 6)
- `QUESTION_COUNT` (default 10; when an owner adds their own questions we write fewer so the total stays the same), `CACHE_HOURS` (default 24), `REPORT_DAYS` (default 90), `H2H_PER_DAY` (head-to-head comparisons per visitor per day, default 15)
- `OPENAI_MODEL` (default gpt-5-mini), `CLAUDE_MODEL`, `CLAUDE_SEARCH_MODEL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`: Cloudflare "are you human?" check

Remember to redeploy after changing settings.

## Optional settings (Vercel → Settings → Environment Variables)
- `NEXT_PUBLIC_FREE_REPORTS`: full reports are free by default. Set to `0` to switch back to "Enquire now".
- `NEXT_PUBLIC_EMAIL_REPORTS`: set to `1` once your domain is verified in Resend, to show "Email me my report".
- `NOTIFY_FROM`: the sender for emails, e.g. `DoesAISeeMyStore <hello@doesaiseemystore.com>` (needs your domain verified in Resend).
- `NEXT_PUBLIC_OWNER_NAME`: name shown in the footer (default "Jake").
- `NEXT_PUBLIC_BUSINESS_ADDRESS`: your business address, shown in the footer, Terms and Privacy when set.
- `INBOX_DAYS`: how long enquiries are kept (default 365). Reports are kept `REPORT_DAYS` (default 90).
- Homepage videos live in `public/media/` (how-it-works-dark/light .mp4 + still .jpg pictures).
- Client full-report links are made from the admin inbox ("Send report") and last 90 days.
