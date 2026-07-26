+++
title = 'Sandboxing'
date = 2026-07-25T08:16:49+01:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

We shipped Hue Complete Me!

![Hue Complete Me gameplay video, showing how the game works](https://cdn.puzzmo.com/assets/Hue-Complete-Me.gif)

Hue Complete Me is the first game which uses all of the new SDK and sandboxing systems I've been working on this year.

## My Year so Far

After we shipped Missing Link, I started pitching internally that the 'cost' of making a game was plummeting. Since Puzzmo's launch we had planned on a cadence of making a game a quarter, because with 1-2 people engineering them that's the time it takes to make a game of the quality we ship! [Missing Link](https://blog.puzzmo.com/posts/2025/07/04/missing-link/) showed us that the constraints on engineering aspects of shipping a game have changed to the point where a game designer can make a good enough implementation that an engineer only needs to assist rather than do the full creation.

This made me wonder, is it time that we should start thinking seriously about letter people make their own games on Puzzmo. We had wanted it from day 1, but the way games are licensed in Puzzmo is complex and it wasn't easy legally. However, that was changing so, I sketched out a plan. We take the systems which Brooke/Madeline uses for running our Crossword/Circuits pipeline and we re-create it for letting folks make their own puzzles, then when that infrastructure is steady we we start looking at building an sdk, write documentation and create a larger system to let Puzzmo players become Puzzmo creators. I called it: Puzzmo Workshop.

I pursuaded Puzzmo internally, then pitched it with Zach and Andrew to the Hearst newspaper c-levels and got buy in. I built a foundation from the admin source code and then passed over to Saman and Gary who worked on puzzle generation for about half a year, getting it stable while I was working on the SDK and prepping systems to stop trusting games source code. You can see the [announcement here](https://www.youtube.com/watch?v=jwCj8AC80UA).

A month or two after that announcement we started to look at consolidating the games dev tooling with the puzzle dev tooling, and that's where we are now! Hue Complete Me is marked as being third party in all our systems, and so it's been a great stress test for the new systems. This post is going to try talk through the systems I've worked on in the process of allowing third party games, with an eye on how tricky running other people's code safely is.

## Data Modelling

When it because obvious that we were going to support custom user content, we needed some sort of grouping system for people who have access to teams. Prior to Workshop, we had Admins (e.g. Puzzmo staff) who had the role `"admin"` which is effectively super-user access. Now we needed a way to tier access to be able to see games, to edit games and give them powers to make deploys. The shape of this looks like:

```prisma
enum TeamType {
  Personal   // a single person's private workspace
  Shared     // a real team that multiple people belong to
}

enum TeamMemberRole {
  Owner      // can edit the team, its games, and manage members
  Member     // can work inside the team, but not administer it
}

// A team is the unit of ownership: everything a creator makes
// (games, puzzles, embeds, tokens…) hangs off a team, not a user.
model Team {
  id   String @id
  name String
  slug String @unique   // URL-friendly, used in links

  type TeamType @default(Shared)

  // Who's in the team, and at what level of access
  members TeamMembership[]

  // People with read-only preview access to unreleased games
  previewers TeamPreviewer[]

  // Tokens for the CLI / API (how third parties upload)
  accessTokens TeamAccessToken[]

  // Everything the team owns. In reality this is ~20 relations —
  // games, puzzles, schedules, embed configs, collections, remixes…
  games   Game[]
  puzzles Puzzle[]
  // …and many more
}

// The join between a user and a team, carrying their role.
// The composite @@id means a user has exactly one membership per team.
model TeamMembership {
  teamID String
  team   Team   @relation(fields: [teamID], references: [id])

  userID String
  user   User   @relation(fields: [userID], references: [id])

  role TeamMemberRole

  @@id([teamID, userID])
}

// A lighter grant than membership: "you can *see* not-yet-public
// games, but you're not part of the team." We used to use specific roles for this.
model TeamPreviewer {
  id String @id @default(cuid())

  teamID String
  team   Team   @relation(fields: [teamID], references: [id], onDelete: Cascade)

  userID String
  user   User   @relation(fields: [userID], references: [id], onDelete: Cascade)

  // who invited them — a bit of an audit trail
  invitedByID String?

  @@unique([teamID, userID])
}

// A token scoped to a team (not a user) for CLI / API access —
// this is what lets a third party upload a game without ever
// touching our infrastructure keys.
model TeamAccessToken {
  id    String @id
  token String @unique   // the opaque secret sent on each request

  // human-readable label, e.g. "CI deploy token" or "Orta's laptop"
  description String

  // handy for spotting stale / unused tokens
  lastUsedAt DateTime?
  
  // which team this grants access to…
  teamID String
  team   Team   @relation(fields: [teamID], references: [id])

  // …and who minted it (audit trail)
  createdByID String
  createdBy   User   @relation(fields: [createdByID], references: [id])

  @@index([teamID])
}
```

## How we Upload Games

I started Puzzmo with uploads being a real simple concept. We use Azure as a blob storage system, and after every git push it would deploy the build assets to Azure. This is a great simple system, but it's only possible to do with our Azure keys! That's not really a great system for third parties. So, I added a command line tool for

## How Games Used To Run

When I first architected the games, we had a few moving parts. This meant that I could maintain a bridge between games and the Puzzmo app. This bridge meant any systemic upgrades of Puzzmo features meant we didn't need to update all our games to the latest version of their source code. We call this bridge 'the runtime' and it was responsible for booting up the games and sending functions into the game for callbacks.

```
┌─────────────────────────────────────────────────────────────────────┐
│  puzzmo.com  (the app)                                              │
│                                                                     │
│   <iframe src="/runtime.html?hash=…&gameplay=wordbind">             │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  runtime.html   (a generic, empty shell we ship)             │  │
│   │                                                              │  │
│   │   1. loads the runtime bundle (runtimeCore)                  │  │
│   │   2. onload ──── postMessage "READY" ────►  app              │  │
│   │      app  ──── postMessage "READY_DATA" ──►  runtime         │  │
│   │                 (puzzle data, theme, settings)               │  │
│   │   3. runtime injects  <script src="…/wordbind.js">           │  │
│   │   4. onload ──►  window[game.exposedGlobalFunction](config)  │  │
│   │                        │                                     │  │
│   │                        ▼                                     │  │
│   │   ┌──────────────────────────────────────────────────┐       │  │
│   │   │  the game renders here, inside runtime.html      │       │  │
│   │   └──────────────────────────────────────────────────┘       │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

This runtime is valuable when you have a thorough understanding of all the game code, and are OK with the games scripting code operate inside the same JavaScript environment!

The new system is simpler!

```
┌─────────────────────────────────────────────────────────────────────┐
│  puzzmo.com  (the app)                                              │
│                                                                     │
│   <iframe src="…/wordbind/index.html?gameplay=…">                   │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  the game's own page  (brings its own runtime, via the SDK)  │  │
│   │                                                              │  │
│   │   1. boots itself                                            │  │
│   │   2.  ──── postMessage "READY" ────►  app                    │  │
│   │      app  ──── postMessage "READY_DATA" ──►  game            │  │
│   │                                                              │  │
│   │   ┌──────────────────────────────────────────────────┐       │  │
│   │   │  the game is the page — no shell, no injection   │       │  │
│   │   └──────────────────────────────────────────────────┘       │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

```

But you can't just 'remove' complexity IMO, only move it. So, where did it go? Well, we now have [`@puzzmo/sdk`](https://npmx.dev/package/@puzzmo/sdk) - it provides the centralized infrastructure
