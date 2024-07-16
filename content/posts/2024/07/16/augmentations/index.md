+++
title = 'Augmenting Puzzmo: Making weird possible'
date = 2024-07-16T01:25:53+01:00
authors = ["orta"]
tags = ["tech", "api", "systems", "leaderboards"]
theme = "outlook-hayesy-beta"
series = ["Integrating games to the server"]
+++

After we launched Puzzmo, there was this moment of _"well... what now?"_. Zach and I had such a complete vision of what we wanted to build for v1 from the idea phase 3 years ago. We even got a bit of extra time for polish pass due to wanting the acquisition to happen before launch, so to a __reasonable__ extent, we had a solid version 1 we were proud of. We'd never _really_ talked about version 2 in concrete though, and on top of that, our team had just tripled in the last month. So - _what now?_

To simplify, after weeks of discussion, we concluded that the path to a Puzzmo version two is _"Weird Puzzmo"_. Our main competitors are less nimble (they tend to have significantly larger support backlogs) and often aim to project a very serious tone. If we ship fast, experiment often and present ourselves as a more playful approach to a daily puzzle space - then we'd ideally be competing on our strengths.

OK. Well... How do we do that?

This blog post tries to cover the technical "under-the-hood" changes which I felt were necessary to make weird Puzzmo possible.

For a lot of our users, the sense that something interesting was happening to Puzzmo started on April 1 2024, it was the first day we shipped something weird across all games:

