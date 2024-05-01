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

From our side, we introduced a new systemic approach to categorizing the sources of our puzzles. Previously, we had a single dimension of "difficulty" now we have different sets of puzzle variants (e.g. Trioshift) and those variants need to be treated differently systemically!

### Augmentations

If you want a comprehensive understanding of what the original version of our per-game extension system looked like, you can read (with code) ["How the Puzzmo API handles integrations on a per-game basis"](https://blog.puzzmo.com/posts/2024/03/28/an-ode-to-game-plugins/), the TDLR: each game has a server-level plugin which is encapsulated in a single file.

This plugin system is great because I can easily test it, see changes in pull requests and debug it trivially by looking at the code. The downside, is that all of this work happens in the API, which is a system the games team basically never contribute to. This becomes particularly evident looking at plugins for the games I would play daily vs the ones I play mainly for work.

This system works great, but it concentrates control the wrong place. So, what did we do to fix that? When making a daily game we have two separate sets of concerns: Making a good game, and making good puzzles for it. I wanted to find a way to distribute control over the systemic parts of Puzzmo across those two sets of folks.

Here's how it works. 

### Deeds

We used to have 4 metric integers which were attached to a gameplay session, each game could store 1-4 values which could be used for leaderboards,  news, the completion table and other app-wide concerns. This concept was dropped.

Now, we have a generalized "Deed" system where completing a gameplay session would create a key value store which looks like:

```json
[
  { "id": "points", "value": 2998, "persist": true },
  { "id": "moves", "value": 19, "persist": true },
  { "id": "excess-moves", "value": 4, "persist": true },
  { "id": "time", "value": 15.11, "persist": true },
  { "id": "longest-time-between-rotations", "value": 1416 },
  { "id": "shortest-time-between-rotations", "value": 308 },
  { "id": "total-interactions", "value": 19 }
]
```

Or in  TypeScript types:

```ts
type PipelineDeed = {
  /** The key value, this wants to be terse, kebab-case */
  id: string
  /** Any value the deed represents. A value of null or undefined is ignored by the API.  */
  value: any
  /** For deeds like 'best-word' on spelltower */
  textRepresentation?: string | null
}

type PersistedDeed = {
  /** The key value, this wants to be terse, kebab-case */
  id: DeedKeys
  /** The number the deed represents. A value of null or undefined is ignored by the API. */
  value: number
  /** For deeds like 'best-word' on spelltower */
  textRepresentation?: string | null
  /** Should this get stored on the user for history etc? */
  persist?: true
}
```
