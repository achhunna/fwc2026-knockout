# FWC26 Circle Draw

FWC26 Circle Draw is an interactive knockout bracket viewer for the World Cup 2026 tournament. It renders the draw as concentric circles, lets you advance winners through each round, and shows completed-match scores for eliminated teams.

## What the app does

- Displays the knockout bracket as a circular layout.
- Lets a winner be selected for each playable pairing.
- Advances selected teams into later rounds when the chosen team matches one of the two teams in the pair.
- Shows completed-match scores in the UI for teams that have already been eliminated.
- Celebrates the championship winner once the final is settled.

## Live data

The app can build bracket state from the live World Cup 2026 data source at `https://worldcup26.ir`:

- Team data is loaded from `/get/teams`.
- Game data is loaded from `/get/games`.
- Bracket winners are derived from finished matches using the reported scores.
- Score labels include penalty shootout results when available, for example `(0-0)PK:4-3`.

## Supported rounds

- `r32`
- `r16`
- `qf`
- `sf`
- `final`

The third-place match is not part of the current bracket tree.
