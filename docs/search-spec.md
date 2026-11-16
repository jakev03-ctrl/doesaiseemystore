# Search rebuild: agreed spec (Nov 2026)

Behind-the-scenes search changes only. Claude only (one API key). 10 questions for now.

## 1. Get to know the store
- Owner's form input is a brief, checked against the real store.
- Read: homepage, about/our story, collections, all products (up to 250), delivery, returns, contact/footer, FAQ, social links, reviews.
- Build a store profile: what they sell (category shares, bestsellers), where they sell (based, ships to, currency), who they are (story, founder, years trading, all name variants), how big (products, collections, price range, reviews, shops), values (eco, handmade, vegan, ethical, local, certifications), who buys, positioning, what makes them different, real delivery/returns terms, mismatches with owner input.
- The profile feeds stages 2, 4, 5 and 6.

## 2. The 10 questions: 6 broad + 4 personal
- Broad (fixed slots, owner extra info in at most 2): best overall, budget, gift/season, quality/feature, specific product type, second angle (can be "trending now").
- Personal (one profile trait each, never describing the store exactly): home turf "best [what they're known for] in [where they sell]" from 2-3 website key words; their typical customer; a need/problem; independent/small makers.
- Owner's own questions go on top. Local currency, spelling and season. Quality check for repeats. Save each store's questions so rechecks reuse them. All 10 count in the score (home turf counts double, see stage 7).

## 3. Asking the AI
- Send each question exactly as a shopper types it: no steering instructions, only today's date and rough location (country; town only for local questions).
- Mix phrasing: short search-style, chatty with context, very specific need.
- Up to 5 web searches per question. Retry a failed search once.
- Keep from each answer: the AI's own search terms, every page in its search results, all stores/products in order with prices, reasons for picks, how the store was described, big brands vs independents, source dates.
- Build a market picture across all answers. Save every check in full to track the store and market over time.

## 4. Judging the answers
- A cheap reader step per answer (answer + pages searched + store profile). Every extracted name must appear in the answer.
- Per store mentioned: merged name, type (independent / big brand / big retailer / marketplace), position, role, products and prices, reasons, tone.
- Store level: top pick 100, recommended 75, mentioned 35, via marketplace 30, found but not chosen 10, not found 0, warned against 0 + flag.
- Context-aware matching using all names, web address, products, social handles; links checked directly as backup.
- Check facts AI states about the store against the profile.
- Clean competitor picture (real competitors separate from brands/retailers/marketplaces, position-weighted share, reasons).
- Per-question verdict on why the store won or lost.

## 5. Follow-up tests (not in the score)
- Knowledge ladder: recommended unprompted / shows up when pushed / known by name, not recommended / unknown.
- Up to 3, chosen from what happened: A the push (same chat: "any smaller or independent shops?"), B the name check (same chat: "what about [store]? how do they compare?"), C one narrower question for the weakest area, built from the profile.

## 6. Why the winners win
- Top 1-2 real competitors AI picks (especially on home turf). Read their sites with the stage 1 reader.
- Side-by-side comparison with evidence; link to AI's own stated reasons; store strengths, gaps, quick wins it already has but AI can't see.
- Name check and accuracy check fold in here, against the real delivery/returns pages.
- AI shopping playbook (official merchant guidance, research, industry data; dated, refreshed every few months): every piece of advice must point to a playbook factor plus real evidence from the check.

## 7. The score
- AI Visibility Score 0-100: average of stage 4 levels, home turf counts double. Nothing else mixed in.
- Ranks: Ghost 0-14, Whisper 15-34, On the radar 35-54, Contender 55-74, AI's favourite 75-100, plus "X points to [next rank]".
- Mini-scores: broad reach, home turf, AI knows you (ladder rung), AI gets you right (accuracy).
- AI-ready checklist (evidence-based, from the playbook) replaces the readability opinion.
- Store type (visibility vs readiness): The favourite, Hidden gem, Riding your reputation, Starting line.
- Market context: share of recommendations, market type; comparisons with similar stores only once there's enough real data.
- Symbols: eye-based badge family (closed eye for Ghost, opening to a gold wide-awake eye for AI's favourite); store types: gold shield + star, teal diamond, purple rising arrow, flag on a start line.
