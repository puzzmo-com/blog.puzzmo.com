+++
title = 'Offline in Progress'
date = 2025-06-08T01:13:00+01:00
authors = ["orta"]
tags = ["tech", "native", "ios", "offline"]
theme = "outlook-hayesy-beta"
+++

For both Zach and I, working offline was one of the core tenets of "being an app". So, perhaps the majority of the four months I worked on the app was within this space.

There is no such thing as just "add offline mode" though, its like a tonne of small systems that all together interlock to get you a tight experience when you're on the subway and/or off wifi. It's really something that needs to be thought of from the get-go and constantly

In the end, timelines got me and we never finished what we'd call a _good enough_ experience for classing the Puzzmo iOS app as having "offline support." Some of this came from the complexity of not shipping the codebase as a React Native app but other parts are just that Puzzmo is a series of interlocked systems built intentionally to be separately deployed/updated and wrangling all these together is a nightmare.

So, let's try walk through some of the dead ends, some of the "this is actually in"s and get a sense of where progress could happen if/when we pick it back up.

Let's start from the start of someone's experience using the app on a daily basis. App launch. To load the app up from scratch without internet access we need (at least) two things: the code to run puzzmo.com inside the webview and today's gameplay data.

### Getting Puzzmo.com running offline

When you are faced with making a webview run offline, there are two options. Have the source code locally and run a server from your device, or use a service worker. I opted for a service worker, because that means adding offline support for the iOS app also benefits all web users too! This also means less conceptual forks in how the entire app is loaded, no-one today working on puzzmo.com loads up the iOS app to work on their features, so having a completely separate system here is just asking for things to break in the future.

Making a webview support a service worker is one of those esoteric bits of knowledge you find spread across the internet, here's the key thing to that search: you need to use `WKAppBoundDomains`.

These can be set on your app target:

![app target keys](target-properties.png)

Which is a list of hard-coded into the app, reviewable for Apple, website hostnames which you can then have referenced in the `WKWebViewConfiguration` when you are making the webview for your app.

```swift
let appVersionStr = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
let appVersion = (appVersionStr != nil) ? appVersionStr! : "-"

let webConfiguration = WKWebViewConfiguration()
webConfiguration.applicationNameForUserAgent = "Puzzmo/\(appVersion) (iPhone)"
webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")

// WKWebViews cannot load service workers by default, so you have to declare
// up-front the domains you could use in info.plist and then this flag
// allows it to load up.
webConfiguration.limitsNavigationsToAppBoundDomains = true

webView = WKWebView(frame: self.view.bounds, configuration: webConfiguration)
```

So, service workers, truly one of the dark corners of the DOM APIs - we already had a service worker for puzzmo.com because I added web notification support before launch. However, I knew we were going into 'thar be dragons' territory when every single search result for information in the space leads to a Google Chrome team library (workbox) which handles a lot of edge cases and every bundler level integration brings that library in by default.

So, perhaps with a hint of hubris and wanting to avoid hundreds of kb of dependencies for just the service worker - I opted to handle the caching of files and assets all myself.

We use vite, so I was already using `vite-plugin-pwa` to hook up a service worker. I extended the worker with a event emitter system that allows pre-caching all of the built assets which vite emitted.

Then I created a new page on puzzmo.com /dev/offline which gives information about the current cache of necessary assets for loading the website. This system I turned off and on a few times, because there's a lot of different things that should and shouldn't be cached it seems.

### Today's Puzzles

When you load up the app, and service worker has correctly loaded your JS/CSS/images offline - your app is going to ask your API for today's data. You're gonna now need a way to provide that!

There is a iOS native API called "background fetch requests" which has an equivalent in Chrome on mobile but not on Safari iOS. So, this is going to have to come from the native app.

We've got to be pretty creative here to not cause a lot of trouble for folks maintaining puzzmo.com. We use GraphQL, so the home page of puzzmo.com (the "today page") makes a GraphQL request to grab its data. This request changes relatively frequently. If we needed to make an iOS deploy for every change to the today page in order to keep offline mode working then the offline mode has systemically failed.

So, we need a level of dynamic introspection which can happen when the device does not have the app running. My eventual answer for this is pretty convoluted, but is flexible.

{{< details summary="Starting with the native background fetch API" >}}

```swift
extension AppDelegate {
    func setupBackgroundFetch() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.puzzmo.todayPageDownload", using: nil) { task in
             self.handleAppRefresh(task: task as? BGAppRefreshTask)
        }

        let request = BGAppRefreshTaskRequest(identifier: "com.puzzmo.todayPageDownload")

        // TODO: Set to tomorrow's daily 00:00
        // request.earliestBeginDate = Date(timeIntervalSinceNow:  60 * 60)
        do {
           try BGTaskScheduler.shared.submit(request)
        } catch {
           print("Could not schedule app refresh: \(error)")
        }

        // if its a sim, we can't do bg tasks, so trigger it on launch
        #if targetEnvironment(simulator)
        print("running bg task on simulator, skipping")
        self.handleAppRefresh(task: nil)
        #endif
    }

    func handleAppRefresh(task: BGAppRefreshTask?) {
        let operation = DownloadTodayPageDataOperation()

        task?.expirationHandler = { operation.cancel() }
        operation.completionBlock = {
            task?.setTaskCompleted(success: !operation.isCancelled)
        }
        OperationQueue.main.addOperation(operation)
    }
}
```

{{< /details >}}

Simple enough, you pass an `NSOperation` for the OS to handle which downloads the necessary data and stores it somewhere.

Let's look at `DownloadTodayPageDataOperation` because this is where things start getting weird. My answer to the need to have a dynamic lookup of the today page data is to have a `JSContext` run a script which runs off puzzmo.com that uses the latest version of the today page query.

So, how do we do that?

{{< details summary="The DownloadTodayPageDataOperation code" >}}

