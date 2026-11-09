# Housebets Sportsbook · clickable prototype

My entry for the Housebets Contest Labs brief **"Housebets Sportsbook is coming"**. The brief is copied in [BRIEF.md](BRIEF.md).

It's a front-end-only prototype built inside the Housebets shell (top bar, left nav, side panel). It works at 390px (phone) and 1440px (desktop). **Sample data only:** demo USDT, no real money, no real accounts, and every individual player is fictional.

## Pages (all linked)
| # | Page | Route |
|---|---|---|
| 1 | Sports home | `#/sports` |
| 2 | Live | `#/sports/live` |
| 3 | Football | `#/sports/football` (`?comp=pl`, `ucl`, `laliga`, `seriea`, `bundesliga`) |
| 4 | Match page: Arsenal v Brighton, live | `#/sports/match/ars-bha` |
| 5 | Bet slip + My bets (one page) | `#/sports/bets`. Also the desktop side panel, plus the phone bottom bar and sheet |

## Big idea: Open Book
Housebets already shows the house edge on every casino game and shares it back as rakeback. Open Book brings that to sport. Every market shows its edge. With Open Book switched on, each price also shows its fair price (the odds with no margin). The slip shows the edge on your bet and the instant rakeback it earns before you place it. All prices come from a live model (Poisson goals scaled by the clock), so odds move in a consistent way with the score and time, suspend on goals, and settle themselves.

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
