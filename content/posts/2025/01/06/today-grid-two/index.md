+++
title = 'Towards a Dynamic Today Page Layout'
date = 2025-01-06T00:00:47Z
authors = ["orta"]
tags = ["changelog"]
theme = "outlook-hayesy-beta"
+++

Hey folks, we've been thinking a bit about the number of games on the homepage of Puzzmo.

We started Puzzmo with 5 games, some inline ads and a couple of items which would show here or there. In the last year, the number of potential games or items which we show has really multiplied!

The main grid for puzzmo currently shows info for:

- **Games**: we have 11 public games, we managed to allow for more puzzles to exist on the same space via tabs but it's still a lot
- **Your Updates**: we show info about friend requests, club invites, gift invites
- **News**: social news, yesterday news, current news, changelog updates
- **Puzzmo needs**: we post job offers, showcase why Puzzmo Plus is cool, and show ads to folks who are not subscribed

Over time we organically grew the algorithm the today page to handle the scale of usage but it's feeling stretched!

Thus, a version two of the sorting algorithm!

Roughly speaking, the new version comes with one or two key changes:

- **Games you don't play move down the page**. We are already tracking the last time you played a game for the streak algorithm, we're now using it to decide how high an individual game should be positioned (relative to a few headline games)

- **Dynamic positions**. It's hard to see it right now, but it's useful for us running Puzzmo to be able to say on a particular day, maybe one of the games should just be higher up or in a particular column

- **Less similar items**. We now have better tools to track what type of items we have on the page, so we can make sure we don't show too many of the same types of items in a row

We're planning on launching this next week with something cool, but if you'd like to give it a shot early: you can turn on a feature flag for the feature: https://puzzmo.com/me/features