```swift
import Foundation
import UIKit
import JavaScriptCore

class DownloadTodayPageDataOperation: Operation, @unchecked Sendable {
    override func main() {
        // We need to use a group to handle the async trickiness where we jump into the JSContext
        // and then come back with a JSON string of the today page
        let group = DispatchGroup()
        group.enter()

        // Avoid deadlocks by not using .main queue here
        DispatchQueue.global(qos: .default).async {

            // Start a little JS environment
            guard let context = JSContext.extendedContext else { exit(-1) }

            context.isInspectable = true
            context.name = "DownloadTodayPageDataOperation JS"

            // Adds this instance to the runtime as "JSDownloadRuntime"
            let jsDownloadRuntime = JSDownloadRuntime()
            context.setObject(jsDownloadRuntime, forKeyedSubscript: "JSDownloadRuntime" as (NSCopying & NSObjectProtocol))

            // This is what triggers when the JS declares it is done,
            // it tells the dispatch queue that the operation has finished
            jsDownloadRuntime.setCompletionHandler { result in
                print("got a return value from JS \(result.lengthOfBytes(using: .utf8) ) bytes")

                TodayCache.setCachedJSONData(result)

                group.leave()
            }

            // Set up the two callbacks which are the exit points for the dispatch group we operate in
            jsDownloadRuntime.setErrorHandler { errMessage in
                print("Error downloading today page: \(errMessage)")
                group.leave()
            }

            context.exceptionHandler = { context, exception in
                print("JS Error: \(String(describing: exception!))")
                group.leave()
            }

            // Setup the variables to match the main query, there is a big warning
            // in the app's source code not to change these variables
            let todayVariables = TodayScreenQueryVariables(
                userToken: "",
                gameplayID: "wk5XHTO1OiHkrScPPo2aR",
                variables: TodayScreenQueryVariables_Variables(myUserStateID: "[id]")
            )

            let jsonEncoder = JSONEncoder()
            jsonEncoder.outputFormatting = [.prettyPrinted]
            guard let jsonData = try? jsonEncoder.encode(todayVariables) else {
                fatalError("Could not encode JSON")
            }
            let todayVariablesJSONString = String(data: jsonData, encoding: .utf8)!


            // Grab and evaluate the offline downloader script, then trigger a call to getTodaysDailyInfo
            // which passes it back to the app
            context.evaluateScript("""
            JSDownloadRuntime.fetch("\(webBaseURL)/offline-downloader.iife.js").then(r => {
               try {
                    eval(r)
                    getTodaysDailyInfo("\(apiBaseURL)/graphql", JSON.parse(`\(todayVariablesJSONString)`))
                } catch(e) {
                    console.log("Failed to eval")
                    JSDownloadRuntime.error(e.message)
                }
            })
            """)

        }

#if targetEnvironment(simulator)
        // NOOP as blocking isnt valuable in a simulator, this will only
        // get called in a background fetch environment where we need to provide
        // a locked operation until the work is done
#else
        group.wait()
#endif
    }
}

// The object exposed to the JS runtime
class JSDownloadRuntime: NSObject, JSDownloadRuntimeExports {
    var completionHandler: ((String) -> Void)?
    public func setCompletionHandler(_ handler: @escaping (String) -> Void) {
        self.completionHandler = handler
    }

    public func complete(_ jsonString: String) -> Void {
        self.completionHandler!(jsonString)
    }

    var errorHandler: ((String) -> Void)?
    public func setErrorHandler(_ handler: @escaping (String) -> Void) {
        self.errorHandler = handler
    }

    public func error(_ message: String) -> Void {
        self.errorHandler!(message)
    }

    // We expose a blank closure so that we can use the name 'fetch' and not an auto-generated
    // selector based on the objc naming system.

    // https://tabris.com/rename-selectors-exported-to-javascriptcore-in-swift/
    var fetch: FetchClosure = { link, opts in
        return fetchish(linkValue: link, optsValue: opts)
    }
}

 func fetchish(linkValue: JSValue, optsValue: JSValue) -> JSPromise {
    let promise = JSPromise()
    let link = linkValue.toString() ?? ""
    let params = optsValue.toDictionary() ?? [:]

    if let url = URL(string: link) {
        var req = URLRequest(url: URL(string: link)!)
        req.httpMethod = params["method"] as? String ?? "GET"

        if let headers = params["headers"] as? [String: String] {
            req.allHTTPHeaderFields = headers
        }

        if let bodyData = params["body"] as? String {
            req.httpBody = bodyData.data(using: .utf8)
        }

        print("\(req.httpMethod!) \(link) \(req.httpBody != nil ? "(with body)" : "")")

#if targetEnvironment(simulator)
//        if let bodyData = req.httpBody {
//            print(String(data: bodyData, encoding: .utf8) ?? "no body")
//        }
//        if let headers = req.allHTTPHeaderFields {
//            print(headers)
//        }
#endif


        URLSession.shared.dataTask(with: req){ (data, response, error) in
            if let error = error {
                promise.fail(error: error.localizedDescription)
            } else if let data = data, let string = String(data: data, encoding: String.Encoding.utf8) {
                promise.success(value: string)
            } else {
               promise.fail(error: "\(url) is empty")
            }
        }.resume()
    } else {
        promise.fail(error: "\(link) is not url")
    }

    return promise
}


typealias FetchClosure = (@convention(block) (JSValue, JSValue) -> JSPromise)


// Exposing these fns to the objc runtime means that they can be seen inside the JSContext above
@objc protocol JSDownloadRuntimeExports: JSExport {
    func complete(_ jsonString: String) -> Void
    func error(_ jsonString: String) -> Void
    var fetch: FetchClosure { get }
}

// { userToken?: string; gameplayID: string; variables: TodayScreenQuery$variables }
//
//export type TodayScreenQuery$variables = {
//  day?: string | null | undefined;
//  myUserStateID: string;
//  partnerID?: string | null | undefined;
//  partnerSlug?: string | null | undefined;
//};

struct TodayScreenQueryVariables: Codable {
    var userToken: String?
    var gameplayID: String
    var variables: TodayScreenQueryVariables_Variables
}

struct TodayScreenQueryVariables_Variables: Codable {
    var day: String?
    var myUserStateID: String
    var partnerID: String?
    var partnerSlug: String?
}
```

This gets us a lot of the way there, but it's not all of the infra we need. To be able to use a promise inside the JavaScript runtime, we need to have our own runtime implementations, here is the one I ended up with

```swift
// Based on https://gist.github.com/cute/ebf7a4bc414ca269ed8e82cd57a4150b

import JavaScriptCore

extension JSContext {
    subscript(key: String) -> Any {
        get {
            return self.objectForKeyedSubscript(key) as Any
        }
        set{
            self.setObject(newValue, forKeyedSubscript: key as NSCopying & NSObjectProtocol)
        }
    }
}

@objc protocol JSConsoleExports: JSExport {
    static func log(_ msg: String)
    static func error(_ msg: String)

}

class JSConsole: NSObject, JSConsoleExports {
    class func log(_ msg: String) {
        print(msg)
    }
    class func error(_ msg: String) {
        print("ERR", msg)
    }
}

@objc protocol JSPromiseExports: JSExport {
    func then(_ resolve: JSValue) -> JSPromise?
    func `catch`(_ reject: JSValue) -> JSPromise?
}

class JSPromise: NSObject, JSPromiseExports {
    var resolve: JSValue?
    var reject: JSValue?
    var next: JSPromise?
    var timer: Timer?

    func then(_ resolve: JSValue) -> JSPromise? {
        self.resolve = resolve

        self.next = JSPromise()

        self.timer?.fireDate = Date(timeInterval: 1, since: Date())
        self.next?.timer = self.timer
        self.timer = nil

        return self.next
    }

    func `catch`(_ reject: JSValue) -> JSPromise? {
        self.reject = reject

        self.next = JSPromise()

        self.timer?.fireDate = Date(timeInterval: 1, since: Date())
        self.next?.timer = self.timer
        self.timer = nil

        return self.next
    }

    func fail(error: String) {
        if let reject = reject {
            reject.call(withArguments: [error])
        } else if let next = next {
            next.fail(error: error)
        }
    }

    func success(value: Any?) {
        guard let resolve = resolve else { return }
        var result:JSValue?
        if let value = value  {
            result = resolve.call(withArguments: [value])
        } else {
            result = resolve.call(withArguments: [])
        }

        guard let next = next else { return }
        if let result = result {
            if result.isUndefined {
                next.success(value: nil)
                return
            } else if (result.hasProperty("isError")) {
                next.fail(error: result.toString())
                return
            }
        }

        next.success(value: result)
    }
}

extension JSContext {
    static var extendedContext:JSContext? {
        let jsMachine = JSVirtualMachine()
        guard let jsContext = JSContext(virtualMachine: jsMachine) else {
            return nil
        }

        jsContext.evaluateScript("""
            Error.prototype.isError = () => { return true }
        """)
        jsContext["console"] = JSConsole.self
        jsContext["Promise"] = JSPromise.self


        return jsContext
    }
}
```

