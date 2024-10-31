+++
title = 'Puzzmo Tech Stack: 2024'
date = 2024-10-30T11:01:48Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
series = ["Tech Stack"]
+++

We're just over a year since Puzzmo was launched to the public, and it's time to pull out an [old Artsy tradition](https://artsy.github.io/series/artsy-tech-stack/): writing up some of our technical choices for the year.

This builds on the prior "[what did we launch](/posts/2024/04/17/v1-launch/)" blog post, but with a significant slant towards the tech powering instead of user-facing features.

Team wise, today, we have two engineers solely focused on the games (and occasionally touching the front-end of the app), an engineer focused on the API and then me, who will do a bit of everything. We have 2 meetings a week, unless we're close to a game launch, then we check-in every day with a focus on that game. We're nearly entirely a slack only team, and we generally use GitHub Issues and GitHub Org Projects to keep track of what we're doing.

## Puzzmo.com

If this is not your first Orta read, you'll not be surprised to find that I still believe in the [same tech stack](https://www.youtube.com/watch?v=1Z3loALSVQM) I have used since I was persuaded [back in 2015](https://github.com/artsy/mobile/issues/22#issuecomment-91199506).

- [React + React Native](https://artsy.github.io/series/react-native-at-artsy/)
- [Relay](https://artsy.github.io/blog/2019/04/10/omakase-relay/)
- [TypeScript](https://artsy.github.io/blog/2019/04/05/omakase-typescript/)

For Puzzmo, instead of writing a React Native app from scratch, I opted for building via Expo. As the web platform is the weakest supported platform for React Native, it meant we could prioritise that for launch. I published [a video back](https://www.youtube.com/watch?v=2NItowAgfNA) when I was making this decision with the trade-offs. This estimation made sense at the time, but eventually the complexity/breadth of Puzzmo post-acquisition meant that we opted to abandon building a native React Native app from the same codebase.

As I migrated Puzzmo to a monorepo, I took the time to eject us from Expo, and now the puzzmo.com codebase is a React Native Web app powered by Webpack. This isn't a great place to be, folks who only have a web background feel the impedance mismatch of using native metaphors for navigation and interaction designs. So with luck, the next time I write this, I can say we fully pulled ourselves out of being a React Native app.

The codebase itself has some very gnarly parts due to us not making design concessions around device specific layouts, e.g. making it feel great on desktop, and making it separately feel great on mobile. These two interface models have very different _internal_ data needs, and we're only just starting to get a sense of how we can try and consolidate some pretty disparate data stores which we've built over the last 3 years.

The domain `puzzmo.com` is handled by Vercel, we deploy a PWA to them and use a few advanced routing features for things like Open Graph images.

## Puzzmo iOS

Yep, I've been working on it in the background. Half-way through this year, I realised that the codebase was just getting too complex for a team our size to be able to reliably maintain across two platforms. E.g. almost everyone who touches the codebase for puzzmo.com uses linux, being able to know that your change does not crash the iOS or Android Native build. In a larger team size, you'd have people working every day on each platform you care about, but we're not there. So, I presented this choice to the team:

- We build as good of a web view app as we can, but only I know iOS native code
- We significantly slow down development and build a native app from this existing codebase

When I polled folks internally, the vote for a web view was unanimous.

The goal is to make it possible to have this pattern is how I originally built [the Artsy iOS](https://www.youtube.com/watch?v=2DvDeEZ0NDw) app, we would present native views when we had them, but otherwise falling back to the web versions of a screen until it made sense to cover it natively. The extent to which we will need to do that is arguable though.

## API

The first thing called "Puzzmo" (née "Puzmo") was a [RedwoodJS](https://redwoodjs.com) app and API. Today the API codebase is quite different from those humble starts. RedwoodJS is a great system for building a comprehensive full-stack app, and has a bunch of good opinions baked in it. Over time, we kept some of those ideas and formed our own new ones. 


Today, running the API has been fully extracted out of RedwoodJS's framework and is handled entirely by us. My favourite part of Redwood's design, the GraphQL layer is still fully intact and tied to a specific build of RedwoodJS. This part of RedwoodJS is going to be de-emphasized as they move to a React Server Components world. On the long run, it's not healthy for us to be using an older build of their internal libraries, so I expect with time we will fully migrate to a version of Redwood's GraphQL layer which we've fully extracted and libraryized as a standalone project.

Internally the API is structured to have small resolvers (I used to have my own eslint rules for this, but moved to oxlint and they don't have a user-land rules system yet.) and then a lot of the chunky work happens in library code. Something novel about our API is that it [runs entirely in Vite via vite-plugin-node](https://www.npmjs.com/package/vite-plugin-node). Which means we get hot-reloading on API calls.

We run the API and all its related systems on render.com - this has been great so far.

### Data Layers

Redwood came with [Prisma](https://www.prisma.io) set up by default, and I've been really happy with it - I'm a little wary that they're getting to their _"we have the developers now we need to figure out how to make them pay for this startup"_ phase though. Any time I don't use Prisma I use [Kysely](https://kysely.dev), which smooths the edges of writing raw SQL and ties it into the TypeScript type-system enough for me.

We have a few different internal APIs for caching, ranging from Redis to in-memory  which have worked well for us in figuring out scaling issues.

### Job Infra

We have a background job process set up with [Faktory](https://github.com/contribsys/faktory) which handles JavaScript jobs, I [made a video when I built the infra](https://www.youtube.com/watch?v=4y3PJmm-GT4) but we have a few jobs, the most important being the game completed processing for people who have signed in (and thus have and contribute to stats.)

The codebase for this fully lives inside the API due to how much overlap there is in terms of responsibilities.

### Cron Systems

We have 2 hourly cron jobs which has a pretty high level description system for tasks which need to run which looks like:

```ts
if (hour === 0) {
    await step(`Setting up next weeks daily games`, ["critical"], async () => {
        // Do tomorrow on staging, but on prod, do it for ~3 weeks away
        const isStaging = process.env.NODE_ENV === "staging"
        const tomorrow = addDays(dayDate, 1)
        const tomorrowDaily = await _getTodaysDaily({ isoDate: tomorrow.toISOString() })
        await runSchedulersForDaily(_dateKeyToDate(daily.dayString), isStaging ? tomorrowDaily : undefined)
    })

    await step(`Setting up embed config pre-renderer`, ["critical", "prod-only"], setupEmbedConfigPreRenderer)

    await step(`Updating daily usage stats (e.g. user profile data)`, ["critical"], async () => {
        await updateDailyUserAggregateStats(yesterdayDaily)
    })

    await step("Update Group Dailies", ["critical"], async () => await updateGroupAwards(yesterdayDaily))
    await step("Create [new-game] puzzle for today", ["critical"], createSecretGameDaily)
    await step(`Setting up crossword in emergencies`, ["prod-only"], addCrosswordSubmissionAsPuzzle)
    await step("Updating notables for crossword contribs", [], updateXwordContributorsNotables)
    await step("Sending slack overview", ["messaging"], sendSubmissionOverviewToSlack)
}
```

Each step can fail, and let us know in slack, and the tags let the cron system decide when it can run (for example can it run on staging, or should it only run in the "critical" cron runner).

Hourly has currently been a good enough resolution for us to work with.

### Games

All our games are React + Redux + TypeScript. Each game is a sub-folder and all get bundled by Vite into separate bundles which are uploaded to our CDN on every pushed commit. We have somewhat settled on [framer-motion](https://www.framer.com/motion/) as the animation abstraction.

Games live in their own repo, where they have access to a development jig. This is an IDE-like environment offering a lot of controls to manipulate the game and its runtime environment, making it easy to get into specific states and see all of the side-effects along the way.

I, orta, perceive Puzzmo to act similar as a games console vendor, and so games have a strict set of constraints and a tight communication boundary with other systems. We have roughly 4 different implementations of the Puzzmo runtime for games, which are used in different places. These runtimes support different features, and have different uses. There's the main puzzmo.com runtime, the runtime inside the Jig, the runtime for Crossword submissions and the runtime for running an iframe embed of a Puzzmo game on some other domain.

Each game exposes a function on the global scope, and then this function will be launched with the `GameConfig` object below.

{{< details summary="Read our .d.ts for the game and runtime"  >}}

```ts

/**
 * The API contract between the Puzzmo game runtime, and the game. Contains a
 * space for different objects to handle responsibilities (via the delegates/loaders) */
export type GameConfig = {
  /** An agreement between the game runner, and the games implementation details about the fns
   * in this type any breaking changes to how the run time works will need to be handled by looking
   * at this string version. */
  runtimeContract?: "1.0"
  appRuntimeContract?: "1.0"

  /** What is the DOM element the game should render in? */
  container: HTMLElement

  /** What is the prefix for the assets for this game? E.g. the game will expect to do `assetsPath + "img.svg"` */
  assetsPath: string

  // actual score cap
  difficultyPointsCap: number

  /** The functions for setting up the game state */
  loader: GameDataLoader

  /** The system for a game to give feedback to the outer game system */
  feedback?: GameFeedbackDelegate

  /** Get updates from the user-oriented changes to the puzzle board: either everything or one when it's useful */
  stateSubscriber?: GameStateSubscriber

  /** Lets a game hook into much richer collab systems */
  collabHooks?: RichCollabHooks

  /** Lets the runtime DI in the color scheme for a game */
  theme: Theme

  /** An array with options that describe the outer host of the runtime:
   *
   * - 'sandbox' - Basically run the game in a way that allows a lot of visibility into the system from outside.
   *               For editing experiences, not for running the games traditionally.
   *
   * - 'embed'   - The game is running in a puzzmo embed instead of the main RNW app
   *
   * - 'embed-no-ui' - The game is running in a puzzmo embed without any extra UI elements. So, no completion
   *                   tag, links to fullscreen etc.
   *
   * - 'desktop' - Only provided by the main puzzmo.com runtime, this implies the UI in the app is running
   *               in a desktop mode.
   */
  hostFlags: ("sandbox" | "embed" | "embed-no-ui" | "desktop")[]

  /** Offers a way to hook into the game systems just before the game is added to the DOM.  */
  onReady?: (store: any) => void

  /** Lets a game handle lifecycle events which come from the host downwards */
  setLifecycleSubscriber: (sub: () => GameLifecycleSubscriber) => void
}

export type GameLifecycleSubscriber = {
  // App starts the timer when it is ready
  startGame: () => void
  /** When the app sends a message down to pause the game (e.g. stop the timer) */
  gamePaused: () => void
  /** When the app sends a message down to resume the game (e.g. start the timer) */
  gameResumed: () => void
  /** Update the local store with the result of showing the settings panel */
  updateSettingsJSON: (partialSettingsUpdate: any) => void
  /** For showing the keybindings */
  keybindingsRequested: () => { id: string; keys: string; desc: string }[]
  /** When someone hits retry basically */
  resetGame: () => void
  /** When a response from an RPC call comes through */
  rpcResponse: (response: MessagesReceived["RPC_CALL_RESPONSE"]) => void
  // JIG ONLY: Allow Jig to update the input string from it's UI to game.
  updateInput?: (input: string) => void
}

export type RichCollabHookSubscriber = {
  /** Send along arbitrary JSON to all collabs */
  gotJSONFromCollaborators: (json: { data: any; presence: any }) => void
  /** An update to the state string coming through the*/
  gotUpdatedStateString: (json: { data: any; presence: any }) => void
  /** When a cursor update came though, you probably want to NOOP as this is mostly handled at puzzmo level */
  gotCursorUpdates: () => void
  /** Got a update to the shared session object */
  gotUpdatedSharedSessionObj: (json: any) => void
  /** When a user joins / leaves then this array is updated, you can always use 'getCollaborators' to access the latest version of the list */
  collaboratorsUpdate: (collabs: Collaborator[]) => void
}

export type RichCollabHooks = {
  /** Gets the internal list of connected users */
  getCollaborators: () => Collaborator[]
  /** Send a message to all collabs */
  sendJSONToCollaborators: (json: any) => void
  /** Start listening into the hooks */
  setCollabSubscriber: (sub: () => RichCollabHookSubscriber) => void
  /** Send the current session to the collabs */
  sendSessionObjToCollaborators: (json: any) => void
}

/** A dumb 'json object' settings thing */
export type GameSettingsUIComponents =
  | { type: "title"; value: string }
  | { type: "subtitle"; value: string }
  | { type: "paragraph"; value: string }
  | {
      type: "text"
      name: string
      defaultValue: string
      title: string
      subtitle?: string | (() => any)
      textarea?: true
    }
  | { type: "number"; name: string; defaultValue: number; values: number[]; title: string; subtitle?: string }
  | { type: "boolean"; name: string; defaultValue: boolean; title: string; subtitle?: string }
  | {
      type: "enum"
      name: string
      defaultValue: string
      values: string[]
      displays: string[]
      title: string
      subtitle?: string
    }
  | {
      type: "setOptions"
      label: string
      title: string
      subtitle?: string
      values: any
      bgKey: keyof Theme
      colorKey: keyof Theme
    }
  | { type: "separator"; key: string }
  | { type: "split"; content: GameSettingsUIComponents[] }

/** Game Feedback Delegate, the functions are intentionally vague here to work across games */
export type GameFeedbackDelegate = {
  /** A word was found inside a game */
  wordWasUsed: (word: string) => Promise<any>
  /** Tells the app that it needs to update the timer's UI */
  timerTick: (timeDisplay: [elapsedTime: string, addedTime: string]) => void
  /** Tells the app to update time passed on the backend */
  timerSync: (time: number) => void
  /** Tells the app to update the on-screen keyboard */
  keyboardUpdateConfig: (config: KeyboardOptions) => void
  /** Tells the app that the input method changed */
  inputModeChanged: (mode: InputModes) => void
  /** Tells the app that the game is over */
  updateSettingsFromEmbed: (settings: any) => void
  /** Initialize settings data for a game. forceSettings is a way to declare a game's settings which cannot be override for a particular puzzle */
  initializeSettings: (data: { components: GameSettingsUIComponents[]; settings: any; forceSettings: any | null }) => void
  /** Tell the app that we want to leave feedback on the puzzle string based on a particular subset of the string in the puzzle */
  startFeedbackOnPuzzle: (puzzleStringSubstring: string) => void
}

/** Represents something which can load/save state of the game from the external host */
export type GameDataLoader = {
  /** A promise which returns a string version of a puzzle in a blank state */
  getPuzzleData: () => Promise<string>

  /** A request to get the current state of the user for that specific game. */
  getPuzzleState: () => Promise<HostPuzzleState>

  /**
   * A request for the viewer's metadata, this is meant to represent information which is both
   * puzzle specific and user specific, for example "the user unlocked fantasyland for this puzzle"
   * or "the weather for this memoku is x, y, z".
   */
  getViewerMetadata?: () => Promise<any | null>

  /** Gets the user config for this game */
  getUserConfig?: () => Promise<any>
}

export type HostPuzzleState = {
  input: string
  play: GamePlay & PuzzmoComGameplayRequest
  userInfo: UserInfo
  partnerSlug: string | undefined
}

/**
 *  The above definition of "GamePlay" is the pure version of the gameplay,
 *  but we send the entire PlayGameScreenQuery$data as the game bootstrap data.
 *
 *  To keep the runtime contract _not_ reliant on the request which only we
 *  control, this type has everything that we might be interested in as optional
 *  even if that's not strictly true.
 */
export type PuzzmoComGameplayRequest = {
  slug?: string
  puzzle?: {
    authors?: ActualUser[]
    emoji?: string | null
    slug?: string
    gameNameOverride?: string | null
    game?: {
      displayName?: string
      slug?: string
    }
    mostRecentDaily?: {
      daily?: {
        day?: string
        isToday?: boolean
      }
      status?: string | null
    } | null
    forceSettings?: object | null
  }
}

export type UserInfo = {
  username: string
  access: Collaborator["access"]
  user?: ActualUser | null | undefined
}


export type UserType = "Paid" | "Unverified" | "User" | "%future added value"

type ActualUser = {
  readonly id: string
  readonly nakamaID: string | null | undefined
  readonly name: string | null | undefined
  readonly roles: string
  readonly type: UserType
  readonly username: string
  readonly usernameID: string
}

```

{{< /details >}}

## Monorepo Migration

We used to have a few key repos:

- app (puzzmo.com)
- api (api.puzzmo.com and Studio)
- games
- shared (code which both api/app/games needed)
- opengraph (thumbs.puzzmo.com)

If you were doing pretty serious changes to Puzzmo, you were nearly always touching 2 repos, often three. If you're boldly pushing to main, then there's a bit less friction but if you're trying to do it all right then it's a lot of faff to make a change.

So, I consolidated the key projects into a single monorepo:

- Monorepo
  - app
  - api
  - studio
  - shared (creates an npm package on [GPR](https://docs.github.com/en/packages/quickstart))

Moving 300k lines of code with completely different runtime and environmental constraints was pretty tricky, and we're still figuring out some edge cases (I got [WallabyJS](https://wallabyjs.com) working last week for example)

This makes our "repos which count" look more like:

- monorepo
- games
- opengraph

We use [turbobuild](https://turbo.build) to handle only building or testing things when they change, and have never had an issue with it in the last 4 months.

## Future Goals

We have a few technical places where we want to explore in the next year:

- De-React Native Web-ing puzzmo.com - this is a two pronged project, first it needs to run on "react dom" and second we'd need to replace the navigation stack
- Consolidating puzzmo.com logic into Relay's [client schema extensions](https://relay.dev/docs/guides/client-schema-extensions/) and using fragment references
- I'd like to hook the API hot reloading to the puzzmo.com API client, and have it re-request recent GraphQL queries and auto-update the Relay cache in dev builds
- Figuring out higher level primitives for building admin dashboards
- Having a stable / long-term external version of RedwoodJS' graphql infra
- Look at common design patterns in games and turn those into libraries

Given that systems like this are living on-going codebases, we'll probably be forced into finding a whole new set of problems.