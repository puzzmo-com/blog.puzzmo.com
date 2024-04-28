+++
title = 'Augmenting Puzzmo'
date = 2024-04-28T18:25:53+01:00
authors = ["orta"]
tags = ["tech", "leaderboards"]
theme = "outlook-hayesy-beta"
+++

After we launched Puzzmo, we sort of hit this moment of _"well... what now?"_. We had such a complete vision of what we wanted to build for v1, and had taken the extra time for polish passes that to a ++reasonable++ extent, we had a solid version one.

We'd never _really_ talked about version two, and on top of that, our team had just tripled in the last month. So - _what now?_

If you'll permit me to simplify, after weeks of discussion, we concluded that the path to a Puzzmo version two is _"Weird Puzzmo"_. Our main competitors are less nimble (they tend to have significantly larger support backlogs) and often aim to project a very serious tone. If we ship fast, experiment often and present ourselves as a more playful approach to daily puzzles - then we'd ideally be competing on our terms.

OK. So... How do we do that?

This blog post tries to cover the technical under-the-hood changes which I felt were necessary to get us to a point where weird Puzzmo was even possible. 

For a lot of our users, the sense that something interesting was happening to Puzzmo started on April 1 2024. For alpha users, they'd be slightly used to the idea that we take April Fools seriously, 2023's had Really Bad Chess simply play as the default chess board arrangement. For 2024, it was the first day we shipped something weird across all games.

What did that look like:

- `Cross|word` - A crossword that was **basically** only possible by using hints
- `TypeShift` - "Trioshift", a version of a Typeshift where there were only three letters, making is vertically massive but horizontally short
- `Flipart` - "☐☐☐☐art", a version where all the pieces are invisible
- `Really Bad Chess` - "Really Checkers Chess", a board where chess pieces were framed like checkers pieces
- `Cube Clear` - "ABCube Clear", instead of the usual scrabble-ish prioritised letters, it's A-Z.
- `Wordbind` - We presented the puzzle as though it were a placeholder which had been left in

These puzzles were all hand picked, and created 