{{< /details >}}

For the code downloaded from puzzmo.com I added a new sub-project to the Puzzmo monorepo called "offline-downloader" - it is a TypeScript project using vite with some dynamic code to upload a small script on puzzmo.com which uses the latest version of the today page GraphQL query from the built relay assets to request some data.

{{< details summary="The runtime script for offline-downloader.iife.js" >}}

This script understands that it is in a custom runtime, so APIs like fetch do not exist and need to be handled via an exposed runtime of `JSDownloadRuntime`.

```ts
/// <reference types="vite-plugin-compile-time/client" />
import { promises } from "node:fs"
import { resolve } from "node:path"
import type { TodayScreenQuery$variables } from "puzzmo-com/src/__generated__/TodayScreenQuery.graphql"
import { transformWithEsbuild } from "vite"

// We want to reduce the size of the built asset to just the query string, instead of all the relay
// compiler metadata. So we do build-time eval of the imports and just extract the query strings.

const todayQuery = compileTime(async () => {
  const path = resolve(__dirname, "../../apps/puzzmo.com/src/__generated__/TodayScreenQuery.graphql.ts")
  const content = await promises.readFile(path, "utf8")
  const js = await transformWithEsbuild(content, path)
  const dataUri = "data:text/javascript;charset=utf-8," + encodeURIComponent(js.code)
  const module = await import(dataUri)
  const query = module.default.params.text.replace("query TodayScreenQuery", "query TodayScreenQueryBGFetch")
  return query
})

const outer =
  typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : ({} as any)

declare const JSDownloadRuntime: {
  /** Tracks the reason for a failure, either this or complete _has_ to be called or you can end up in a deadlock */
  error: (message: string) => void
  /** Indicates a successful download of today data */
  complete: (jsonString: string) => void
  /** A fetch-ish API polyfill */
  fetch: (url: string, options: { method?: "GET" | "POST"; headers?: Record<string, string>; body?: string }) => Promise<string>
}

// We _do not have ES Promises_ in the JSC runtime, so do not write async functions.

outer.getTodaysDailyInfo = (apiURL: string, config: { userToken?: string; gameplayID: string; variables: TodayScreenQuery$variables }) => {
  if (typeof JSDownloadRuntime === "undefined") {
    throw new Error("JSDownloadRuntime is not defined in the runtime")
  }

  const headers: Record<string, string> = {}
  const token = config?.userToken || "~"

  headers["auth-provider"] = "custom"
  headers["authorization"] = `Bearer ${token}`
  headers["puzzmo-gameplay-id"] = config.gameplayID
  headers["runtime"] = "app"

  const body = {
    query: todayQuery,
    operationName: "TodayScreenQueryBGFetch",
    variables: config.variables,
  }

  JSDownloadRuntime.fetch(`${apiURL}?${body.operationName}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((jsonResponse) => {
      if (jsonResponse.startsWith("<")) {
        JSDownloadRuntime.error("Received HTML from server")
        return
      }

      JSDownloadRuntime.complete(jsonResponse)
    })
    .catch((err) => {
      console.error("Error fetching data", err)
      JSDownloadRuntime.error(err.message)
    })
}
```

{{< /details >}}

This technique sure jumps around a lot! You have an NSOperation which runs a JavaScript runtime with custom built Promise/fetch that grabs the latest version of the query generated at site build time. All that to grab and store some JSON data which is executed from inside that script!

I think when looking at this a second time, I think we can instead just export out the graphql query as a static string, have the NSOperation download that and run the code. This omits the whole JavaScript runtime system, but runs the risk of query params not being correct. But both versions have that problem. So, it'd be a good simplification.

So, now we have the data - that needs to be available to the app runtime! This is stored in the native app's cache directory, and we have the native iOS code respond to the request from the JS app:

```swift
func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage)  {
    guard let dict = message.body as? [String: AnyObject] else { return }
    guard let type = dict["type"] as? String else { return }

    // ...
    if (type == "today-cache") {
        let response = TodayCache.getCachedJSONData()
        if(response != nil) {
            sendMessage("response-today-cache", jsonObjString: "{ data: JSON.parse('\(response!)')")
        } else {
            sendMessage("response-today-cache", jsonObjString: "{}")
        }
       return
    }
}
```

Then, the JS app sends this message instantly on boot-up and if it is set, puts the data into the relay cache:

```ts
/**
 * The native app, via offlineDownloader.ts grabs the today page data via a bg
 * fetch request, we want to make a request for this as early as possible and keep it available
 * for later when the today page asks for the data.
 */
export const useSetupCachedTodayQuery = () => {
  const { appRuntime } = useAppContext()
  const sendNativeMessage = useSendNativeMessage()

  const run = appRuntime === "native-apple"
  useEffect(() => {
    if (!run) return
    sendNativeMessage({ type: "today-cache" })
  })

  useSubscribeToNativeMessage("app", "response-today-cache", (res) => {
    if (res.data) {
      console.debug("Taken data from bg fetch for today page", res)
      actualData = res.data
    } else {
      actualData = null
    }
  })
}

// * undefined = not set, null = known to not be there
let actualData: TodayScreenQuery$data | null | undefined = undefined
```

Then you could either override the data that the relay fetch makes to return `actualData`, or fake the query entirely using the `commitLocalUpdate` API, or use `getRequest` + `createOperationDescriptor` and finally `env.commitPayload` which is what we do for storing the user's logged in state offline, which you can see below:

{{< details summary="The system for tracking the user's logged in state offline" >}}

```ts
import { useEffect } from "react"
import { Environment, createOperationDescriptor, getRequest } from "relay-runtime"

