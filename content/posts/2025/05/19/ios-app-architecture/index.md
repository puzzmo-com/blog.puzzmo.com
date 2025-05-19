+++
title = 'iOS App Architecture'
date = 2025-05-19T10:00:38+01:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Well, "finally" we got a Puzzmo iOS App. The app version of Puzzmo has gone around the block to say the least.

From day 1, I had been anticipating needing to build a native app for Puzzmo eventually, in part because of Zach's rich history of shipping iOS games but also there's a set of folks who just prefer the systems-level integrations only available to native code.

I have a long history of making **"pretty JSON parser"** type of apps:

> Eigen is an app where we take JSON data from the server, and convert it into a user interface. Each view controller can nearly always be described as a function taking data and mapping it to a UI.

{{< cite src="https://artsy.github.io/blog/2017/02/05/Retrospective-Swift-at-Artsy/#what-are-artsys-apps" ref="Retrospective: Swift at Artsy (2017)" >}}

I don't think it makes sense to re-implement the core guts of these applications three separate times for the three major platforms most modern startups care about. If you are super well funded as a project and can afford the engineers, I'm still not fully convinced it's worth it - there's like a set of core shared experiences and then such a slim amount of platform specific work. I don't take issue that devs _enjoy_ platform specific stuff either, like preferring Kotlin or SwiftUI, or even that they just enjoy focusing on a single platform because they use it and feel like it connects with them. I was one of [those people](https://artsy.github.io/blog/2012/05/11/on-making-it-personal-in-iOS-with-searchbars/).

You are often [shipping your org chart](https://www.microsoft.com/en-us/microsoft-365-life-hacks/organization/what-is-conways-law), and IMO the desires to make native products for a lot of companies at this point are often about keeping career ladders moving and using the resources you already have.

But Puzzmo is a pretty JSON parser, most of the code in this platform (~200k LOC of TS) is outside of running games (~80k LOC of TS) and replicating huge chunks of that in each language and platform is asking for bugs, process and time to ship stuff. I'd like to be low on all of those things.

So, I knew I'd be looking for an abstraction.

You can see a week into starting working on Puzzmo in this [a 12m video](https://youtu.be/2NItowAgfNA), that I considered React Native Web as the base for Puzzmo's front-end to probably be a good option from a set of trade-offs. So, I started the codebase using [Expo](https://expo.dev) (a set of extra tools on top of React Native) and while it was just me writing the code, I regularly would Expo's [EAS](https://expo.dev/eas) to create native builds for running a mini-[testflight](https://developer.apple.com/testflight/) experience with Zach.

And for a time, it was good.

---
