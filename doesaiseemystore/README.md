# DoesAISeeMyStore

A free tool where a store owner enters their website and sees whether AI shopping assistants recommend them.

## How it works
1. Reads the shop (product list on Shopify shops, homepage text on others).
2. Claude grades the product information and writes realistic UK shopping questions.
3. Each question is asked to Claude with web search switched on, like a real shopper.
4. The site checks whether the shop was mentioned, who was recommended instead, and shows a score and top fixes.

## Files
- `app/page.js`: the page people see
- `app/globals.css`: the look and colours
- `app/api/scan/route.js`: runs a scan
- `lib/shop.js`: reads the shop's website
- `lib/analyse.js`: the AI part

## Putting it online (Vercel)
1. Upload this folder to a new GitHub repository.
2. In Vercel: Add New Project, pick the repository.
3. Under Environment Variables add `ANTHROPIC_API_KEY` with your key.
4. Click Deploy.

## Settings you can change in Vercel (optional)
- `QUESTION_COUNT`: searches per scan (default 5)
- `SCANS_PER_DAY`: free scans per visitor (default 3)
- `CLAUDE_MODEL`, `CLAUDE_SEARCH_MODEL`: which Claude models to use
- `PARALLEL_SEARCHES`: how many searches run at once (default 5)

Note: web search must be enabled for your organisation in the Claude Console.