import { storageKeys } from "@consts/constants"
import { PuzzmoCurrentUserFragment$data } from "@relay/PuzzmoCurrentUserFragment.graphql"
import { PuzzmoCurrentUserStateFragment$data } from "@relay/PuzzmoCurrentUserStateFragment.graphql"
import { PuzzmoQuery$data } from "@relay/PuzzmoQuery.graphql"

import { RootAppQuery } from "../../Puzzmo"
import { bigIntJSONParse, bigIntJSONStringify } from "../../util/bigIntJSON"

/** Stash the results of the main puzzmo query */

export const useLocalCachePuzzmoQuery = (
  currentUser: PuzzmoCurrentUserFragment$data | null | undefined,
  userState: PuzzmoCurrentUserStateFragment$data,
  publishingPartner: PuzzmoQuery$data["publishingPartner"] | null | undefined,
  system: PuzzmoQuery$data["system"] | null | undefined
) =>
  useEffect(() => {
    if (typeof localStorage === "undefined") return
    // For quick launch, you can see the other side of this in RelayProvider
    localStorage.setItem(storageKeys.puzzmoBootstrapData, bigIntJSONStringify({ userState, currentUser, publishingPartner, system }))
  }, [currentUser, userState, publishingPartner, system])

/**
 *  We _don't_ want to make a lookup for the current user on launch, so we store the
 * user in local storage and load it into the relay cache here.
 */
export const hydrateLocalCacheWithPuzzmoQuery = (env: Environment, partnerSlug: string | null) => {
  if (typeof localStorage === "undefined") return

  const existingLogin = localStorage.getItem(storageKeys.puzzmoBootstrapData)
  if (!existingLogin) return

  try {
    const req = getRequest(RootAppQuery)
    const operationDescriptor = createOperationDescriptor(req, { partnerSlug })

    const priorData = bigIntJSONParse(existingLogin) as PuzzmoQuery$data

    if (priorData.system) {
      // @ts-expect-error - this isn't in the query response, but relay would sneakily request it
      priorData.system.id = "main:sys"

      // We should be assuming that they may be opening from a different day, so we should
      // set up the date key to be the current date in the servers timezone

      // As we make a request for the real data, this should get overwritten pretty quickly
      const date = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }))
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const speculativeDateKey = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`
      // @ts-expect-error - its marked readonly but its a clone which is mutable
      priorData.system.todayDateKey = speculativeDateKey
    }

    const payload = priorData

    env.commitPayload(operationDescriptor, payload)
  } catch (error) {
    console.error("Error parsing existing login from localstorage", error)
    localStorage.removeItem(storageKeys.puzzmoBootstrapData)
  }
}
```

{{< /details >}}

