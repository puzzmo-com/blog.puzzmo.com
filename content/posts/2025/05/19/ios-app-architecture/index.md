+++
title = 'iOS App Architecture'
date = 2025-05-19T10:00:38+01:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Well, "finally" we got a Puzzmo iOS App. From day 1, I had been anticipating needing to build a native app for Puzzmo eventually, in part because of Zach's rich history of shipping iOS games but also when you tell someone you make games one of the first questions they ask is "do you have an app?".

My theory on blogging has always been write what I wish I had read at the start of a project. So, lets look at the process of making the iOS app, key components and techniques I shipped or abandoned in the process of writing the app.

1. 2.5 years of React Native
1. 0.5 years of Swift
1. Messaging systems and where responsibilities can lay
1. Offline Support
1. Webview wrangling

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

So, I ran a dev team meeting to discuss some of these trade-offs and we concluded that we migrate the puzzmo.com codebase from React Naive and the iOS app is going to be a webview wrapper with native integrations.

## Native

Building an iOS app
