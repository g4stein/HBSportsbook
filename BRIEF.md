# Contest brief (reference copy)

Source: Housebets Contest Labs, "Housebets Sportsbook is coming" (Design track). Opened 4 Nov 2026, closes **14 Nov 2026, 18:00 UTC**. Prizes: $9,000, $4,000 and $2,000. Judged by the Housebets product and design team.

**How to win:** the sportsbook they would ship tomorrow wins.

## Scorecard (100 pts)
| Area | Pts | Where in this prototype |
|---|---|---|
| Sports home | 15 | `#/sports` |
| Live | 10 | `#/sports/live` |
| Football | 10 | `#/sports/football` (`?comp=pl` etc.) |
| Match page | 20 | `#/sports/match/ars-bha` |
| Bet slip + My bets | 20 | Side panel (desktop), bottom bar and sheet (phone), `#/sports/bets` |
| Feels like Housebets | 15 | Shell, tokens, Rewards/rakeback, Open Book |
| Every state: suspended, changed, failed | 10 | Live sim + Demo controls |

Ties are broken by the higher Match page score, then by Feels like Housebets.

## Required pages
1. **Sports home:** Live now, Starting soon, Top competitions, Sports nav, and Search (teams, players, competitions, markets).
2. **Live:** every match in play, filters by sport and competition, live score and clock, and Starting soon when nothing is live.
3. **Football:** PL, UCL, LaLiga, Serie A and Bundesliga, match result odds on each row, and following a team or competition.
4. **Match page:** Arsenal v Brighton live, with a scoreboard (score and clock). Market groups are Popular, Goals, Halves, Handicaps, Goalscorers, and Corners & cards. Odds move and markets get suspended.
5. **Bet slip + My bets:** tap odds to add them to the slip. Singles only, decimal odds and USDT stakes. Show stake, odds and potential return. When odds change the player must accept them. Also cover a suspended selection, bet placed, bet failed, and My bets (open, settled, cash out). Bet slip and My bets share one page.

**Out of scope:** multis, accumulators, bet builder, boosts, free bets, promos, outrights, specials, stats widgets, match trackers and AI search.

**Deliver:** all 5 pages, linked. Must work at 390px and 1440px. On phones the bet slip is a bar at the bottom. Front end only, at a public link with no login. Sample data only.

**Submission form:** the prototype link, all 5 pages ticked, a big idea of 80 to 800 characters, and the tools used.

**Rules to respect:** use sample fixtures and odds only, don't copy another sportsbook, use no real player data and no real money, and name every tool used.
