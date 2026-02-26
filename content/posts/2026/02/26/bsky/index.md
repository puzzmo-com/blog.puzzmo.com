+++
title = 'Bluesky support for Puzzmo'
date = 2026-02-26T15:42:01Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Hey folks, this is a two part post: part 1 aims to be a general high level of what support for Bluesky, part 2 is a no-apologies deep dive into the motivations and tech necessary to make it work.

So, we've just shipped Bluesky support for Puzzmo! There are three main components:

- Matching your Bluesky follows on Puzzmo
- Making it possible to see other Puzzmonauts on Bluesky
- Storing interesting data on your Bluesky account for you

## Follow Matching

This feature harks back to an older era of apps where you would log in with Facebook et al to sync your friends to a new account. It's the sort of system which used to be popular as a way to to let you bootstrap smaller social networks in the 2000s like Flickr, Tumblr, Meetup or last.fm, and that's kinda what we're doing here. Bluesky is a great option for this because a lot of our users use it, and we opted to adopt Bluesky once it started to look like the main text-based social network.

## Street pass for Bluesky

Bluesky has a concept of accounts which can add labels to people's accounts, they are usually ran by a server and we call them labelers. Labelers are a key part of the [moderation strategy](https://github.com/bluesky-social/proposals/blob/main/0002-labeling-and-moderation-controls/README.md) for Bluesky (e.g. not just having a centralized moderation team).

People can subscribe to a labelers and labels can be used to remove things you aren't interested in seeing. When I saw this system, I wondered if there was something interesting about trying to use this system to highlight positive traits. For example there is a [pronoun](https://bsky.app/profile/did:plc:l3nbhdfelt5d26btksecetxu) labelers, [game dev](https://bsky.app/profile/ozone.birb.house) label, why not have a "[Is on Puzzmo](https://bsky.app/profile/did:plc:4p3ilpfcl77fqgoofjmghznc)" labeler?

This is a lesser used feature of Bluesky for sure, but it's an interesting one

## Storing data on your account

Sometimes it can be hard to predict what is going to be big or worth the time until much further down the line. For me, I like the idea of trying to increase the potential for serendipity around Bluesky, and so I wondered what it would mean to start syncing some of the data Puzzmo's stores to a more public space. A good example of this is a streak. These are things people care a lot about, and often want to showcase but today due to how tricky it is to store.