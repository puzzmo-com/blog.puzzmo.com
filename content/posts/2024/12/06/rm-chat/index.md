+++
title = 'Dropping chat from Puzzmo'
date = 2024-12-06T07:50:36-05:00
authors = ["orta"]
tags = ["changelog"]
theme = "outlook-hayesy-beta"
+++

Hey folks, we've just deployed a change which removes the chat section from Puzzmo.

I thought it'd be better that I also pour one out for the chat and give a sense of what we're thinking in that space and what's happening a bit behind the scenes on the site.

At the core of the problem: _Chat was not pulling its weight_, we have tens of thousands of logged in users, but usually have under ten chat messages posted across friends and groups per day.

Currently, chat is the only place where we have on-site "user generated" content e.g. things which must have moderation tools. This means that chat influences the designs of other systems because we need to be wary of potential toxicity from that space.

Personally, I've found chat to be a particularly tricky white whale to get right implementation-wise. I think I made some reasonable technical choices in how it works, but it's definitely an unreliable part of Puzzmo.

Finally, we're not sure if it's worth competing for mind-space with group chats like whatsapp/messenger/discord/etc and maybe there's something interesting in Bluesky we can do in lieu of this space.

So, today I wrapped up switching the social sidebar/overlay to instead link directly to the friend/group. Sorry folks still messaging!

---

We came back to chat because we're taking a cohesive look at a lot of our user-interface patterns. We've been building very fast in the puzzmo.com codebase over the last year since launch. These changes usually are tied into major game releases (Remixes, Pile-Up, Bongo, Weather Memoku, inline Bonus games) and each time we focus on smaller parts of the today page and the page for playing a game. This narrow focus is useful for getting something shipped, but nearly always comes with a more global "debt" which eventually needs to get paid.

We're trying to pay some of that debt, so expect to see more _"what puzzmo.com looks and feels like"_ changes over the next few months as we explore the space.