[What did that look like](https://www.puzzmo.com/today/2024-04-01):

- `Cross|word` - A crossword that was **basically** only possible by using hints
- `TypeShift` - "Trioshift", a version of a Typeshift where there were only three letters, making is vertically massive but horizontally short
- `Flipart` - "☐☐☐☐art", a version where all the pieces are invisible
- `Really Bad Chess` - "Really Checkers Chess", a board where chess pieces were framed like checkers pieces
- `Cube Clear` - "ABCube Clear", no scrabble-ish prioritised letters, now it's A-Z.
- `Wordbind` - As though it were a placeholder which had been left in

From our side, we use April Fools' as a deadline for a new systemic approach to categorizing the sources of our puzzles. Previously, we had a single dimension of "difficulty" now we have different sets of puzzle variants (e.g. Trioshift) and those variants have different Puzzmo-level integrations from traditional puzzles.

## Shifting control

If you want to understand of what the original version of our per-game extension system looked like, you can read (with code) ["How the Puzzmo API handles integrations on a per-game basis"](https://blog.puzzmo.com/posts/2024/03/28/an-ode-to-game-plugins/), the TDLR: each game has a server-level plugin written in TypeScript which is encapsulated in a single file.

This plugin system is great because I can easily test it, see changes in pull requests and debug it trivially by reading the code. The downside is that all of this work happens in the API, which is a system the games team basically never contributes to. This becomes particularly evident looking at the level of complexity for the games I would play daily being fully featured in news, stats, notables etc vs the ones I play mainly to test during development. 

This system worked great during the creation of our initial set of games because there were only a few of us and we all contributed everywhere, but it concentrated control in the wrong place. A game's level of integration to Puzzmo being tied to how much _I_ think it about isn't a great place to be. So, we needed _a technical solution that could open the way for a cultural change_ to give the games team more control over app-wide systems inside Puzzmo.

## Augmentations & Deeds & Expressions

The [answer I came up with](https://gist.github.com/orta/8d975a33a9be14ca0fba52c6aecfd454) is to build out three concurrent systems:

- Deeds: A key-value store for game progress/completion data
- Augmentations: A way to describe system hooks in outside of the API (e.g. in games, puzzles, admin tools)
- Expressions & Scopes: A way to write simple logic for augmentation-based integrations in strings

### Deeds

When I initially designed Puzzmo's data-models, I knew completing a puzzle across all games would create like:  `points`, `time`, `hints` etc, but I also accommodated for each game having different values unique to that game. So, we had 1 to 4 integers 'metrics' and a 'metrics string' array which correspond to different per-game stats generated while playing the puzzle. These variables get used for leaderboards, news, the completion table and other app-wide concerns. 

{{< details summary="Read our internal notes for per-game metrics"  >}}
```
/// Metrics for games

// Spelltower
// Metric 1: longest word length
// Metric 2: highest scoring word
// Metric 3: Full or partial complete (as 1 or 0)
// Metric 4: Number of words played
// Metric Strings:
//  0: Longest word
//  1: Highest scoring word

// Crossword
// None!

// RBC
// Metric 1: captured count
// Metric 2: Lost count
// Metric 3: Turns taken
// Metric Strings:
//  0: Current FEN
//  1: Current FEN -1 move

// Typeshift
// Metric 1: found words count
// Metric 2: 1 if a game where only core words were found, 2 if only other words were found, 3 if all core words were found and some other words were found, 0 if both

// Flip Art
// Metric 1: number of flips
// Metric 2: number of excess flips

// Wordbind
// Metric 1: number of words found
// Metric 2: Time to energetic
// Metric 3: List completion bonus +/- (par)
// Metric 4: Toughest word
// Metric Strings:
//  0: Toughest word text

// CubeClear
// Metric 1: Words found
// Metric 2: Solve score (extra tiles x 10 + words)
// Metric 3: Extra tiles

// PileUpPoker
// No metrics yet
```
{{< /details >}}

This metrics 1-4 aren't enough to do our entire data-pipelining though, so there is also an _additional_ set of variables which come during a game completion which we call `pipelineData`. Pipeline data is information the game engine generates which is only valid for the game completion pipeline and is not stored, here's an example of pipelineData for a Spelltower puzzle:

```ts
export type SpelltowerStats = {
  pipelineStats: [
    wordsFound: number,
    fullClear: number,
    partialClear: number,
    highestScoringWord: string,
    highestScoringWordScore: number,
    longestWord: string,
    longestScoringWordLength: number,
    wpm: number,
    averageWordLength: number,

    amountOfWordsGreaterThan8Chars: (number | undefined)[]
  ]
  /// ...
}
```

So, in summary we had information about a completed puzzle in:

- Core details like: Time, points, hints, pauses
- Metrics 1 to 4, and metrics string
- Pipeline data

To provide better tools, I needed to flatten these into a system. Today, we have a generalized "Deed" system where completing a puzzle has the game emitting an array of `key: value` pairs. Here's one for a game of Spelltower I have just completed:

```json
[
  { "id": "time", "value": 360.431, "persist": true },
  { "id": "hints", "value": 0, "persist": true },
  { "id": "points", "value": 779, "persist": true },
  { "id": "longest-word", "value": 7, "textRepresentation": "WILDEST", "persist": true },
  { "id": "best-word", "value": 602, "textRepresentation": "WILDEST", "persist": true },
  { "id": "completion-type", "value": 0, "persist": true },
  { "id": "bonus-tiles-used", "value": 1 },
  { "id": "line-clear-tiles-used", "value": 0 },
  { "id": "words-longer-than-4", "value": 1 },
  { "id": "time-before-first-word", "value": 103 },
  { "id": "words-found", "value": 8 },
  { "id": "wpm", "value": 1.33 },
  { "id": "avg-word-length", "value": 3.75 },
  { "id": "long-word-counts",  "value": [ 0, 0, 0, 0, 0, 0 ]}
]
```

{{< details summary="The TypeScript types" >}}

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

/** This is a controlled vocabulary, thus the bit of friction required to append to it. Keys should be generalizable across many games. */
export type DeedKeys =
  | "points"
  | "time"
  | "hints"
  | "words-found"
  | "moves"
  | "excess-moves"
  | "custom-time"
  | "completion-type"
  | "par"
  | "best-word"
  | "longest-word"
  | "time-to-best-word"
  | "avg-word-length"
  | "wpm"
  | "long-word-counts"
  | "captures"
  | "losses"
  | "hands"
  | "quality-hands"
  | "best-hands"
  | "mode"
  | "plonks"
```
{{< /details >}}

There's basically hints of all prior systems in this single array:

- A deed can be persisted or transitory
- A deed value can be any type, unless it is persisted (where it has to be a number)
- A deed can have text attached to it
- We have a controlled set of ids for persisted deeds (to try contain complexity)

Then by having it all flattened opens the door for making them available to augmentations and expression strings!

To keep the database small, every morning as the day swaps over for Puzzmo, we wipe all non-persisted deeds.

### Augmentations

The core idea is we have existing systems in place (leaderboard, news, groups etc) and "augmentations" provide hooks into those systems and extends those systems without having to write code. Generally speaking, there are two places where this happens:

- A puzzle being added to the daily
- When someone completes a puzzle

#### Puzzle Creation

Let's start with the puzzle being created. We extended the puzzle file format to support JSON front-matter. This is a technique used in blogging engines a lot (this post for example has front-matter describing its metadata like my authorship), and it means that we can ensure that the API/App systems continue to not understand/read the puzzle file's contents.

Here's an example of a puzzle which ran today:

```
---
{
  "_v": 1,
  "variant": {
    "slug": "lock",
    "subvariantSlug": "center-shift"
  }
}
---
1
7x6
6
18
0, 0, 3, 4, 2, 2, 0
WEZCIRS
*AIDHL*
*IDLLE*
**NGRD*
**EVET*
***A***
WAILERS
WIDGETS
WADDLES
WEEVILS
WIZARDS
WINCHES
WADDIES
[ Snip... ]
```

You can see the version number, and then we have the `variant` and `subVariant` information, these act like templates for the augmentations JSON. 

{{< details summary="The variant / subvariants" >}}

The `"lock"` variant does not have any augmentations, it looks like:

```json
{}
```

That's because for this case, everything is happening in `"center-shift"` which looks like:

```json
{
  "_v": 1,
  "displayName": "|Center|shift",
  "shortDescription": "Typeshift, but you can only move the center columns!",
  "augmentations": {
    "leaderboards": [
      {
        "order": "Higher=better",
        "valueExp": "tilesInFoundWords - tilesInPuzzle",
        "stableID": "game-typeshift:center:Repeated-letters",
        "displayName": "Repeated letter uses",
        "formatString": "%@",
        "sortValue": -100
      }
    ]
  }
}
```

This means when the puzzle is created, we combine all possible augmentations (which in this case is just a leaderboard from the subVariant) and then use that for handling the additional processing.

{{< /details >}}

You can learn a bit more about how we used the puzzle and variant infrastructure (we call them Remixes when user-facing) [from Jack on his blog](https://www.jackschlesinger.com/post/remix-postmortem). From this post's perspective, the interesting aspect is the switch to allow an individual puzzle file to quite drastically influence how it is shown on the today page, and then influence the completion process:

{{< details summary="JSON Schema for Puzzle Front-Matter" >}}

The front-matter schema:

```jsonc
/** The schema supported by the API for the JSON front-matter in a puzzle */
type PuzzleFrontMatter = {
  /** The current API contract */
  _v: 1

  /** If we want to prefix this game with an emoji */
  emoji?: string

  /** A way to replace the puzzle's game name within the Puzzmo UI */
  displayName?: string

  /** A one-liner which goes above the thumbnail on the today page */
  shortDescription?: string

  /** Setup for variants */
  variant?: {
    /** A unique string which can be used to check against existing declared variants */
    slug: string

    /** A way to pull out from a templated front-matter on an existing variant */
    subvariantSlug?: string
  }

  /** Site wide hooks  */
  augmentations?: Augmentations
}
```

Which is a lot of today page info, and then an "augmentations" object which is what we'll get into next.

{{< /details >}}

#### Puzzle Completion

We do a lot of post-processing when someone has completed a puzzle; think leaderboards, user stats, puzzle stats, group updates, events and site stats. These are the types of systems which we want the games team to be able to influence without making API code changes!

Similar to how we implemented augmentations into an existing workflow for puzzle creation, the completion infrastructure is also built atop the existing flows for building games inside Puzzmo. In this case, I extended the admin tools for our games to include augmentations:

{{< imageHighlight src="pup-augments.png" alt="Example of our studio" >}}

{{< imageHighlight src="pup-augments-2.png" alt="The rest of the studio page" >}}

As this is moving away from code, which comes with all sorts of useful tooling: reviews, staging environments and history, we opted to re-create a lot of that infrastructure. You can only edit these augmentations in our staging environment, and then when happy we use GitHub as an external store for the JSON dumps.

This means we get commit histories on changes saved from staging/dev:

{{< imageHighlight src="config.png" alt="A list of git commits" >}}

Then we can use the deployments infrastructure when an update has been applied:

{{< imageHighlight src="config-deploys.png" alt="Example of the crossword deploys" >}}

This gives the API folks pretty robust infra to figure out what happened with the games, but we don't need to be involved in the process at all.

Next then, what sort of hooks do we have in the augmentations? 

Well, first off, it's still a work in progress - so it doesn't cover everything mentioned [in the games plugin overview](https://blog.puzzmo.com/posts/2024/03/28/an-ode-to-game-plugins/) but it's got the essentials we need for now.

```ts
type Augmentations = {
  /** Dynamic leaderboards for this game */
  leaderboards?: LeaderboardExpressionSetup[]

  /** Game specific stats datums to augment the existing aggregate data for a puzzle generated by the API */
  puzzleAggregateStats?: ExpressionSetup[]

  /** Game specific user aggregate stats, these get tied to the game/variant and are
   * separate from the existing stats which are generated in code via the API */
  userAggregateStats?: Pick<ExpressionSetup, "deedID" | "stableID" | "filterExp" | "valueExp">[]

  /** A way to add additional persisted deeds based on the data from the game.
   *  Consider it a way to take a non-persisted deed, and persist it. For example,
   *  if you wanted to take a temporary deed from a game and show it on a completion table.
   *  The "deedID" is used as storage key, value lookup is done via 'valueExp'. */
  persistedDeeds?: ExpressionSetup[]

  /** Additional info to show on the today page completion table */
  completionTable?: Array<{ title: string; persistedDeedID: string; formatString: string }>

  /** Additional info to show on the today page completion table. Used for deeds which do not have a leaderboard attached. */
  completionSidebar?: ExpressionSetup[]
}
```

These admin tools and systems allow the games team to be able to influence Puzzmo systems without incurring the cost of losing of staging environments, code-review and history - and with the benefit of not touching the API codebase. With luck, this leaves the games team in a place to be able to experiment with many more ideas.

### Expressions

All these extension points have `ExpressionSetup` in common, what is that?

```ts
// Simplified, see below if you want the full details
type ExpressionSetup = {
  // A unique ID 
  stableID?: string
  // An expression string for the value
  valueExp?: string
  // A filter pass expression string to indicate if we should do something
  filterExp?: string
}
```

{{< details summary="The full type definitions" >}}

```ts
/**
 * Data given by either via a puzzle in front-matter, or a game in completion.
 * A general unit of data which can be used to represent a lot of configuration points
 * from the game to the API.
 */
type ExpressionSetup = {
  /** What do we call this */
  displayName: string

  /** An optional secondary name for this config. For example, on a leaderboard this is used in the completion sidebar */
  secondaryName?: string

  /**
   * For a lot of augmentations, this acts as an "id" and should be unique and treated as a lower, kebab-case string.
   *
   * For a leaderboard:
   * -  A stable ID has to be in the format of `game-[gameslug]:[your value name]` for a game-based leaderboard
   *    (value here likely can be your deedID). The formatting will get validated on puzzle creation, and in TypeScript.
   *
   * */
  stableID?: `game-${string}:${string}` | string | null

  /** Just saying it how it is, for some augmentations, this isn't necessary */
  order?: "Higher=better" | "Lower=better"

  /** Sometimes, instead of an expression, you may need to hook up to a deed ID directly, conceptually faster because there's no expression eval */
  deedID?: DeedKeys

  /** A custom string formatter, slightly based on printf.
   * - `%+`: Adds a plus sign _only_ to positive numbers
   * - `%@`: Takes the value and replaces the token with the value. If a number it is 'toLocaleString("en-US")'ed
   * - `%TD`: Takes the text definition for a deed and replaces the token with the value
   * - `"[time]"`: Converts a number of seconds to a colon-separated time string (must be exact match)
   * */
  formatString: string

  /**
   * An expression string which can stop something from happening. A concrete example: Whether to post to a leaderboard or not.
   * If the expression returns true or > 0 then the entry is considered allowed for the leaderboard.
   */
  filterExp?: string
  /**
   * An expression string which can be used to generate the value for whatever your config is based on. The
   * API will provide a set of appropriate variables for you to use in this JS-like expression string. They
   * are based on "AngularJS Expressions" which you can read about here: https://docs.angularjs.org/guide/expression
   */
  valueExp?: string

  /**
   * Different augmentations would do different things with this sort value.
   * Leaderboards for example use this when displaying on a page.
   */
  sortValue?: number
}
```

{{< /details >}}

To try and make this more concrete, let's walk through how expression configs work with leaderboards. When a game is completed we pluck a set of augmentations from:

- The puzzle frontmatter
  - (if set) the variant
  - (if set) the subvariant
- The game's augmentations from the admin tools
- Leaderboards defined in code

Now we have an array of augmentation configs, what to do now? Let's look at an example expression config for a leaderboard from Spelltower:

```json
{
  "order": "Lower=better",
  "valueExp": "time",
  "stableID": "game-spelltower:full-clear",
  "filterExp": "completionType == 1",
  "displayName": "Fastest time to full clear",
  "secondaryName": "Time",
  "formatString": "[time]",
  "sortValue": 3
}
```

The first completion pipeline step would be to determine if the gameplay should create a leaderboard entry. We use a filter expression here from `filterExp` to determine whether the game is applicable. Processing an expression requires at least two parts:

- Scope
- An expression

The scope is derived from the deeds, we previously had these deed IDs: `"time"`, `"hints`",`"points"`, `"longest-word"`, `"best-word"`, `"completion-type"`, `"bonus-tiles-used`",`"line-clear-tiles-used`",`"words-longer-than-4`",`"time-before-first-word`",`"words-found"`, `"wpm", "value`",`"avg-word-length`",`"long-word-counts`". You can see the full deeds at the start of the post.

The deeds turn into an expression scope like:

```json
{
  "time": 360.431,
  "hints": 0,
  "points": 779,
  "longestWord": 7,
  "longestWordText": "WILDEST",
  "bestWord": 602,
  "bestWordText": "WILDEST",
  "completionType": 0,
  "lineClearTilesUsed": 0,
  "wordsLongerThan4": 1,
  "timeBeforeFirstWord": 103,
  "wordsFound": 8,
  "wpm": 1.33,
  "avgWordLength": 3.75
}
```

So, for the filter expression of `filterExp`:  `completionType == 1`, you can see that it will look inside the scope for `completionType` compare the value `0` to `1` and return false. Thus: for the game I completed, the API will not post to this leaderboard. The [expression engine](https://docs.angularjs.org/guide/expression) is the same one used by the Angular project.

If the `filterExp` passed (or was not present), then we would use the same technique with `valueExp` to get the value for the leaderboard. 

## Inversion of control

This was quite a lot to architect, build and ship on time for April first. We got there though, and it really represents a new set of foundational primitives for Puzzmo. 

These three system primitives (deeds/augmentations/expression strings) moves control from people who write code in the API to the folks who are thinking about games every day. Which I hope gives them more space for experimenting and building on ideas which don't require API team support!

As we've grown, even as a small team of ~11, I've been acutely aware that our communication boundaries dictate a lot of how and what we build. A small microcosm of [Conway's law](https://en.wikipedia.org/wiki/Conway's_law) if you will, and systems like this help ensure that those boundaries are more permeable.
