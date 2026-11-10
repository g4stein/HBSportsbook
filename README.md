# Housebets Sportsbook · clickable prototype

My entry for the Housebets Contest Labs brief **"Housebets Sportsbook is coming"**. The brief is copied in [BRIEF.md](BRIEF.md).

It's a front-end-only prototype built inside the Housebets shell (top bar, left nav, side panel). It works at 390px (phone) and 1440px (desktop). **Sample data only:** demo USDT, no real money, no real accounts, and every individual player is fictional.

## Pages (all linked)
| # | Page | Route |
|---|---|---|
| 1 | Sports home | `#/sports` |
| 2 | Live | `#/sports/live` |
| 3 | Football | `#/sports/football`: the 5 leagues pinned as tabs (`?comp=pl`, `ucl`, `laliga`, `seriea`, `bundesliga`), All / Live / Upcoming / Following filter (`?filter=`), every other league in a country A–Z, follow teams and competitions |
| 4 | Match page: Arsenal v Brighton, live | `#/sports/match/ars-bha` |
| 5 | Bet slip + My bets (one page) | `#/sports/bets`. Also the desktop side panel, plus the phone bottom bar and sheet |

## Big idea (paste into the entry form, 571 characters)
> Open Book. Housebets already shares its house edge as rakeback; Open Book makes that edge visible in sport. Every market shows its house edge, one switch reveals the fair price (0% margin) under every odd, and the slip shows the edge on each single and the instant rakeback it earns before you place it. Prices come from a live model, so odds move with the score and the clock, markets suspend on goals, attacks and red cards, and bets settle themselves. It sits inside the Housebets shell with Housebets cards, colours and type, so it feels like the site, not a plug-in.

## States (10 pts)
These all happen on their own as matches play. **Demo** (in the top bar, and inside the slip) also triggers them on demand:
- **Odds changed:** the slip shows the old and new price, and the place button becomes *Accept new odds*. Odds can also move while a bet is being placed.
- **Suspended:** dangerous attacks and goals suspend the whole match, and individual markets get suspended at random. Buttons lock with a hatch pattern and the slip blocks placement.
- **Bet failed:** an inline reason is shown, nothing is taken from the balance, and you can *Try again*.
- **Bet placed:** a receipt with a bet ID, *Reuse selections*, and a link to My bets.
- **Nothing live:** the Live page falls back to Starting soon.
- **My bets:** open bets have a live cash out value with a two-step confirm (cancelled automatically if the value changes). Settled bets cover won, lost, void and cashed out, each with a receipt. Bets settle automatically, including early settlement (for example, Over 1.5 settles once the second goal goes in).

## Run
```bash
npm install
npm run dev      # local
npm run build    # static build in dist/
```
Uses HashRouter and relative asset paths, so it works on GitHub Pages, Netlify or Vercel without config.

## Tools
React 18, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router, lucide-react icons, and Figtree and Red Hat Display via Fontsource. Built with Kiro (an AI coding assistant running Claude). No UI kit or template. Crests are generated shapes, not club badges.

## Scope check
Not included anywhere, as the brief requires: multis, accumulators, bet builder, boosts, free bets, promos, outrights, specials, stats widgets, match trackers, pitch visuals, AI search. The scoreboard shows only score, clock, scorers, corners, yellow and red cards (the context the Corners & cards markets need). Search is plain text matching.

## Embedding
The entry form loads prototypes in an iframe. No framing headers are set, and preferences fall back to memory when the browser blocks storage inside iframes, so the prototype runs the same embedded.
