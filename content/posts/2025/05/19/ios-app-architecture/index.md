+++
title = 'iOS App Architecture'
date = 2025-05-19T10:00:38+01:00
authors = ["orta"]
tags = ["tech", "web", "ios", "native", "app", "graphql"]
theme = "outlook-hayesy-beta"
+++

Well, "finally" we got a Puzzmo iOS App. From day 1, I had been anticipating needing to build a native app for Puzzmo eventually, in part because of Zach's rich history of shipping iOS games but also when you tell someone you make games one of the first questions they ask is "do you have an app?".

My theory on blogging has always been write what I wish I had read at the start of a project. So, lets look at the process of making the iOS app, key components and techniques I shipped or abandoned in the process of writing the app.

1. 2.5 years of React Native
1. 0.5 years of Swift
1. Messaging systems and where responsibilities can lay
1. Offline Support
1. Game Center Support

## Not so React Native

Before Puzzmo, I had a decade or so experience in making native apps, they all generally fall into one "type" of App though, which I call a "**"pretty JSON parser"**:

> Eigen is an app where we take JSON data from the server, and convert it into a user interface. Each view controller can nearly always be described as a function taking data and mapping it to a UI.

{{< cite src="https://artsy.github.io/blog/2017/02/05/Retrospective-Swift-at-Artsy/#what-are-artsys-apps" ref="Retrospective: Swift at Artsy (2017)" >}}

These types of apps can be summerized as taking some API data, making it look pretty and providing some ways for a user to interact back with the data. Puzzmo may be a game system, but everything outside of the games is server-driven data being rendered on a screen in your design system.

