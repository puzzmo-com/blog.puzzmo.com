+++
title = 'Puzzmo Tech Stack: 2025'
date = 2025-10-29T08:11:39Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
series = ["Tech Stack"]
+++

It's just over two years since Puzzmo's launch, which means its time to continue my tradition of talking through the technical changes under the hood!

I was a very early GitHub user, signing up in the first 50k users in 2009, and for the first few years the interface and platform was changing very drastically as a user. Then in 2012, GitHub [took venture capital](https://www.wired.com/2012/07/github100m/) and changes to the daily experience of being a GitHub user effectively stopped.

To some extent, I think this is what happened/is happening with Puzzmo for the last year, and possibly for the next year. Like early GitHub (but at a much smaller scale) we've nailed the baseline for the consumer facing side and have found a set of enterprise level features which companies are willing to pay for.

This influenced our technical changes a lot, as enterprise support has been almost my entire focus for the year!

### New Things User Saw

- We shipped a native iOS app for Puzzmo. You can read about this from a [blog post in June](https://blog.puzzmo.com/posts/2025/06/01/ios-app-architecture/). To make it happen we had to add new systems for GameCenter, new subscription infrastructure and handle a lot of App Store review churn. We found lots of [perf wins](https://blog.puzzmo.com/posts/2025/02/06/digging-into-perf/) in the process of exploring offline support.

- We re-designed the two core screens for Puzzmo players, the Today page and the PlayGame page. These two screens represent the majority of the complexity density in the codebase and after 3 years the designs were starting to strain under the incremental changes.

- We introduced some new easy ways to access archival games, now that we have a pretty large backlog of games.

- New games: Bongo, Memoku, Circuits & Missing Link.

- Games have sound! Bongo and Circuits have Buzz (realtime info from other players.) We made a credits system to attribute anyone who was working at Puzzmo at the time of a game launching.

### New Things Users Probably Didn't See

- The capabilities to embed either Puzzmo as an app in other places. This ranges from allow/deny listing certain games, or full on offering of Puzzmo Plus to users of a [different platform](https://secure.businesswire.com/news/home/20250326593738/en/Hoopla-Digital-Launches-New-Gaming-Experience-with-Puzzmo-BingePass).

- The feature-set of the Cross|word went way beyond the list of features we use on puzzmo.com. This ranges from barred Crossword support, jpz imports, amuselabs JSON support, colour, clue images, Schrondinger's squares, rich markdown processing for clues and an inline version of the Puzzmo keyboard. A significant amount of these changes exist inside our open-source project [xd-crossword-tools](https://github.com/puzzmo-com/xd-crossword-tools/blob/main/CHANGELOG.md) which at a whopping version 12!

- Our curated puzzle editing tools went from being only usable for Crosswords to being usable for many games, and in many contexts. We added both Bongo and Circuits which came with all sorts of tricky authorial problems. Our "GitHub for puzzles" system for admins certainly started to creak as we introduced Mini Cross|words, Big Crosswords and non-staff editors.

- We have built out a pretty comprehensive printing system for Crosswords, it can handle a lot of edge-case layouts and re-uses the rendering engine from our Crossword game for clues - so esoteric features like making emojis larger to fit the feel, inline images, formatting etc are all the same.

- We have had enterprises make deals for source code access to Puzzmo and/or games.

- The puzzle [variations](https://blog.puzzmo.com/posts/2024/07/16/augmentations/) system introduced in April Fool's 2024 got a fresh lick of paint for the Crossword Mini to allow for a variant to effectively be treated as its own game. Giving them unique stats, streaks etc. This was made feasible by offloading stats to live in blob storage instead of in the db.

### Where we code

At the end of the last post, I described the "repos which count" as being 3 main places:

- Monorepo
- Games
- Opengraph

Today that has been switched to:

- Monorepo
- Games
- Prototypes

As the games team started to take more responsibilities for the opengraph images it started to make sense to migrate that repo into the games Monorepo. The games monorepo is now a real [Turborepo](https://github.com/vercel/turborepo?tab=readme-ov-file) codebase where you can trivially boot up a new game based on a template.

We spent considerable time on the development environment for working on games this year, so they now have fixtured examples,

The prototypes repo is new, and something [I have written about](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#game-design-collaboration) when talking about Claude Code. The repo acts as a place for game design experiments and still feels like a simplified version of our Puzzmo games monorepo.

We have found this to be a strange set of trade-offs, a lot of our shared code in the games repo lives inside some pretty complex shared redux code which handles interacting with the games runtime. We don't want to force prototypes to be using this code, which has meant there's still a lot of persnickity issues on mundane problems like pausing, timers, keyboard support, no multiplayer infra etc. So, we'll probably have to create a new abstraction for runtime integration over there.

### What is running on Puzzmo?

Today Puzzmo is a pretty complex set of systems which run together to make it all work:

{{< imageHighlight src="architecture.png" alt="An architectural diagram of Puzzmo's servers" >}}

Credit to [Gary](https://www.puzzmo.com/user/puz/madebygare) for the diagram.

Honestly, not much has changed. There's grafana which is mentioned below, RevenueCat is handling all our Apple subscription infra (so that we can support Android, and so that we're not doing BI work.) and a Bluesky Labeler which I hacked up but I can never find the time to get back to.

### Big Tech Swings

#### Puzzmo.com

This year we removed React Native from the codebase, it was a project which most engineers ended up contributing to as the re-design of today and games pages created a new design system which was web only. Longer [read here](https://blog.puzzmo.com/posts/2025/06/01/ios-app-architecture/#not-so-react-native) and such a big task [became a single line](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#maintenance-is-significantly-cheaper) in the list of Claude Code changes as I wrapped up _every other screen_.

We updated all of the tooling like testing, linting to be based on the [VoidZero](https://voidzero.dev/) stack. Looking forwards to seeing what [Vite+](https://voidzero.dev/posts/announcing-vite-plus) looks like in the future.

We have been re-creating a replica of the Puzzmo web infrastructure in a new admin project which should make it possible to do server-side rendering for puzzmo.com - this is great for us developers (faster deploys, single rendering route, only deploy on render.com) and great for users (faster initial loads of a page.) The tech is reasonably complex, but [I have artsy.net](https://github.com/artsy/force/) as a working reference!

We've got patterns for user interface testing using Relay set up in the front-end:

```tsx
import { createMockEnvironment } from "relay-test-utils"
import type { RelayMockEnvironment } from "relay-test-utils/lib/RelayModernMockEnvironment"
import { beforeEach, describe, expect, it } from "vitest"

import { screen, waitFor } from "@testing-library/react"

import { setupLazyQueryTest } from "../testing/setupTestWrapper"
import EditorialScreen from "./EditorialScreen"

let mockRelayEnv: RelayMockEnvironment
beforeEach(() => {
  mockRelayEnv = createMockEnvironment()
})

const { renderWithLazyQuery } = setupLazyQueryTest({ Component: EditorialScreen })

describe("EditorialScreen", () => {
  it("should render editorial content from route parameters", async () => {
    renderWithLazyQuery(
      {
        Editorial: () => ({
          slug: "test-editorial",
          bodyMD: "# Editorial Title\n\nThis is editorial content.",
        }),
      },
      {},
      mockRelayEnv
    )

    await waitFor(() => {
      expect(screen.getByText("Editorial Title")).toBeInTheDocument()
    })

    expect(screen.getByText("This is editorial content.")).toBeInTheDocument()
  })
})
```

Though, no-one is really using them. I don't feel like we're at a maturity point yet as a company, and so testing is an 'at will' sort of thing.

#### API

We have fully migrated from Redwood on the API side. Redwood was a great starting template for our API, and I think if they were still working on it, I would not feel the need to migrate but realistically we were using a subset of the tool and we were carrying around the dependencies for all of their choices.

My replacement is a small library called burr which replicates only the GraphQL layers (creating the schema, setting up [Yoga](https://the-guild.dev/graphql/yoga-server), handling the requests) and I archived the [type-system codegen](https://github.com/puzzmo-com/sdl-codegen) library I built for Redwood and migrated it into our monorepo.

I sometimes muse to myself about migrating to a different technique for creating our GraphQL API. I ran a non-trivial experiment with [Postgraphile](https://www.graphile.org/postgraphile/) and found it to be a really interesting foundation, but I'm not willing to commit to moving such a big existing project to Postgraphile - [Pothos](https://pothos-graphql.dev/) maybe?

We've built out support for OAuth in Puzzmo, and new servers are using it.

### Things which changed

2025 was a epochal year for the field of programming. LLMs got good enough. I'm finding myself using Claude Code every day I am programming, and it's capabilities feels to have had quite a boost with the introduction of [Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5). For the engineers who use Claude Code in our team, we're finding it can drastically speed up, or allow for parallel work in ways which can get someone closer to where they want to be.

6 month down the line I'm still regularly impressed by Claude's ability to understand our codebase, and I can find that I can make requests which span multiple sub-projects _"add a 'display name' to this model, and make it editable in the studio"_ would make the correct changes to the db, the GraphQL SDL layer, the application API layer, the backend would get forms and fields updated. This sort of thing is the bread and butter of a well defined system, and the tooling continues to impress.

### Things we never got to

From last year:

> Consolidating puzzmo.com logic into Relay's [client schema extensions](https://relay.dev/docs/guides/client-schema-extensions/) and using fragment references

I explored Relay [client schema](https://relay.dev/docs/guides/client-schema-extensions/) extensions as a route to handle some of the gnarly logic around offline support. This code ended up being significantly more verbose and required a lot more wiring around the app than I had hoped. So, in the end it wasn't an answer to solving some of our gnarliest state complexity (a big `useReducer` which hosts info for games runtime integrations) which still remains a 'beware dragons here' area of the codebase.

### New heuristics I have learned

1. A backtracking foreign id is probably worth adding to models which create other models. I have found myself regularly going back to the database schema to connect things like 'this object was made by this scheduler', or 'this submission created this puzzle'

2. Almost every complex db model how has a `flags` Int array in the database. Then I have a shared admin/game/app library to pull out these values and compare them at runtime. I use codegen to make the API ergonomic. Part of the goal here is systemic consistency but also ease of adding a new boolean value on a model. Previously, if you want to add a single db flag it would be: add a db column, add to the api (read/writes), add to the graphql layer, have clients add new field and potentially pass that to the games (which means editing the runtime contract.) Now, it's extend the enum definition for the bitwise flags and make sure anywhere which wants to know it exists updates the shared package.

3. Ask Claude questions. I've found myself wondering things like _"My memory is unreliable (I have [SDAM](https://www.reddit.com/r/SDAM/)) so are there things I've missed for this article"_ - so I asked Claude Code to review every PR for the last year and offer its opinions on what important foundations were added to the codebase this year. {{< imageHighlight src="talk-to-claude.png" alt="A screenshot of asking claude some questions" >}}