Tada, you've got an offline version of your homepage. In theory, some of this is turned off right now because I've not gone through all the edge cases (and it's a complete nightmare to test because of how many systems need to be in place to test it, and background fetch only runs on a real iOS device and not a simulator.)

That is, in theory, enough to show the root homepage of puzzmo.com.

### But the homepage is more complex than that, Game Sync

I said we operate with 2 monorepos, that means a vite build knows everything about puzzmo.com - but it knows nothing about games.

Our games are built in a different repo, with different deployment infrastructure and their own choices of technology. Hrm.

Again, working from a user first opening up Puzzmo, the homepage has game thumbnails which are code maintained by the games team. So how do they work offline?

To get thumbnails working offline, we need to know all of the built assets for the game ahead of time also. This I handled in a custom vite plugin:

{{< details summary="The custom vite plugin" >}}

```ts
/** Makes manifest files that we control which gives the studio tooling infra, and offline mode a way to what assets used are used in a game */
export const createManifestsPLugin = () => ({
  name: "manifests",
  generateBundle: {
    order: "post",
    async handler(opts, bundle) {
      const assets = Object.keys(bundle)
      const files = assets.filter((v) => !v.endsWith(".map"))
      const subfolder = files[0].split("/").slice(0, 1).join("/")

      const skip = subfolder === "really-bad-chess"
      this.emitFile({
        type: "asset",
        fileName: `${subfolder}/offline.meta.json`,
        source: JSON.stringify({ files, skip }),
      })

      // Inject the metadata for a game into the manifest if it exists
      const lookingFor = `${process.cwd()}/${gameName}/metadata.ts`
      if (existsSync(lookingFor)) {
        const module = await import(lookingFor)

        if (module.metadata) {
          this.emitFile({
            type: "asset",
            fileName: `${subfolder}/metadata.json`,
            source: JSON.stringify(module.metadata),
          })
        }
      }
    },
  },
})
```

{{< /details >}}

These manifests are at a predictable position in a game's file system, so after we have enough data to grab the data for the home page, we send a message to the service worker with all of the games seen on the today page. This is handled in a relay hook fragment:

{{< details summary="The iOS system for an event emitter" >}}

```ts
import { useEffect } from "react"
import { graphql, useFragment } from "react-relay"

import { gameBootstrapURLInfo } from "@puzzmo-com/shared/gameBootstrapURLInfo"
import { usePrecacheGameAssets$key } from "@relay/usePrecacheGameAssets.graphql"

import { useAppContext } from "../../../AppContext"
import { useCoreContext } from "../../CoreContext"

const fragment = graphql`
  fragment usePrecacheGameAssets on TodayPage {
    daily {
      puzzles {
        puzzle {
          id
          game {
            slug
            assetsPath
            assetsSha

            cssPath
            devCSSPath
            devJSPath
            jsPath
            devThumbnailPath
          }
        }
      }
    }
  }
`

/** Uses the service worker "workbox" APIs to pre-cache assets for the games  */
export const usePrecacheGameAssets = (data: usePrecacheGameAssets$key) => {
  const { environment } = useAppContext()
  const { ambientContext } = useCoreContext()
  const dailyPuzzles = useFragment(fragment, data)
  const hasSW = !!navigator.serviceWorker
  useEffect(() => {
    if (!ambientContext.precacheAllGameAssets) {
      if (environment.isDev()) console.log("Skipping precache of game assets")
      return
    }
    // In a private browser, service workers are disabled
    if (!navigator.serviceWorker) return console.log("SW: Service worker not available")

    // Start with the iframe used to play a game
    const urlsToCache = [environment.embedURL()]

    for (const rec of dailyPuzzles.daily.puzzles) {
      const gameURLs = gameBootstrapURLInfo(document.location, rec.puzzle.game)
      urlsToCache.push(`${gameURLs.root}`)
    }

    // Send the list of URLs to the service worker
    navigator.serviceWorker.ready.then((reg) => {
      if (!reg.active) {
        console.error("Service worker not active")
        return
      }
      reg.update()
      reg.active.postMessage({ type: "CACHE_GAME_URLS", payload: { urlsToCache } })
    })
    //                                                                  \/ this is intentional, because it affects behavior!
  }, [dailyPuzzles, environment, ambientContext.precacheAllGameAssets, hasSW])
}
```

These are handled inside the server worker via the event listener system:

```ts
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis
// Messages sent from the app to the SW
sw.addEventListener("message", (event) => {
  logger.debug("SW Event", event.data)
  const data = event.data as ServiceWorkerMessagesReceived

  switch (data.type) {
    case "CACHE_GAME_URLS": {
      const uniqueURLs = new Set<string>(event.data.payload.urlsToCache)
      event.waitUntil(getAllPossibleFilesToCache([...uniqueURLs.values()]))
      break
    }
    // ...
  }
})

/**
 * The game sends over roots of the current active games on the today page, we need to go
 * to each of those games and get the offline manifest, and then cache all the files in that
 * which are mentioned into the service worker cache so that it can be offered as a response
 * in the 'fetch' event above.
 */
const getAllPossibleFilesToCache = async (initialGameRoots: string[]) => {
  logger.debug("SW: Getting all possible files to cache", initialGameRoots)

  const htmlFiles = initialGameRoots.filter((url) => url.endsWith(".html"))
  // TODO: I've added a 'skip' attribute to the manifest in the games repo,
  //       so we can skip caching some files declaratively later
  const gameRoots = initialGameRoots.filter(
    (url) => (url.includes("puzmo.blob") || url.includes("cdn.")) && !url.includes("really-bad-chess")
  )

  const failLog = (url: string) => {
    logger.debug(`SW: Failed to fetch game manifest at ${url}`)
    return null
  }

  // Grab the offline manifests from the CDN which describe the assets we need ahead of time
  const manifests = await Promise.all(
    gameRoots.map(async (url) => {
      const res = await fetch(`${url}/offline.meta.json`)
      if (!res.ok) return failLog(url)
      if (res.status !== 200) return failLog(url)
      if (!res.headers.get("Content-Type")?.includes("application/json")) return failLog(url)

      const json = await res.json()
      return [url, json] as const
    })
  )

  // Get all those assets, and their manifests into a flat array
  const allFiles = [...htmlFiles]
  for (const manifest of manifests) {
    if (!manifest) continue
    if (manifest[1].skip) continue
    for (const file of manifest[1].files) {
      const dropFinalPathComponent = manifest[0].split("/").slice(0, -1).join("/")
      allFiles.push(dropFinalPathComponent + "/" + file)
    }
    allFiles.push(manifest[0] + "/offline.meta.json")
  }

  // Chess is a bit of an issue due to the AI being a bg service worker and I've not figured out how to handle it yet, so avoid it
  const droppingChessAI = allFiles.filter((url) => !url.includes("aiWorker"))

  // Incrementally add the files to the cache, there are helper methods
  // which do batch work, but you dont get to see the errors.
  await manuallySyncURLsToCache(cacheKeys.games, droppingChessAI)
}

/**
 * A fn which probably manually replicates the logic in `cache.addAll` but
 * we get better logs, and can see what failed.
 */
const manuallySyncURLsToCache = async (cacheName: string, urls: string[]) => {
  const cache = await caches.open(cacheName)
  if (!cache) throw new Error("Failed to open cache")

  let found = 0
  let downloaded = 0

  // Incrementally add the files to the cache, there are helper methods
  // which do batch work, but you dont get to see the errors.
  const promiseStack = urls.map(async (file) => {
    const exists = await cache.match(file)
    if (exists) {
      found++
      return
    }
    try {
      downloaded++
      const res = await fetch(file)
      if (!res.ok) throw new TypeError("bad response status")
      await cache.put(file, res)
    } catch (error) {
      console.error("Failed to cache", file, error)
      // throw error
    }
  })

  await Promise.all(promiseStack)

  console.debug(`SW Caching files to ${cacheName}`, { urls })
  console.debug(`SW ${cacheName} Found`, found, "Downloaded", downloaded)
}
```

{{< /details >}}

That should be enough information for the service worker to be able to cache the thumbnails, and most of the game assets! Which is great, because we've still not got around to going into a game yet.

### Starting a Game

Puzzmo has always tried to operate on the relay-style "one navigation, one networking request" policy. The page to play a game is architected on a db model called "GamePlayed" which is when a user/anon plays an instance of a puzzle. So, my first thoughts in this space were: if you have offline play enabled, then when we load the today page and have interacted, behind the scenes the app will make a request to "play" every single game. This would fill up the relay cache with the correct data on the client and acts exactly like the model we've just shown for the home page.

For a while this idea really shook me, it lived well within the seams of the client's architecture but would require creating a gameplay for every puzzle for every user in the database. Super lossy, we're already making almost a million GamePlayeds a week and this would add an ordinal of additional (potentially unused) network traffic to the app as it prepared for all the games to be able to play offline.

That wasn't going to work.

After letting the idea settle for a while, I came up with an amended different plan. These big networking requests for the play game page are nearly all for the "wrapping" around the game (help, sidebars, attribution, tutorials, daily info) but they aren't necessary to play the actual game. For that you need a few things: an iframe, the HTML in that iframe, a set of asset URLs that the iframe requests, a puzzle, any existing game played state and the [viewer metadata](https://blog.puzzmo.com/posts/2024/09/19/plugins-are-back-in-style/#viewer-metadata).

Next, I converted the server API to lie to the client, in our GraphQL API you would ask a `Puzzle` for its `currentUserGamePlayed` to get the state of your current gameplay (or it would be `null` if you haven't played.) Now it will always return a gameplay, either as a blank object waiting to be filled or your own. This drops the problem of creating unnecessary database rows and allows for consistent client-side data modelling.

Next I created what I frame as the minimal possible amount of data necessary to open up a game. This was the idea I talked about in the ["Puzzmo Perf wins"](https://blog.puzzmo.com/posts/2025/02/06/digging-into-perf/) blog post. Roughly, I added a new concept "Core Gameplay data" which is enough information to boot up and play a game. This subset is small enough that was about 90% accounted for already inside the home page query! The next step was then to introduce a fragment hook with a way to pass information between screens.

{{< details summary="The core gameplay fragment which the today page and play game screen reference" >}}

```ts
import { useCallback, useEffect } from "react"
import { graphql, readInlineData } from "react-relay"

import { BootstrapGameData, GameConfig } from "@puzzmo-com/shared/hostAPI"
import { TodayScreenQuery$data } from "@relay/TodayScreenQuery.graphql"
import { usePlayGameReady$data, usePlayGameReady$key } from "@relay/usePlayGameReady.graphql"
import { useTheme } from "@theme/useTheme"

import { useAppContext } from "../../../AppContext"
import { useGetUser } from "../../CoreContext"
import { usePlayGameSelector } from "../../lib/playGameContext/usePlayGameSelector"
import { useSubscribeToGameEvent } from "../../lib/playGameContext/useSubscribeToGameEvent"
import { useIsMobile } from "../../screenMetricsContext/useIsMobile"

export const playGameReadyFragment = graphql`
  fragment usePlayGameReady on GamePlayed @inline {
    id
    slug
    boardState
    completed
    elapsedTimeSecs
    additionalTimeAddedSecs
    createdAt
    hintsUsed
    cheatsUsed
    resetsUsed
    ownerID
    nakamaMatchID
    metric1
    metric2
    metric3
    metric4
    metricStrings
    pointsAwarded
    viewerOwnsPuzzle
    combinedTimeSecs

    puzzle {
      id
      slug

      name
      gameNameOverride

      emoji
      puzzle
      difficulty
      difficultyPointsCap

      seriesNumber
      accessOverride
      viewerMetadata(viewerID: $myUserStateID, partnerSlug: $partnerSlug)
      forceSettings

      authors {
        id
        name
        username
        usernameID
        publishingName
      }

      game {
        assetsPath
        assetsSha
        cssPath
        devCSSPath
        devJSPath
        devThumbnailPath
        displayName
        exposedGlobalFunction
        flags
        jsPath
        layout
        mobileAdPosition
        readiness
        slug
        thumbnailGlobalFunction
        thumbnailJSPath
      }

      mostRecentDaily(fullInclude: true, playerID: $myUserStateID) {
        daily {
          day
          dateKey
          isToday
        }
        status
        vanillaPartnerSlug
      }
    }
  }
`

export const usePlayGameReady = (gamePlayed: usePlayGameReady$data) => {
  const sendMessage = usePlayGameSelector((state) => state.gameUIState.sendMessageToGameFn)
  const theme = useTheme()
  const isMobile = useIsMobile()
  const user = useGetUser()
  const { appRuntime } = useAppContext()

  const onReady = useCallback(async () => {
    if (!sendMessage) return
    const hostFlags: GameConfig["hostFlags"] = []

    if (!isMobile) hostFlags.push("desktop")
    if (appRuntime === "native-apple") hostFlags.push("native-ios")

    const dataToSend = JSON.parse(
      JSON.stringify({
        type: "READY_DATA",
        data: {
          startOrFindGameplay: {
            gamePlayed,
          },
          theme,
          hostFlags,
          hostContext: [],
          appRuntimeContract: "1.0",
          userState: user.userState,
          currentUser: user.currentUser,
        } satisfies BootstrapGameData,
      })
    )

    sendMessage(dataToSend)
  }, [isMobile, gamePlayed, sendMessage, theme, user.currentUser, user.userState, appRuntime])

  useSubscribeToGameEvent(gamePlayed.slug, "READY", onReady)
}

const localStorageOfOffline = new Map<string, { gameplay: usePlayGameReady$key; dateKey: string }>()

export const useLocalTrackingOfOfflineGameplays = (today: TodayScreenQuery$data) => {
  useEffect(() => {
    for (const rec of today.todayPage.daily.puzzles) {
      const gameplay = rec.puzzle.currentAccountGamePlayed
      if (gameplay && rec.urlPath) localStorageOfOffline.set(rec.urlPath, { gameplay, dateKey: today.todayPage.daily.dateKey })
    }
  }, [today])
}

export const useGetLocallyTrackedOfflineGameplayInfo = (urlPath: string) => {
  if (!localStorageOfOffline.has(urlPath)) return null

  const item = localStorageOfOffline.get(urlPath)!
  const gameplay = readInlineData(playGameReadyFragment, item.gameplay)
  return { gameplay, dateKey: item.dateKey }
}
```

{{< /details >}}

This means the game could start up at the same time as we start making the API request for the play game screen! Which is a big perf win for everyone. OK, is that enough to play a game? No.

First off, I had to re-architect the play game screen to be able to operate solely on the core gameplay data above. A non-trivial task as this screen has very messy state management. Then we need to start dealing with a new problem: failing networking requests.

Puzzmo's "network request failed" error screen is a big full-screen modal, and there's a lot of assumptions baked into the web app that you are indeed online and have reasonable network access. It is, after all, a website. This model doesn't work when you are building offline support and so I had to introduce a new concept: failable relay queries.

Effectively, we now have a hook which replaces `useLazyLoadQuery` when it's OK for that networking request to fail.

{{< details summary="Our useOfflineableRelayQuery " >}}

```ts
import { useEffect, useState } from "react"
import { GraphQLTaggedNode } from "react-relay"
import { useRelayEnvironment } from "react-relay"
import { OperationType, fetchQuery } from "relay-runtime"

/**
 * Typically a fail in a relay query will trigger an error, for this
 * hook - a network fail is considered generally OK and is just logged
 */
export const useOfflineableRelayQuery = <T extends OperationType>(
  query: GraphQLTaggedNode,
  variables: T["variables"],
  fetchKey: string,
  initialData?: T["response"] | null
) => {
  const environment = useRelayEnvironment()

  // We want the variables to be memoized so that we don't trigger a new query
  // when the variables object changes, but we do want to refresh if the inner
  // values of the object change
  const [vars, setVars] = useState(variables)

  useEffect(() => {
    const oldVars = JSON.stringify(vars)
    const newVars = JSON.stringify(variables)
    if (oldVars !== newVars) {
      setVars(variables)
    }
  }, [variables, vars])

  useEffect(() => {
    // To make the react linter happy
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    fetchKey

    // Create a relay observable
    const observable = fetchQuery<T>(environment, query, vars, {
      fetchPolicy: "store-or-network",
    })

    const sub = observable.subscribe({
      next: (data) => {
        console.log("offline relay data", data)
        setData(data)
        setError(null)
      },
      error: (e: Error) => {
        console.error("offline relay error on network request")
        setError(e)
      },
      complete: () => {
        console.log("offline relay complete")
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [environment, query, vars, fetchKey])

  const [data, setData] = useState<T["response"] | null>(null)
  const [error, setError] = useState<T["response"] | null>(null)

  return [data || initialData, error] as const
}
```

{{< /details >}}

So, we've switched over the `useLazyLoadQuery` to our `useOfflineableRelayQuery` does that load the game offline? Again. no.

### Game Frames

The iframe, and its JavaScript needs to be able to run offline. The architecture I designed for the iframes is a full, separate build in the monorepo (because this code is also re-used in external sites [like this Polygon page](https://www.polygon.com/24074129/flipart-puzzmo)).

It looked something like this:

```html
<iframe src="https://puzzmo.com/_embed/latest.html?gameplay=1a2b3c&bg=FFEEBB" width="100%" height="100%"></iframe>
```

Not great, we have a query param which changes for every game played (`gameplay`) and (`bg`) is per theme, changing your theme should not break your offline status! To make this URL safely cachable, I made it possible to pass these params as search params instead. Allowing for a URL like:

```html
<iframe src="https://puzzmo.com/_embed/latest.html#gameplay=1a2b3c&bg=FFEEBB" width="100%" height="100%"></iframe>
```

A browser won't distinguish this, and we can add a hardcoded rule in the service worker for tracking `https://puzzmo.com/_embed/latest.html`. That's enough to play a game right? No.

Lets look at the head for that HTML:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
  <title>Puzzmo Embedded Game Runner</title>
  <meta name="description" content="Puzzmo Embedded Game Runner" />
  <meta name="robots" content="noindex, nofollow" />
  <script type="module" crossorigin="" src="https://www.puzzmo.com/_embed/assets/index-BTMQ_Qqs.js"></script>
  ...
</head>
```

Ah, we're bundling our JS, and now we need to be able to know where all that JavaScript lives too. This could easily become a game a whack-a-mole where any runtime change would make for broken builds. Hrm.

I solved this by throwing away the idea of separating out the embedded runner and the puzzmo.com runtime. I converted the embed's JavaScript to act as a referenceable package within the monorepo and added a new build target to puzzmo.com which has the same code as the iframe but inside the app. Now there is a `runtime.html` in the root which replicates the HTML inside `https://puzzmo.com/_embed/latest.html` but uses the same bundling pipeline as Puzzmo.com (which makes it available in the original service worker manifest.) Meaning URLs can be:

```html
<iframe src="https://puzzmo.com/runtime.html#gameplay=1a2b3c&bg=FFEEBB" width="100%" height="100%"></iframe>
```

Can games now load offline? Yes, yes they can.

### Game State

They can load a game, but they will almost instantly crash. We send incremental updates for games to the server, so you can refresh the page or change devices and carry on. This is going to bail. Simply making it NOOP when offline also isn't a good idea either, the app can be closed for all sorts of reasons and we'll need to keep information about your progress and completed states somewhere. We're gonna need a new system.

To replace the "update game" GraphQL mutation I introduced a new gameplay state sync. This sync engine updates three places: the relay cache, localStorage, and the API. We take updates from the in-progress game and always apply updates to the cache and localstorage, then try make the API request to update and if it succeeds we drop the stored information for that game. It tracks completions, and has an API to update the today page when it opens up too. So that you can complete a game offline, it is stored in localStorage and then closing and re-opening the app will keep that state. Then the next time you visit a game it will try sync everything so far.

{{< details summary="The game state sync engine hook" >}}

```ts
import { useCallback, useEffect, useRef } from "react"
import { graphql, useMutation, useRelayEnvironment } from "react-relay"

import { UpdateGamePlayedInput } from "@relay/GamePlayUpdateMutationsCheckpointMutation.graphql"
import { useIsOnline$key } from "@relay/useIsOnline.graphql"
import { useSyncGameplayStateWithServerCompleteMutation } from "@relay/useSyncGameplayStateWithServerCompleteMutation.graphql"
import { captureException } from "@sentry/browser"

import { AppContextType, useAppContext } from "../../../AppContext"
import { useHasLoggedInUserGotRole } from "../../CoreContext"
import { authHeadersForRequest } from "../../lib/RelayProvider"
import { useIsOnline } from "../../lib/offline/useIsOnline"

let hasSyncedFromLocalStorage = false
const gameStateMap: Map<string, GameState> = new Map()

type GameState = {
  updateState: UpdateGamePlayedInput | null
  completedState: useSyncGameplayStateWithServerCompleteMutation["variables"] | null
}

const syncDebugLogs = false
const dLog = (...args: any[]) => syncDebugLogs && console.log("[sync]", ...args)

// This is the hook that tracks gameplay changes, it aims to work both online and offline.

// We want both online and offline folks to be using the same code paths, and so what we have is a system where
// we track the state of the game in a map, and have a "sync" function which runs over the changes to the map.

// So, instead of directly calling the update mutations, we store the state in the sync map, and trigger a sync
// syncs will occur every x seconds, where x is determined by the number of fails in a row (and is reset on game
// complete, a network call success or the navigator online/offline event) )

export const useSyncGameplayStateWithServer = (localState: useIsOnline$key) => {
  // It's tempting to make something which knows if it is "offline" or "online", but
  // I'd posit that it's often more complicated than that. The best we can really do
  // is say to ourselves "did the last request fail?" and if so, we can assume we need a break
  // before giving it another try.
  const failedRequestCount = useRef(0)

  // That said, if systemically we are told we're back online - we can reset the counter and
  // hope for the best on the next network request
  const isOnline = useIsOnline(localState)
  useEffect(() => {
    if (!isOnline) return
    dLog("navigator.online triggering a reset of failed count")
    failedRequestCount.current = 0
  }, [isOnline])

  const ctx = useAppContext()
  const [completeGame] = useMutation<useSyncGameplayStateWithServerCompleteMutation>(CompleteGame)

  const relayEnv = useRelayEnvironment()

  // Updates the relay cache for a specific game
  const updateRelayState = useCallback(
    (id: string, obj: UpdateGamePlayedInput, also?: [string, any][]) =>
      relayEnv.commitUpdate((store) => {
        const record = store.get(id)
        if (!record) return
        if (record.getValue("completed")) return
        for (const key of keysToUpdateOnRelayModel) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key as keyof UpdateGamePlayedInput] as any
            if (value) record.setValue(value, key)
          }
        }
        if (also) {
          for (const [key, value] of also) {
            record.setValue(value, key)
          }
        }
      }),
    [relayEnv]
  )

  /**
   * Syncs any stored data with relay (for thumbnails etc) - this wants to be called
   * when the app boots up, when you load a today page, and when a gameplay page is unmounting
   */
  const syncWithRelay = useCallback(() => {
    const entries = Array.from(gameStateMap.entries())
    if (entries.length === 0) return

    dLog("syncWithRelay - syncing", entries)
    // Logic to sync the gameStateMap with the relay server
    for (const [id, state] of entries) {
      if (state.updateState) {
        updateRelayState(id, state.updateState)
      } else if (state.completedState) {
        updateRelayState(id, state.completedState.input, [["completed", true]])
      }
    }
  }, [updateRelayState])

  /** Syncs the stored data with the localStorage backup */
  const syncWithLocalStorage = useCallback(() => {
    const entries = Array.from(gameStateMap.entries())
    if (entries.length === 0 && localStorage.getItem("offline-gameStates")) {
      localStorage.removeItem("offline-gameStates")
      dLog("syncWithLocalStorage - removed")
    } else {
      const serializedState = JSON.stringify(entries)
      localStorage.setItem("offline-gameStates", serializedState)
      dLog("syncWithLocalStorage - saved")
    }
  }, [])

  useEffect(() => {
    // On first load, sync with local storage
    if (hasSyncedFromLocalStorage) return
    const serializedState = localStorage.getItem("offline-gameStates")
    if (serializedState) {
      const entries: [string, GameState][] = JSON.parse(serializedState)
      for (const [id, state] of entries) {
        gameStateMap.set(id, state)
      }
      dLog("syncWithLocalStorage - first load", entries)
    } else {
      dLog("syncWithLocalStorage - no data")
    }
    syncWithRelay()
    hasSyncedFromLocalStorage = true
  }, [syncWithRelay])

  // When this hook un-mounts, call sync with relay to update thumbnails
  // outside of the play game screen
  useEffect(() => syncWithRelay(), [syncWithRelay])

  let onNetworkFail: ((str: string) => void) | null = null

  // The actual sync engine
  const sync = useCallback(() => {
    const entries = Array.from(gameStateMap.entries())
    if (entries.length === 0) {
      dLog("sync - no data")
      waitingToSync.current = false
      return
    }
    dLog("sync - syncing", entries)
    waitingToSync.current = false
    syncWithRelay()

    for (const [id, state] of entries) {
      if (state.updateState && !state.completedState) {
        updateInProgressGameplayState({
          gameplayID: id,
          data: state.updateState,
          onCompleted: () => {
            dLog("updated gameplay", id)
            // It might have completed during the network request
            if (gameStateMap.has(id) && gameStateMap.get(id)!.completedState) {
              gameStateMap.get(id)!.updateState = null
            } else {
              gameStateMap.delete(id)
            }

            // Update the local store
            syncWithLocalStorage()
          },
          onError: () => onNetworkFail?.(`update ${id}`),
          ctx,
        })
      } else if (state.completedState) {
        completeGame({
          variables: state.completedState,
          onCompleted: () => {
            dLog("completed gameplay", id)
            gameStateMap.delete(id)
            syncWithLocalStorage()
          },
          onError: () => onNetworkFail?.(`complete ${id}`),
        })
      }
    }
  }, [ctx, completeGame, syncWithRelay, syncWithLocalStorage, onNetworkFail])

  // Basically tells the system to trigger a sync in the future
  const waitingToSync = useRef(false)
  const triggerSync = useCallback(() => {
    if (waitingToSync.current) return
    const timeOutTime = 1500 + failedRequestCount.current * 1000
    dLog("triggerSync in ", timeOutTime, "ms")
    setTimeout(sync, timeOutTime)
    waitingToSync.current = true
  }, [sync])

  // If we fail a network request, hit the triggerSync function again which will
  // schedule a re-sync in the future
  onNetworkFail = useCallback(
    (status: string) => {
      dLog(`network call failed ${status}`)

      failedRequestCount.current += 1
      triggerSync()
    },
    [triggerSync]
  )

  const updateGameState = useCallback(
    (id: string, data: UpdateGamePlayedInput) => {
      dLog("updateGameState", id, data)
      if (gameStateMap.has(id)) gameStateMap.get(id)!.updateState = data
      else gameStateMap.set(id, { updateState: data, completedState: null })
      triggerSync()
    },
    [triggerSync]
  )

  const completeGameState = useCallback(
    (id: string, data: useSyncGameplayStateWithServerCompleteMutation["variables"]) => {
      dLog("completeGameState", id, data)
      failedRequestCount.current = 0
      if (gameStateMap.has(id)) {
        const existing = gameStateMap.get(id)!
        existing.completedState = data
        existing.updateState = null
      } else {
        gameStateMap.set(id, { updateState: null, completedState: data })
      }
      triggerSync()
    },
    [triggerSync]
  )

  return {
    updateGameState,
    completeGameState,
    // syncWithLocalStorage,
    // syncWithRelay,
  }
}

const CompleteGame = graphql`
  mutation useSyncGameplayStateWithServerCompleteMutation(
    $id: ID!
    $input: CompleteGamePlayedInput!
    $deedValues: [DeedValue!]!
    $augmentations: Augmentations
    $pipelineStats: JSON!
    $myUserStateID: String!
    $partnerSlug: String
  ) {
    completeGameState(id: $id, input: $input, deedValues: $deedValues, augmentations: $augmentations, pipelineStats: $pipelineStats) {
      id
      puzzle {
        ...CurrentUserPuzzleThumbnail
      }
    }
  }
`

const updateInProgressGameplayState = async (options: {
  ctx: AppContextType
  onCompleted: () => void
  onError: () => void
  gameplayID: string
  data: UpdateGamePlayedInput
  preferAPIDotPuzzmo?: boolean
}) => {
  const { ctx, onCompleted, onError, gameplayID, data } = options
  const headers = await authHeadersForRequest(ctx.appRuntime, ctx.apiClient)

  try {
    const apiRoot = ctx.apiClient.apiRoot()
    const response = await fetch(`${apiRoot}updateGameplay`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: gameplayID, ...data }),
      credentials: "include",
    })

    if (response.ok) {
      // 204 is "no content" - which is a success
      if (response.status === 204 || response.status === 200) {
        onCompleted()
      } else {
        try {
          const resText = await response.text()
          if (resText.startsWith("{") && resText.endsWith("}")) {
            const json = JSON.parse(resText)
            if (!json.success) console.error(resText)
            onError()
          } else {
            console.error("Got unexpected parsing response from updateGameplay", resText)
            onError()
          }
        } catch (error: any) {
          onError()
          console.error("Error parsing response from updateGameplay", error.message)
          console.error(response)
          //  Report to Sentry regardless
          captureException(error)
        }
      }
    } else {
      onError()
    }
  } catch (error: any) {
    console.error("Error updating gameplay", error.message)

    //  Report to Sentry regardless
    captureException(error)
    onError()
  }
}

const keysToUpdateOnRelayModel = [
  "elapsedTimeSecs",
  "additionalTimeAddedSecs",
  "hintsUsed",
  "cheatsUsed",
  "resetsUsed",
  "boardState",
  "metric1",
  "metric2",
  "metric3",
  "metric4",
  "metricStrings",
]
```

{{< /details >}}

With progress saving we're in a great place for getting through the game now.

Only kinda one thing left: completing a game!

### Completing A Game

Well, this doesn't exist because I've not built it. Ran out of time.

However, the next big throwing system is going to be the information which is presented at the end of a game. For us, there's quite a lot of funky server-side code going on for our completions but it doesn't have to be that way. My plan was to handle the networking API failure manually, and then show a simplified completion sidebar which uses [the deeds directly](https://blog.puzzmo.com/posts/2024/07/16/augmentations/#augmentations--deeds--expressions) instead of letting the server provide the information.

### Yeah but if it's half done?!

I agree, well, actually we agree. Zach and I spent some time considering this issue - if people will assume there is offline support because it is an app. We should probably have some sort of system telling you it's not actually ready when we go offline. We toyed around with some popover concepts but eventually settled on a really cool idea.

We ended up building a secret game just for the native app, and just for when you are offline. Game design wise it's got some heft, making it a bit chunkier than say the jumping dinosaur in Google Chrome. We don't treat it like the rest of the Puzzmo games and so it doesn't apply to dailies or have limits on how much you can play. We shipped with over 300 puzzles in it, so it should be available to take some time if/when you need it.

I liked that, it was a fun (and very Puzzmo) answer to a pretty tricky problem of trying to handle expectations.

So, what now? Well, at some point I will pick this up and try wrap up offline support for everyone (web and iOS) - maybe in 2026. Till then, I hope you can learn something from Puzzmo's first big software abandonment.
