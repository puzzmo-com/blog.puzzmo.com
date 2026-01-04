+++
title = 'Daring Deeds: Look Ma No Code'
date = 2026-01-03T12:57:38Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
series = ["Integrating games to the server"]
+++

Welcome to the fourth post in the series on how Games and Puzzmo infrastructure (the app and the API) come together.

Let me do a quick re-cap for the first three posts:

> 1. [I built a plugin system for games inside the API](/posts/2024/03/28/an-ode-to-game-plugins/), each game would have a corresponding plugin with a very explicit API for integrations like leaderboards, scores, user stats etc.
>
> 2. [I built a system called 'augmentations'](/posts/2024/07/16/augmentations/). Augmentations is a catch-all term for a few systems allows a game, individual puzzles and game variants to be able to have custom behavior with the app and api.
>
> 3. [I built a plugin system for the one-off event systems](/posts/2024/09/19/plugins-are-back-in-style/), this allowed us to hook in new systems as games were launched that could be handle independent of giving games access.

Now, I think of this of a bit of a [tick-tock](https://en.wikipedia.org/wiki/Tick–tock_model) style system where we build something in code, then refine it into controllable behaviors in the db. Which should tell you exactly where we're about to go.

On new years day 2026, we released a new game: [Ribbit](https://www.puzzmo.com/+/polygon/puzzle/2026-01-01/ribbit) (this link is always playable). Ribbit is our first "no code" game, not in the sense that it made with no code (though it is our first non-TypeScript + React game!) Ribbit is the first game we've built with zero integration code in the app nor API.

So, let's dig into what has changed in the augmentations system to make it possible for this to happen!

## Augmentations Systems

The term augmentations refers to a bunch of different systems, but at core it is about taking a JSONC string from:

- Front-matter in the puzzle's text representation
- The Game model in the database
- The Remix model on the database (if the game is a remix)

Each of these are converted into a JSON object and all keys of them are appended together until we have a single object that represents all of the possible integration points for the games team to be able to make systemic changes.

Here is Ribbit's augmentations:

```json
{
  "leaderboards": [
    {
      "order": "Higher=better",
      "deedID": "points",
      "stableID": "game-ribbit:points",
      "displayName": "Highscore",
      "secondaryName": "Points",
      "formatString": "%@",
      "sortValue": 0
    },
    {
      "order": "Lower=better",
      "deedID": "time",
      "stableID": "game-ribbit:time",
      "displayName": "Best complete time",
      "secondaryName": "Time",
      "formatString": "[time]",
      "sortValue": 1,
      "filterExp": "allWordsFound"
    },
    {
      "order": "Higher=better",
      "deedID": "words-per-minute",
      "stableID": "game-ribbit:instaplonks",
      "displayName": "WPM",
      "formatString": "%.",
      "sortValue": 3
    },
    {
      "order": "Lower=better",
      "valueExp": "wordsToStarred > -1 ? wordsToStarred : undefined",
      "stableID": "game-ribbit:wordsToStarred",
      "displayName": "Star by",
      "formatString": "%@ %p(word|words)",
      "sortValue": 4
    }
  ],
  "completionTable": [
    {
      "formatString": "%@ %p(word|words)",
      "persistedDeedID": "words-found",
      "title": "Words found"
    },
    {
      "formatString": "%@ %p(word|words)",
      "persistedDeedID": "words-to-starred",
      "title": "Star by"
    }
  ],
  "puzzleAggregateStats": [
    {
      "stableID": "frogs",
      "deedID": "frogs-found"
    }
  ],
  "userAggregateStats": [
    {
      "stableID": "frogs",
      "deedID": "frogs-found"
    },
    {
      "stableID": "words",
      "deedID": "words-found"
    }
  ],
  "userStatDisplays": [
    {
      "userAggregateStatStableID": "frogs",
      "displayID": 0,
      "formatString": "%@ Froggies Found",
      "order": 0
    },
    {
      "userAggregateStatStableID": "words",
      "displayID": 1,
      "formatString": "%@ Words Found",
      "order": 1
    }
  ]
}
```

This covers:

- What leaderboards do we want to show (and/or filter submitting to)
- What user stats do we store
- What per-puzzle stats do we store
- What do we show for a completed game
- How options are selectable to be able to go on a user's profile

## Leaderboards

Leaderboard haven't had any changes since I introduced group leaderboards to Puzzmo. Puzzmo games run on the same infrastructure as you here.

## User Stats

I was really stumped on how to make the user stats when I started with Puzzmo. My first approach was that every game would have up to four different 'metrics' which were always a number. The API would have tacit knowledge over what each metric 1-4 did and would have code like:

```ts
if (friendGP.metric1 > yourGameplay.metric1) {
  const diff = friendGP.metric1 - yourGameplay.metric1
  const md = `${userRef(friend)} solved today's ${gameName} in ${friendGP.metric1} rotations — ${diff} more than your solve.`
  return [{ user: friend, md, topic }]
}
```

{{< cite ref="^ Taken from the Social News system, one still not ported to Augmentations." >}}

These metrics would then be processed into positional arrays on a user and then stored in the database. This was good until we needed more than 4, or text for processing (e.g. best word on Spelltower)!

Version two of this system allowed for an arbitrary "pipeline data" array which came from the game. This was game-specific data but was unconstrained by types or length. We used a shared .d.ts to ensure systemic consistency across codebases.

This also worked well for a while, but the niggling itch of this being something which required coordination between the API and the games just didn't feel good to me. So, with Pile-Up Poker, I introduced a new space for games to store data.

Today, when a game completes we no longer send metrics and pipeline data. We only send "Deeds" - deeds are a 'rebrand' of those two systems:

```ts
type Deed = PipelineDeed | PersistedDeed

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

A Pipeline Deed is a value which can be anything, and will be only used in game completion processing. This is stored in the database for a day. A Persisted deed is for keepsies.

For example, Ribbit posts deeds like this on game completion:

```json
[
  { "id": "words-found", "value": 4, "persist": true },
  { "id": "words-per-minute", "value": 119 },
  { "id": "words-to-starred", "value": 1, "persist": true },
  { "id": "all-words-found", "value": 0, "persist": true },
  { "id": "frogs-found", "value": 1, "persist": true },
  { "id": "points", "value": 187 },
  { "id": "time", "value": 201 }
]
```

Which is a mix of pipeline and persisted deeds. These deeds get stored in a new key-value store for a user which is persisted to blob storage instead of to the main Puzzmo database. This means I don't need to worry about the db size ballooning up too much!

For example, my deed user storage looks like:

```json
{
  "pileUpPoker": {
    "gtFL": 3,
    "hnds": 102,
    "points": 166020,
    "qHands": 117,
    "fullHands": 17,
    "maxPoints": 15840,
    "maxQHands": 5
  },
  "pileUpPokerPro": {
    "hnds": 8,
    "points": 5390,
    "qHands": 3,
    "maxFLPts": 1750,
    "maxPoints": 3640,
    "maxQHands": 3
  },
  "ribbit": {
    "frogs": 17,
    "words": 21
  }
}
```

So, three games, different settings, all pretty traditional in terms of a JSON object. Then now we have a consistent, easy to think about store for user stats, we can make it possible to build user stat displays!

So, following the Augmentations above: a completed Ribbit would post a deed like `{ id: "frogs-found", value: 5  }` then during completion processing the augmentation: `"userAggregateStats": [{ "stableID": "frogs", "deedID": "frogs-found"}]` tells the system that we should bump the user deed store attribute `"frogs"` for this game by the value of `5`.

Then later when you are on your profile, you can choose `"5 Froggies Found"` because of `"userStatDisplays": [ { "userAggregateStatStableID": "frogs", "displayID": 0, "formatString": "%@ Froggies Found", "order": 0 }]`

## Completed Games

There are two main user interfaces for giving feedback on a completed game:

- The completion sidebar (or popup on mobile)
- The today page table

The completion sidebar automatically takes its information from the leaderboard definitions. There are ways to extend it further to add new items to the sidebar, which you can see in Pile-Up Poker:

```json
{
  "completionSidebar": [
    {
      "valueExp": "points * (pupMultiplier || 1)",
      "displayName": "Best daily deal",
      "secondaryName": "Points",
      "formatString": "$%@",
      "sortValue": 0
    },
    {
      "deedID": "quality-hands",
      "displayName": "Quality Hands",
      "formatString": "%@",
      "sortValue": 2
    },
    {
      "deedID": "hands",
      "displayName": "Hands",
      "formatString": "%@ / 10",
      "sortValue": 1
    }
  ]
}
```

Then for the Today Page, we show different data, and so we have a way to look up deeds which are marked as persisted and that is converted into a neat little table.

## Staging Augmentations

I try to make this sort of work easy to do by providing REPLs (web pages where you can run the augmentations in 'dry run' mode and get introspective information) but that still seemed to still be a bit of a tough sell to the games team.

![REPL example](repl.png)

I originally built the augmentations system to fall back to our staging website infrastructure. Meaning admins can make any changes they want on the staging version of Puzzmo and then migrate their changes back to production when happy.

I [originally built this by](/posts/2024/07/16/augmentations/#puzzle-completion) using a GitHub repo as a store, where you could sync to/from this stored central infrastructure where you get editor tools, commits, authorship of changes and all sorts.

This repo wasn't really used very much and so I came back with a new pattern. Now all folks who are creating a game have the ability to deploy augmentations which affects them. Everyone else gets a production version.

These staging augmentations are then reflected instantly, and when you are happy are deployed to everyone.

This gives us the ability to iterate on production, a thing I have consistently found to be the way to get most people to participate in feature flags / experiments.

## System Notables

We haven't used this feature in Ribbit but the notables system has also got an upgrade to go from being fully written in code to be a mix of code and database.

An admin today could make a notable, and then a game could use an augmentation to be able to set that notable, giving a game a chance to highlight super rare behavior somehow.

## LLM Augmentation Assists

The thing about a "fancy json object" which has a bunch of systems made by one guy that interact with complex expression strings is that other people don't fully grok how they all work.

So, I took a shot at trying to get an LLM to be able to respond to questions and handle making improvements to the augmentations.

Because the Augmentations are all typed in TypeScript, it was very easy to use JSON schema + JSDocs to describe the API in a way that an editor can work with.

So, I created a way to ping our API for augmentations on a game which consolidates all the built-in documentation, passes in some examples of completed deeds and a bunch of context text from myself.

So far, no-one but me hasn't had a need to use it (as I worked on Ribbit) but it's an interesting way to think about how to bake the built-in knowledge we get from being able to read the code into a system.

We have a way to validate the JSON schema against a response, but as of yet, I've not built a validator for key/expression usage. Would be an interesting project. I guess I could also give it the URLs for these blog posts too.

## Missing Augmentations?

I've still not got every system covered though. I'm not even sure if augmentations is the right pattern for them, but still worth a muse.

### Social News

There are no news system hooks for an augmentation. The news system is some of the oldest un-touched code in Puzzmo. While I have a chunk of the successor to the news system up and running (it powers messages like 'X got a notable', 'Y became a champion in game O', 'Z played T for the first time' )

Figuring out a way to do this based on deeds is gonna be an interesting one and I've still not wrapped my head around the necessary abstraction.

### Instructions

We currently have a different system for instructions, which is or is not the right abstraction. I think there's something better here but I don't know what.

### Tutorials

The tutorials we use to teach people how to play the game has a lot of shared concerns with the Side Quest system we introduced in Pile-Up Poker and haven't re-used since.

At heart, the tutorial system is a list of expressions which run on a checkpoint that passes deeds to the API mid-game.

I think the tutorial could be really succinctly represented in augmentations saving me some database space and reducing the number of

### Credits

The data model for credits is surprisingly complex, but also so is trying to figure out how to give people credit on a game.

I wouldn't want to simplify that model but it also means referencing users by user IDs and all sorts and probably isn't a good fit for migrating into the system

### Locked Games

All Puzzmo games change over to new games at the same time: Chicago midnight.

This time is kinda sucky. For me in London, it's 6am for the team it's either 10pm or 1am. Which is just a sucky time to be releasing a new game!

We eventually got tired of this and introduced a way to suppress a game showing on the home page until a specific time! This is now fully controlled by the database and doesn't require and code.

That said, I don't think it needs to live in augmentations.