I don't think it makes sense to re-implement the core guts of these applications three separate times for the three major platforms most modern companies care about (the web/the mobile duopoly). If you are super well funded as a project and can afford the engineers, I'm still not fully convinced it's worth it for these apps - there's like a set of core shared experiences and then such a slim amount of platform specific work. For example at Artsy we were many years into using React Native, but I still shipped [Augmented Reality](https://artsy.github.io/blog/2018/03/18/ar/) features natively.

There are other key reasons to re-implement though. The team you have may devs _enjoy_ platform specific stuff either, like preferring Kotlin or SwiftUI, or even that they just enjoy focusing on a single platform because they use it and feel like it connects with them. I was one of [those people](https://artsy.github.io/blog/2012/05/11/on-making-it-personal-in-iOS-with-searchbars/). As a company are often [shipping your org chart](https://www.microsoft.com/en-us/microsoft-365-life-hacks/organization/what-is-conways-law), and IMO the desires to make native products for a lot of companies at this point are often about keeping career ladders moving and using the resources you already have.

But Puzzmo is a pretty JSON parser, most of the code in this platform (~200k LOC of TS) is outside of running games (~80k LOC of TS) and replicating huge chunks of that in each language and platform is asking for bugs, process and time to ship stuff. I'd like to keep those things all as low as possible. So, I knew I'd be looking for an abstraction.

You can see a week into starting working on Puzzmo in this [a 12m video](https://youtu.be/2NItowAgfNA), that I considered React Native Web as the base for Puzzmo's front-end to probably be a good option from a set of trade-offs. So, I started the codebase using [Expo](https://expo.dev) (a set of extra tools on top of React Native) and while it was just me writing the code, I regularly would Expo's [EAS](https://expo.dev/eas) to create native builds for running a mini-[testflight](https://developer.apple.com/testflight/) experience with Zach.

And for a time, it was good.

My initial working premise was this: We can build and focus on Puzzmo as a React Native codebase with web being the key platform. The goal was always to ship the web first, and then can work bit-by-bit on getting the native builds solid. Had Puzzmo not [been acquired](https://www.theverge.com/2023/12/4/23984103/puzzmo-acquired-hearst-zach-gage), I think this would have been doable. But the acquisition verson Puzzmo meant bigger budgets, extended scope and a larger team. So, in that world, there were three main things which I felt were blocking the idea of a single React Native codebase working for us:

1. Our team is very web slanted, and React Native's abstractions are based on native concepts, not web
2. The complexity of legal and SDK requirements inside the codebase
3. Game code could crash the entire app, and the games team didn't have an easy way to know this ahead of time

So, I ran a dev team meeting to discuss some of these trade-offs and we concluded that we should migrate the puzzmo.com codebase from React Naive and the iOS app is going to be a webview wrapper with native integrations.

## Native

The app itself is about 3k lines of Swift code which is an even split between the app and a natively implemented game that lives inside the same codebase.

My iOS knowledge is about 7-8 years out of date, but its still pretty useful in terms of understanding how to build a modern app. I got a lot of respect for Swift the language, but it [still](https://artsy.github.io/blog/2017/02/05/Retrospective-Swift-at-Artsy/#native-downsides/) feels like a really pedantic language, great for building an Operating System or Camera app, but over-engineered for CRUD / pretty JSON parser. However, nowadays we I have GitHub copilot and the built-in Swift LLM recommendation tools in Xcode. Which certainly soften some of the hard edges.

Because I knew the codebase would stay reasonably small, I fully vendored all our (one) dependencies using SwiftPM into the monorepo which meant that anyone with Xcode installed can open it up and have a working local build. This also meant it worked out of the box with Xcode Cloud (apple's CI service) which I use for all deploys nowadays.

Xcode itself has had a few interesting improvements since I last used it, I enjoy the different fonts for comments and forgot how much I use `cmd + j` a lot and I want it in VS Code. Not having automatic code formatting as you type does make it always feel a bit broken.

## Webview Wrangling

My initial goal was to replicate the same type of architecture that we used at Artsy for our iOS app: use a native navigation pattern and then have router layer which knew whether to show a webview or a native view for a particular URL route.

This pattern worked well back a decade ago, but expectations on a mobile website are higher now, Puzzmo's internal architecture and changes in the tech powering webviews has made this a dead end nowadays.

Today the idea of shipping drastically simplified mobile versions of apps is pretty much dead, with a lot of designers and engineers instead going for a 'mobile-first' approach where the majority of focus is on the mobile and then the desktop is offered a flourish here and there. While I don't do this (I don't use a phone, and our puzzmo.com traffic is roughly 50/50 desktop/mobile) I do agree that we should have feature parity with desktop and mobile.

This means there's a lot of connective code which operates between pages in puzzmo both on mobile and on desktop, which makes for loading a fresh web page for every single navigation both slow and doesn't feel right. We use Relay as this fast internal key-value cache for all sorts, and with the "per screen webview" technique it's being re-created from web data on every page load.

Finally, it's now only possible to use Apple's WKWebView tech which runs out-of-process, so user-land systems for sharing caches between webview instances are not possible.

The final nail in the coffin for this technique was that I had hoped that I could use a native `UINavigationController` menubar (e.g. the one built into the system) to handle the title bar info but that too was dropped because we had a team working on a re-design of these components in web-tech and didn't know what it would look like in the end. I didn't want us to be forced into making native builds when there were titlebar design changes - and was especially worried about design slippage between the puzzmo.com on mobile and the iOS version.

After looking at all these dead ends, I eventually just had to conclude that we would have a single webview for puzzmo.com as the root of the site and try to handle making the web view feel more native.

Is this an optimal solution? Not really, I think it's harder nowadays to make a hybrid webview app which could explain why React Native and Flutter usage rises while I rarely hear of much from the "use a webview" crowd.

## Message Systems

One of the first things I built was a bi-directional message sending system for going between puzzmo.com's embedded app and the iOS native codebase. Inside the Puzzmo codebase we have to distinguish between running in a few different contexts. So, I consolidated some of our logic into a new "app runtime" which gives a sense of the three core but different runtime environments that the codebase needs to support:

```ts
const isApp = navigator.userAgent.includes("Puzzmo")
const isEmbeddedApp = document.location.pathname.includes(...)
const appRuntime = isApp ? "native-apple" : isEmbeddedApp ? "app-embed" : "web"
```

On the web side, our messaging is built off the same style of event emitting which we use for playing the games inside `<iframe>`s, which is this:

{{< details summary="The base for an event emitter" >}}

```ts
type IncomingMessages = import("@puzzmo-com/shared/hostAPI").AllIncomingMessagesToApp
type Events = Partial<{
  [key in IncomingMessages]: Function[]
}>

// Based on https://css-tricks.com/understanding-event-emitters/
export function createEventEmitter<EventMap extends Record<string, any>>(verboseLogging = false) {
  const events: Partial<Record<keyof EventMap, Function[]>> = {}

  return {
    events,
    subscribe: (name: keyof EventMap, cb: Function) => {
      if (!events[name]) events[name] = []
      events[name]?.push(cb)

      return {
        unsubscribe: () => {
          // triple shift to always get a positive number
          // If indexOf returns -1, it'll get converted to a positive number
          // where all 32 bits are 1, which is 2^32 - 1, so nothing gets deleted
          events[name]?.splice(events[name]!.indexOf(cb) >>> 0, 1)
        },
      }
    },
    emit: (name: keyof EventMap, ...args: any[]) => {
      if (verboseLogging) console.log(`Emitting event ${String(name)}`, args)

      if (!events[name]) return
      events[name]?.forEach((fn) => fn(...args))
    },
    _: "" as keyof EventMap,
  }
}

export const appEventsEmitter = createEventEmitter<Events>()

/**
 * Subscription hook
 * Unsubscribes when cacheKey changes.
 */
export function makeUseEmitterSubscription<Map extends Record<string, any>>(messageEmitter: { subscribe: any }) {
  return <Key extends keyof Map>(cacheKey: string, key: Key, fn: (data: Map[Key]) => void) => {
    useEffect(() => {
      // only create a listener if we have a cacheKey.
      const listener = cacheKey ? messageEmitter.subscribe(key, fn) : null
      return () => {
        if (listener) return listener.unsubscribe()
      }
    }, [key, fn, cacheKey])
  }
}
```

{{< /details >}}

The iOS native message system builds on this event emitter abstraction and co-locates all of the messages sent and received into a single file.

{{< details summary="The iOS system for an event emitter" >}}

```ts
import { useCallback, useEffect } from "react"

import { AvailableHaptics, Theme } from "@puzzmo-com/shared/hostAPI"
import { PublishingPartnerAppearance } from "@relay/PuzzmoCurrentUserFragment.graphql"
import { PublishingPartnerNavBackground, PublishingPartnerNavForeground } from "@relay/PuzzmoQuery.graphql"
import { TodayScreenQuery$data } from "@relay/TodayScreenQuery.graphql"

import { useAppContext } from "../../AppContext"
import { createEventEmitter, makeUseEmitterSubscription } from "../lib/createEmitter"

// This is immutable! Do not _remove_ or _change_ the strings in these fields.
// The native app needs these to operate.

type AppSpecificPartner = {
  backURL: string
  navHeight: number
  logoLongBlack: string
  logoLongWhite: string
  logoHeight: number
  logoWidth: number
  ourLogoOffsets: readonly number[] // [number, number]
  theirLogoOffsets: readonly number[] //[number, number]
  appearance: PublishingPartnerAppearance
  navBG: PublishingPartnerNavBackground
  navFG: PublishingPartnerNavForeground
  ourLogoFG: PublishingPartnerNavBackground
  ourLogoFGOverride: string | null | undefined
}

type MessagesSentToNativeApp =
  // An offer of runtime-specific info to give to the native app
  | {
      type: "app-context"
      userStateID: string
      accountID: string | undefined
      sound: string | null | undefined
      haptics: string | null | undefined
      appBackgroundColor: string
      userID: string | undefined
      partnerID: string | undefined
      partner: AppSpecificPartner | null | undefined
      theme: Theme
    }
  // A request to get the pricing information for the apple store
  // this happens on the subscription screen and other buttons
  | {
      type: "request-pricing-apple"
    }
  // Starts a puzzmo subscription
  | { type: "start-appstore-subscription"; accountID: string; productID: string }
  // NOOP
  | { type: "start-iap"; id: string }
  // Opens the manage subscription page modal in-app
  | { type: "manage-appstore-subscription" }
  // A request to get the cached version of the today screen's data
  | { type: "today-cache" }
  // A request to trigger a specific haptic feedback event
  | { type: "haptics"; method: AvailableHaptics }
  // Deprecated: This is used to tell the native app that the page has been loaded,
  // it is not used for a more general tracking, it simply tells the app
  // when specifically marked pages have loaded
  | { type: "page-loaded"; page: "today" }
  // A request to show the game center leaderboard
  | { type: "show-game-center-leaderboard"; id: string; scope?: "friends" | "global"; timeScope?: "today" | "week" | "all" }
  // A request to show the game center
  | { type: "show-game-center"; scope: "leaderboards" | "achievements" | "challenges" | "dashboard" | "localPlayerProfile" }
  | {
      type: "critical-failure"
      errorMessage: string
      info?: { query: string; stack: string }
    }
export type MessagesReceivedFromNativeApp = {
  "response-pricing-apple": {
    prices: {
      id: string
      /** Likely always "Puzzmo Plus" */
      name: string
      /** The price of the sub, e.g. "$39.99" */
      price: string
      /** The type of the sub, e.g. "Auto-Renewable Subscription" or "Consumable" (always "Auto-Renewable Subscription" for us) */
      type: "Auto-Renewable Subscription" | "Consumable"
      /** Is the sub a monthly version? */
      monthly: boolean
      /** Is the sub an annual version? */
      annual: boolean
      /** Does an intro offer exits (e.g. 1 month free trial) */
      hasIntroOffer: boolean
      /** The period of the intro offer (e.g. "1 Month") */
      introOfferPeriod: string | null
      /** Whether the user is eligible for the intro offer */
      introEligibility: boolean
      /** Whether this user has subbed to this offer */
      isSubscribed: boolean
      /** Whether someone is in a grace period (maye a trial?) */
      isGracePeriod: boolean
    }[]
  }
  "apple-tracking-transparency": {
    enabled: boolean
  }
  "response-today-cache": {
    data?: TodayScreenQuery$data
  }
  "game-center-id-set": {
    // Correct data will always start with "A:"
    gameCenterID: string | null
  }
}

const showingIPCLogs = typeof localStorage !== "undefined" && localStorage.getItem("showIPCLogs") === "true"
const nativeEventsEmitter = createEventEmitter<MessagesReceivedFromNativeApp>(showingIPCLogs)
;(globalThis as any).nativeEventsEmitter = nativeEventsEmitter

export const useSubscribeToNativeMessage = makeUseEmitterSubscription<MessagesReceivedFromNativeApp>(nativeEventsEmitter)

export const useSendNativeMessage = () => {
  const { appRuntime } = useAppContext()

  return useCallback(
    (message: MessagesSentToNativeApp) => {
      if (appRuntime !== "native-apple") return
      if (!("webkit" in window)) throw new Error("No webkit on window")
      if ((window as any)?.webkit?.messageHandlers?.app === undefined) {
        throw new Error("No native handler")
      }
      console.debug(`Sending native message ${message.type}`)
      console.debug(message)
      ;(window as any).webkit.messageHandlers.app.postMessage(message)
    },
    [appRuntime]
  )
}

export const useNotifyAppOfPageLoad = (page: "today") => {
  const sendMsg = useSendNativeMessage()
  useEffect(() => {
    sendMsg({ type: "page-loaded", page })
  }, [sendMsg, page])
}
```

{{< /details >}}

TLDR: we call `messageHandlers.app.postMessage()` to send to the iOS app codebase, and listen to a global constant of `nativeEventsEmitter`.

For a time, I explored making a rust CLI tool which converts these types into Swift `struct`s based on the oxc compiler tools. So that the TypeScript unions can be the single source of truth. This was before I had explored using the chat parts of these code assistant tools, and so I didn't get too far but it could be worth giving a second shot nowadays. I'm finding the "chat" bits to be quite useful when working on low-stakes things in environments you don't fully comprehend.

On the native side, we need to set up `messageHandlers.app` which will automatically set up the `postMessage` function too:

{{< details summary="The iOS system for an event emitter" >}}

```swift
import Foundation
import WebKit
import RevenueCat

class AppComms: NSObject, WKScriptMessageHandler {
    private weak var networkMonitorManager: NetworkMonitorManager?
    private weak var webView: WKWebView?

    var context: MessagesSentAppContext?

    init(webView: WKWebView, networkMonitorManager: NetworkMonitorManager) {
        self.webView = webView
        self.networkMonitorManager = networkMonitorManager
        super.init()

        // Allow injecting code into the webview
        webView.configuration.userContentController.add(self, name: "app")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage)  {
        guard let dict = message.body as? [String: AnyObject] else { return }
        guard let type = dict["type"] as? String else { return }

        if (isSimulator) {
            print("<- a message from the webview: '\(type)'")
            print("    with payload: \(dict)")
        }

        if type == "app-context" {
          // ...
        }


        if type == "start-appstore-subscription" {
            print("Received request to start sub")
            guard let account = dict["accountID"] as? String else {
                return print("> Account ID not found in message")
            }
            guard let productID = dict["productID"] as? String else {
                return print("> Product ID not found in message")
            }

            Purchases.shared.logIn(account) { info, created, error in
                Task {
                    let product = await Purchases.shared.products([productID]).first
                    if (product == nil) { return print("Could not find product ID") }

                    let result = try? await Purchases.shared.purchase(product: product!)
                    let anyTransactions = (result?.transaction?.sk2Transaction?.purchasedQuantity ?? 0) > 0
                    if (anyTransactions) {
                        self.webView?.load(URLRequest(url: URL(string: "https://puzzmo.com/success")!))
                    } else {
                        self.webView?.reload()
                    }
                }
            }
            return
        }
    }

    func sendMessage(_ key: String, jsonObjString: String) {
        if (isSimulator) {
            print("-> sending message to webview: '\(key)'")
            print("    with payload: \(jsonObjString)")
        }

        DispatchQueue.main.async {
            let js = """
            // This comes from the native codebase, message: '\(key)'
            if (!window.nativeEventsEmitter) throw new Error("nativeEventsEmitter not found on globalThis")

            window.nativeEventsEmitter.emit('\(key)', \(jsonObjString))
            """
            self.webView?.evaluateJavaScript(js)
        }
    }
}
```

{{< /details >}}

That gives you a way to have a button in the web app's code which triggers native code, and the other way around.

### Pricing and Subscriptions

For the web, we use Stripe and are super happy with it - it's been incredibly flexible and has allowed for us to have all sorts of interesting dynamic deals and discounts running off a bunch of booleans in our codebase.

Apple's subscription infrastructure is a lot more ahead-of-time and static. Each subscription offer and in-app purchase needs to go through review processes and sticks around on your app store permanently, in addition to Apple taking a 30% cut of all sales.

But somewhat critically for our puzzmo.com - the information about pricing, availability, the strings we should show are all things that can only be accessed from the device itself. So, for a "Pretty JSON parser" app, we actually need to be infusing information taken from the app if we want to be able to say "Get a subscription for €40."

This meant that our subscription page, and CTA-style buttons needs some information from puzzmo.com(what available subscriptions are possible) but then need to ask the iOS app "get me info about these app store products"

What we do is have at launch, and upon request via a message is a Swift lookup for all possible App Store subscriptions:

{{< details summary="The iOS system for an event emitter" >}}

```swift
import Foundation
import StoreKit

// These are keys available in App Store connect
let productIDs = [
    "annual.plus.puzzmo.com",
    "monthly.plus.puzzmo.com",
]

var pricingInfoFromStoreKit: [ProductInfo] = []

struct ProductInfo: Encodable {
    let id: String
    let price: String
    let name: String
    let type: String
    let annual: Bool
    let monthly: Bool

    let hasIntroOffer: Bool
    let introOfferPeriod: String?
    let introEligibility: Bool
    let isSubscribed: Bool
    let isGracePeriod: Bool
}

func getPricingInfoForProductIDs() async -> Void {
    do {
        let productList = try await Product.products(for: productIDs)
        print("Fetched products: \(productList)")
        for item in productList {
            try await pricingInfoFromStoreKit
                .append(
                    ProductInfo(
                        id: item.id,
                        price: item.displayPrice,
                        name: item.displayName,
                        type: item.type.rawValue,
                        annual: item.subscription?.subscriptionPeriod.unit == .year,
                        monthly: item.subscription?.subscriptionPeriod.unit == .month,
                        hasIntroOffer: item.subscription?.introductoryOffer != nil,
                        introOfferPeriod:  item.subscription?.introductoryOffer?.period.debugDescription ?? nil,
                        introEligibility: item.subscription?.isEligibleForIntroOffer ?? false,
                        isSubscribed: item.subscription?.status.contains(where: { subStatus in
                            return subStatus.state == .subscribed
                        }) ?? false,
                        isGracePeriod: item.subscription?.status.contains(where: { subStatus in
                            return subStatus.state == .inGracePeriod
                        }) ?? false,
                    )
                )
        }
    } catch {
        print("Error fetching products: \(error)")
    }
}
```

{{< /details >}}

Which is then able to be sent as JSON to the client as the information to build the subscription page. We also re-designed the subscription page, but not comprehensively enough to account for all of the stripe cases, so now there is "subscription page" and "subscription page 2" in the codebase.

I guess it's worth the footnote but in the US and the EU now, it's possible to not support Apple's purchases and subscription infrastructure (30% of all your digital revenue is a massive ask) but doing so would effectively ruin _your_ reputation/relationship with Apple and also because support is piecemeal per country then you are still going to have the duplicate systems regardless.

## Offline

For both Zach and I, working offline was one of the core tenets of "being an app". So, perhaps the majority of the four months I worked on the app was within this space.

There is no such thing as just "add offline mode" though, its like a tonne of small systems that all together interlock to get you a tight experience when you're on the subway and/or off wifi. It's really something that needs to be thought of from the get-go and constantly

In the end, timelines got me and we never finished what we'd call a _good enough_ experience for classing the Puzzmo iOS app as having "offline support." Some of this came from the complexity of not shipping the codebase as a React Native app but other parts are just that Puzzmo is a series of interlocked systems built intentionally to be separately deployed/updated and wrangling all these together is a nightmare.

For the sake of a reasonable brevity _in this post_, I have opted to move the offline discussion [into it's own post](posts/2025/06/02/offline-wip/).

## Game Center

We were interested in figuring out what parts of the iOS experience we could integrate outside of payments, and Game Center was an easy win. While being a bit of an under-utilized feature nowadays, Game Center used to be something I used every day during [Jetpack Joyride](https://apps.apple.com/us/app/jetpack-joyride/id457446957)'s heyday. We wondered if it would be possible to replicate a subset of our Puzzmo leaderboards and have those integrate into the existing leaderboard infrastructure we have in Puzzmo today.

When I first thought about this, I felt that maybe the response payload for completing a game could include enough information for the native app to be able to submit to a specific leaderboard itself. This it turned out, didn't need to happen. Instead we sync the temporary Game Center user ID with the database model and on the server we can post to the leaderboards [via an API call.](https://developer.apple.com/documentation/appstoreconnectapi/gamecenterleaderboardentrysubmissioncreaterequest)

Which meant the whole thing ended up being remarkably simple, and easy to maintain:

{{< details summary="The post to Game Center leaderboard code" >}}

```ts
import { DeedValue } from "types/shared-schema-types"

import { PuzzleDaily, UserState } from "@prisma/client"

import { createAppStoreConnectAPI } from "src/lib/appstoreConnectAPI"
import { isDevAPI, puzzmoAppVendorID } from "src/lib/constants"
import { GameSlug } from "src/lib/games/gameRepo"
import { RichGamePlay } from "src/services/games/gameCompleted"

// Leaderboard identifiers can be found in https://appstoreconnect.apple.com/apps/6714482734/distribution/gamecenter
//
const gameCenterLeaderboards: Partial<Record<GameSlug, { appleID: string; deed: string; ourStableID?: string }[]>> = {
  crossword: [
    {
      appleID: "com.puzzmo.leaderboard.crossword.time",
      ourStableID: "game-crossword:time",
      deed: "time",
    },
    {
      appleID: "com.puzzmo.leaderboard.crossword.plonks",
      ourStableID: "game-crossword:plonks",
      deed: "plonks",
    },
  ],
  "flip-art": [
    {
      appleID: "com.puzzmo.leaderboard.flipart.rotations",
      ourStableID: "game-flip-art:moves",
      deed: "moves",
    },
    {
      appleID: "com.puzzmo.leaderboard.flipart.score.week",
      ourStableID: "game-flip-art:score-week",
      deed: "points",
    },
  ],
}

export const gameCenterLeaderboardStableIDMap = new Map(
  Object.entries(gameCenterLeaderboards).flatMap(([gameSlug, leaderboards]) =>
    leaderboards.map((lb) => [lb.ourStableID, { gameSlug, ...lb }])
  )
)

export const handleGameCenterLeaderboards = async (
  userStates: UserState[],
  gameplay: RichGamePlay,
  puzzleDaily: PuzzleDaily,
  deedValues: DeedValue[]
) => {
  const gameCenterPlayers = userStates.filter((us) => us.gameCenterID)
  if (!gameCenterPlayers.length) return

  const gameSlug = gameplay.puzzle.game.slug
  const gameCenterLeaderboard = gameCenterLeaderboards[gameSlug as GameSlug]
  if (!gameCenterLeaderboard) return

  // Don't submit for bonus puzzles, or variants (e.g. big crossword)
  if (puzzleDaily.status === "BonusPaidOnly") return
  if (gameplay.puzzle.subvariantID || gameplay.puzzle.variantID) return

  const api = await createAppStoreConnectAPI()

  for (const leaderboardInfo of gameCenterLeaderboard) {
    const score = deedValues.find((dv) => dv.id === leaderboardInfo.deed)?.value
    if (score === undefined && isDevAPI) throw new Error(`No deed value found for leaderboard ${leaderboardInfo.appleID}`)
    if (typeof score !== "number") throw new Error(`Score for leaderboard ${leaderboardInfo.appleID} is not a number (${score})`)

    for (const player of gameCenterPlayers) {
      // https://developer.apple.com/help/app-store-connect/reference/leaderboards/
      // and https://developer.apple.com/documentation/appstoreconnectapi/post-v1-gamecenterleaderboardentrysubmissions

      const attributes = {
        bundleId: puzzmoAppVendorID,
        scopedPlayerId: player.gameCenterID!, // e.g. "A:_3e3824d19e3c1a3c79ca0d8076a35a1c",
        score: Math.round(score).toString(),
        vendorIdentifier: leaderboardInfo.appleID,
      }

      // https://developer.apple.com/documentation/appstoreconnectapi/post-v1-gamecenterleaderboardentrysubmissions#Example-Request-and-Response
      try {
        const leaderboardCreateResponse = await api.gameCenterLeaderboardEntrySubmissionsCreateInstance({
          body: {
            data: {
              type: "gameCenterLeaderboardEntrySubmissions",
              attributes,
            },
          },
        })

        if (leaderboardCreateResponse.error) {
          console.log("Failed to create gc leaderboard entry for", leaderboardInfo.appleID)
          console.log(JSON.stringify({ request: attributes }, null, 2))
          console.error(JSON.stringify(leaderboardCreateResponse, null, 2))
          if (isDevAPI) throw new Error(`Error creating gc leaderboard entry for ${leaderboardInfo.appleID}`)
        } else {
          // console.log(`Created gc leaderboard entry for ${leaderboardInfo.appleID}`)
          // console.log(leaderboardCreateResponse.data)
        }
      } catch (e) {
        console.error(`Error creating gc leaderboard entry for ${leaderboardInfo.appleID}`)
        console.error(e)
      }
    }
  }
}
```

{{< /details >}}

We allow all users to post to these leaderboards, regardless of whether you have Puzzmo Plus, which is different to the normal Puzzmo leaderboards but we're hopeful that the advantages of interacting with your existing social graph could make the trade-off worth it for us.

New Game Center leaderboards need to go through the App Store review system and come shipped with a native build deploy, so it'll be a bit tricky to ship leaderboards for un-released games in the future but an ideal state is that we have one or two for each game further down the line. For now, we're happy with Flipart and Cross|words leaderboards!
