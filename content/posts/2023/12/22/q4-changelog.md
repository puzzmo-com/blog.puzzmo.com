+++
title = 'Puzzmo Tech Changelog 23Q4'
date = 2023-12-22T12:56:32Z
authors = ["orta"]
tags = ["changlog"]
theme = "outlook-hayesy-beta"
draft = true
+++

A changelog you say? Well, kinda, if I may start with an amble. There are a few ways which we split Puzzmo internally - both technically and culturally. For the CHANGELOG, I'm mainly going to be concentrating on "Puzzmo" the system, e.g. the bits which power game features like the website, leaderboards, scoring systems, groups, servers and that sort of thing. We generally call it either "app" _(the public facing website)_ or "api" _(the servers powering the website)_ stuff.

This kinda defines itself being not being "games" stuff like _"We changed Wordbind to use two words"_, the hows and whys for those sorts of things are not really my story to tell, and I have enough on my plate trying to keep on top of the app and api.

### What did it take to ship Puzzmo?

I guess this is as good a starting point as any. We launched puzzmo.com on [date], what we shipped was a process where you needed to solve a puzzle within a certain time-frame to get an invite into the main site. Once you were in the main site, you had to create an account and you had full access to Puzzmo. This process lasted about a month, while we bug-fixed the app with those users and prepared for the public launch which included partner sub-sites.

#### `launch.puzzmo.com`

The launch site we built as a separate website, on a separate domain. Keeping it there moved out complexity in the main app and allowed us to try  a different technique of writing websites (nextjs) than our current strategy for the app (react-native-web.) 

We based the launch website based on a mix of one of our first strategies for "launching" puzzmo: start by iterating through the games we have mixed with some ideas for ensuring we don't overwhelm our barely-load-tested servers. This meant creating a mix of only allowing 500 invites a day though the launch system, and then using the postal service to add some lag for American users.

This did mean for the first week or so, it was full of europeans who didn't get physical mail, which made for some interesting discussions on the Crossword's Americanness.

#### `<iframe>` embeds

For games which don't require a virtual keyboard on mobile, we felt we could do a good job of making "puzzle previews" which can be embedded [inside articles](https://www.theverge.com/23929222/puzzmo-newspaper-games-crossword-zach-gage) or on blog posts, for example:

<iframe title="Puzzmo Presents: Launch Day Puzzle #96" src="https://puzzmo.com/_embed/latest.html?embedID=launch-96" width="100%" height="800px" frameborder="0" allow="clipboard-write"></iframe>

The iframe embeds are a separate games runtime from our main application, it has less overhead and less features overall - but it's not supposed to be able to do so much anyway as they act more like a preview.

### `app`

Hooo boy, ~25 screens, roughly 70k LOC and a whole world of spit-shine. The majority of it wrote by two folks, and we've just added a third. The app itself is largely a Relay application built in React Native (web) but it also talks via a websocket to our multiplayer/social side.

We do quite a lot of work in the application in terms of having a mobile vs desktop.

### `api`

The API for this app is a pretty traditional RedwoodJS app, with a reasonable amount of features amount of features replaced or dropped. 

### Systems



#### Social

We felt like the ability to talk and interact with folks were pretty important in this space

#### Groups



#### Leaderboards



#### Chat

