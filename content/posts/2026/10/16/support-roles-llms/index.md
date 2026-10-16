+++
title = 'Supporting Acts: Letting Ambitious Ideas Ship via LLMs'
date = 2026-10-16T10:41:18+01:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++


When I started the Puzzmo codebases, we were in the generation where there are relatively obvious and distinct roles. We had designers, developers and product/business people. Folks who had some programming experience could contribute to the codebases, people interested in design could submit sketches and mockups.

Now we're living in chaos, and I'm letting more people add fuel to the fire.

I keep being asked 'how good are these models at programming?' - and the level of competency in my head has risen and risen until I roughly put it at the same level of prowess as I had when I was starting Puzzmo. That's like 15 years of pretty much daily experience in writing software. I mean, I've probably had my 10k hours a few times by that point.

There are people who do software engineering full time who may never end up with the hours and breadth I attained by that point. Now that's available to anyone, it's orders of magnitude faster than I was, and it's parallelizable.

So, for roughly $100 a month - you can have your own handful of orta-level programmers. This concept has really informed the last year of Puzzmo's technical direction and has been a real thinker to wrap my head around. There are places where I am OK not auditing the code (admin tools, scripts, some front-end projects) but maybe if the skill levels of LLMs have risen so much, I should be offering that freedom to others.

So, here are three cases where I have worked as support for someone with ambitious goals and trying to figure out when I can give up on some of my priors in order to allow someone to really shine.

## Games

So, let's jump back pretty much an exact year. I knew that I wanted to replace our admin tools, Studio, knew that I wanted to get server-side rendering working for Puzzmo and felt like Claude Code was getting very good at writing JavaScript games.

So, I pitched internally that we should start making a new system called 'Workshop' and that it would replace our existing game editing flow, and that we should start to use that to both allow people to make their own puzzles and they should be able to make their own games further down the line.

Zach jumped in on this project early, and together we built out an informed view of what it looks like to be writing _high quality_ games using LLMs. He worked on games, and I built out tooling, APIs, LLM-interactions via MCPs and admin interfaces in workshop. At the beginning I spent quite a lot of time inside these codebases both trying to understand the output of these machines but also shaping the output into something which fits into a Puzzmo-shaped hole.

The result of our collaboration in this space has been Missing Link, Ribbit, Hue Complete Me and now Draw 2 Solitaire.

With Draw 2 Solitaire's release this week Puzzmo had our first case of a game published to Puzzmo which did not have me touch a single line, nor do any systemic support. I'm not in the credits. Just another precedent in a year of constant precedents.

These are like full-quality Puzzmo games, with the bar still being comparable to what took a team of game-designers and developers about a quarter of a year to ship back in 2024. These games are not a 'one-shot' prompt to an LLM, but a year's worth of real engineering support and an ambitious game designer caring about the details over the course of months as one of many projects.

## Business Tools

My time for building business tools is finite, and one thing the business folks have been talking about for the longest time is adding Quizzes to be something Puzzmo offers to partners. Now there's lots of good reasons for it making sense, but also, lots of good reasons for us to not be taking the time to build that out.

So, we've never done it.

But I was reflecting on this with our business lead Andrew a month or two ago. If I was getting to a point where a Zach Gage game didn't need me auditing the code, what does that look like if we apply that same principle to a business project which I just can't find the time for?

To explore this premise, I recommended that Andrew take the time to build a working prototype in Claude using Claude Artifacts. Artifacts is a clever system which lets you make small apps which can be shared with others, but gives you the ability to build out a fully fleshed prototype of the app and be able to make something which can do LLM calls and have its own small database.

What is interesting here is that for this project Andrew is the product lead, and in the old style of engineering (where it would be passed on to a designer, and then a developer) his vision would absolutely be changed because of the process of shipping the actual thing. He's no dictator, but putting a project through enough hands will shift what it becomes.

You can argue that this can be a good thing, having that original vision be shifted by folks more informed in things like API design, user experience and having shipped more stuff could work out better. I'd argue that it's maybe a good time to just see what happens if you give away some of that control to someone ambitious.

So, he built a prototype and it was pretty good, it solved problems in ways that I just wouldn't - which is fine! After he presented it to a few business leads and we agreed the idea had legs, I took his prototype and then re-built it on our production infra (render.com) and gave it a real database etc.

This settled for a weekend or so as I helped Andrew be able to contribute to this 'real codebase', and we chatted about what the production version of this app could be for a while, and I wondered _'do we really want to have this as a weird external service?'_. So, I introduced a new concept to Workshop: Apps. (Using a plugin model, LOL! I can't be contained. Eleven blog posts and counting)

This change gave Andrew the ability to introduce a full business app which looks and feels completely like our native workshop pages (I handled all this) but is completely sandboxed from the rest of puzzmo.com - he can't vibe up something which takes down our API. Everything lives in a separate domain, on a separate server and uses JSON message sending via an iframe to communicate with Workshop. It's also in a completely separate repo. He has complete control over his domain, but no way to accidentally make mistakes which affect the rest of us (outside of breaking his app in workshop somehow)!

## Explorations in Crosswords

This is still speculative and I'm working on it ATM, but there is another ambitious person at Puzzmo who has some solid programming experience but doesn't use much in her day-to-day role as Crossword Editor at Puzzmo, Brooke. I've been pitching her lately that we're just not thinking big enough around what making a community Crossword looks like on Puzzmo.

The version of Workshop puzzle editing which we announced back at Crossword Con 2026 is too small of a version of the idea to sit comfortably with me. Especially in this era which broke the constraint of time to lines of code (or of complexity to maintainers?). So, I am excited about the idea of trying to figure out a way to make Crosswords with the experience of someone who worked on building editing tools for the largest programming language on GitHub mixed with someone who has an incredible taste in the art and culture of making Crosswords.

## Support Acts

Supporting projects like this means saying it's culturally OK to do something which feels a bit risky, but with a small high trust team, it's easy to find ways to put limits on the experiments (mine and Zach's first game built this way explicitly had a timeline for deprecation, but so did Ribbit (our second) and that became too popular! Ribbit really forced my hand.)

As a part of thinking about how to make it possible for players to put games on Puzzmo, sandboxing has been on my mind across a lot of our systems and so it's felt natural to make it possible for our internal 'teams' (of mostly single people) to be able to be sandboxed.

These projects are really what has lifted my spirits in a rough 2026, and have been part of what really makes it interesting to do the team parts of making software. It's cool that the other person doesn't always have to be someone that has really honed the skills of being a digital creative and I think that can give us a lot of new insight into what/how to build new stuff.
