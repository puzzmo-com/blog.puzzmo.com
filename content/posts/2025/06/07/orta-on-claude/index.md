+++
title = 'On Coding with LLMs'
date = 2025-06-07T06:26:14+01:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Alright, that's a very straight faced title. Might force more folks to read the contents.

When I was planning on leaving working on [TypeScript](https://www.typescriptlang.org), I looked around for a few interesting places to work in Microsoft/GitHub instead of founding [Puzzmo with Zach](https://www.theverge.com/23929222/puzzmo-newspaper-games-crossword-zach-gage). One of the teams I had interacted with a bit was the GitHub Copilot team, they had just finished up [LiveShare](https://visualstudio.microsoft.com/services/live-share/) and were really starting to see some interesting results in the auto-complete space. I had been doing bits of TypeScript compiler work at the time, and used Copilot a bit with that work and found it struggled with the codebase but could do a pretty reasonable job when working on the website.

So, I always have felt some affinity to GitHub Copilot, and it's been a great tool for finishing the line of code you are currently writing. A real [incremental revolution](https://github.com/artsy/README/blob/main/culture/engineering-principles.md#incremental-revolution) on the auto-complete. This I think has been a really safe domain for starting off with LLMs, it's well scoped (nearly always right after your cursor), easy to understand (its just greyed out text right where your eyes are) and feels un-intrusive and predictable.

Over the last three months, I have been trying to really push myself out of that comfort zone and to start exploring the tools that you see the 'vibe coding' folks are using and get a sense for what these systems are like when you are someone who takes this stuff very seriously, and considers programming + systemic design to be the only craft I want to do for the rest of my life.

That said, allow me to self flagellate before we dig in. I don't think LLMs are a good thing for the world. I think they concentrate power to those with capital, I think they will "increase throughput" for folks in ways that will give fewer people jobs and will force higher inter-class competition in culturally unhealthy ways like a concentrated version of the gig economy. If you want to see the epitome of "[worst person you know](https://knowyourmeme.com/memes/worst-person-you-know-made-a-great-point)" meme, Tucker Carlson's point about [what the social cost of driverless trucking looks like](https://www.youtube.com/watch?v=o5zPKxpPHFk) (0m-3m, perhaps open in a private browser to poisoning your algorithms) is something which is always in the back of my mind. I think LLMs are assisting to push the [Overton window](https://en.wikipedia.org/wiki/Overton_window) towards authoritainism by making it easier to spread disinformation, to create false narratives and to remove autonomy in favour of algorithms. Some of this stuff could be OK if we had widescale social safety nets and a healthy labour class, but I don't think something like [UBI](https://en.wikipedia.org/wiki/Universal_basic_income) is coming, and I think LLMs are going to continue to push economic growth over [planet-wide](https://www.youtube.com/watch?v=Mf1FbRaf5gY) health. This technology will help contribute to a worse world for most people.

Yet still, LLMs are here. They've already come for artists, and voice actors. Now they are here for programmers. I can't stop that. A lot of my private slacks now have a space where people are using these tools but would not talk about it publicly. I'm going to lose some internet points and try talk through my usage.

--

So, a few months ago I decided to buckle in and see what it looks like to be writing code of the same quality which I have been writing and to allow LLMs to creep a bit further into my workflows. **TLDR: Sometimes it feels like magic, but nowadays with [Claude Code](https://www.anthropic.com/claude-code), it feels like pairing with someone a bit less experienced who just needs the occasional nudge**. Then like with pairing, it's review, refactor and test time.

To understand my programming environment, I am mostly always working in and around puzzmo.com - a puzzle game website, which is almost exclusively written in TypeScript and uses very mainstream technology choices which me and some friends [decided on](https://www.youtube.com/watch?v=1Z3loALSVQM&t=481s&pp=0gcJCcYCDuyUWbzu) a [decade](https://github.com/artsy/mobile/issues/22#issuecomment-91199506) ago.

## From elegant auto-complete to 'let me take the wheel'

I've gone through two epoch moments with these tools, the first was [adopting Cursor as my text editor](https://www.cursor.com). I'm [9 years](https://artsy.github.io/blog/2016/08/15/vscode/) into using VS Code daily, I have made loads of extensions, maintained a fork for a while, understand the codebase, know a lot of the team personally and really think the way it thinks. So, a new editor needs to really do something interesting. Here's what I thought of it two days in.

{{< imageHighlight src="cursor.png" alt="Yesterday's change graph showing a wild set of curves being flattened" class="slack-inline-image" >}}

And I gave a few videos of the examples:

{{< video src="cursor-rename.mov" >}}

{{< video src="cursor-questions.mov" >}}

The key difference I found with Cursor is this idea that we're not going to "just do auto-complete" which was Copilot's approach at the time. Cursor is going to use your cursor as a starting point and start making changes which are outside of your current scope. This took a while to get used to.

I found that this format of tooling has the tools lead you rather than the other way around. For example, this video I gave the smallest change (switching a `<div` to an `<li`) and the LLM starts to take the wheel:

{{< video src="cursor-edits.mov" >}}

## MCPs

## Agentic Pair Programming
