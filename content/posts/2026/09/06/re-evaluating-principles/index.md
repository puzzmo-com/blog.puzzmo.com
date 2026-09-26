+++
title = 'On realizing I need to evaluate my principles in a post-LLM world'
date = 2026-09-06T09:45:54-04:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

A link I have relied on for the last 8 years broke:

<https://github.com/artsy/README/blob/main/culture/engineering-principles.md>

The link was a markdown document in Artsy's shared open-source documentation repo, it was the result of a few introspective sessions by the Artsy dev team maybe a decade ago where we settled on a series of principles that describe our general approach to software. I used the link in blog posts, hiring notices and in private chats a bunch.

Here's [the fixed link btw](https://github.com/artsy/README/blob/e4b7dff3209b43f4ab63bad919f2500972aade1b/culture/engineering-principles.md) because it's a git repo. I think the removal of the engineering principles isn't some ominous mark against the current day Artsy dev team, but I wonder if they just spotted a cultural change before I noticed it.

Since then I've been wondering just how sturdy those values, and my own are in the face of a [dancing landscape](https://www.youtube.com/watch?v=doqeXBoFiGU).

I've been finding myself re-evaluating a lot of my core principles lately:

_Open Source by Default_: Aside from Puzzmo's [xd language tools](https://github.com/puzzmo-com/xd-crossword-tools) project, a lot of my open source at Puzzmo has been closer to source-available instead of a fully committed open source project. For some projects I opted out of making packaging easy on npm, and the rest live in our [OSS repo](https://github.com/puzzmo-com/oss) for people to read and reference - but not really contribute. I built my career on this tenet, and yet, through a mix of the time constraint of having to run a company, feeling less like we have something to share and feeling less invested in the process of sharing code. I just do it less.

_If someone I trust asks to take a software project from me, I should give it away_: From my Artsy era, when I started to really understand that a [focus on breadth of contribution](https://artsy.github.io/blog/2018/08/10/On-Context-Switching/) was something I could really work on. The downside of this was that I left a lot of systems in my wake! I got good at shipping small fixes to done software to keep it afloat. These projects which didn't quite need active maintenance are perfect for people to use for growing and understanding new systems and getting a better world model of the company. So, I made a principle of _'always give it away'_ - there will always be more things to do! Post-LLMs I found myself examining this as the barrier to entry of complex work has been lowered code-wise but the rigor of integrating with existing production software and the cultural work of getting people aligned on the plan still stayed at the same place. I feel like I am less inclined to give away key systems now.

_Offline is the best place to do your work_: I used to get [so much done](https://artsy.github.io/blog/2015/09/30/Work-Offline-More/) on a bus, train or plane. Now I will write some prompts for when I get back and will even occasionally buy WIFI on planes. Unprecedented.

_Own your Dependencies_: I used to read and audit all code which came into the codebases I owned. Here's me talking about that [process for the Artsy blog](https://artsy.github.io/blog/2019/01/30/why-we-run-our-blog/). At Puzzmo for the first ~4.5 years, I read every incoming line of code across all non-game systems. I still read the code for all our dependencies, figure out the authors behind them and maintain relationships with them when it makes sense. Their code is my code, it is running in our application after all! LLMs have changed this. It's now possible for non-engineers to be able to contribute code, and they do not have the ability to audit/understand it. If this principle was being fully kept-to, you can't just have folks shipping non-trivial projects without some kind of engineering oversight?

Well, kinda, you can? A lot of my work this year has been building guardrails, figuring out how to allow for systemic sandboxing and finding ways for people to contribute untrustworthy code is a hard and interesting problem. It's allowed game designers to ship full Puzzmo-quality games and business folk to build complex relationship tools. It used to be that you would build some kind of engine for them, but now with some engineering creativity and some constraints you can start letting people make dependencies where no-one actually reads the code.

But, what made me really reflect is that I don't think so much about writing up my work anymore.

For the last decade, I've considered _'it ain't finished till there's a write-up'_ as one of my core principles. Over the last decade I've averaged about one a month. A write-up is both a way to put a flag on some hard work, give credit to folks who also contributed and it turns into a big cool web of interlinked history.

## What gives?

I don't have a single answer, but writing about the problem seems as good a reason as any to try and dig into it. Here's a few of my guesses:

1. I think it's harder to have a single _'it's done'_ moment. Software just feels so much more malleable and often it's conceptually cheap to tweak on something for longer.

2. Managing multiple streams of work is much easier, and any actual wins are just notes on a chord now. Why write up about my techniques for sandboxing thumbnails on Puzzmo when I'm still half-way through reducing the time an opengraph image renders.

3. I knew 2026 was going to be a meh year (a mix of Puzzmo legal faff, some unlucky decisions and life stuff), so I dropped a lot of the engineering bureaucratic work to give myself some space. It's likely this has eaten into the time that I would have given to write-ups, given that a write-up is high on the Maslow's hierarchy of engineering needs.

4. How much of the work am _I_ doing? I give pretty specific instructions, read all the code for Puzzmo systems and am very present in reviewing the output of an LLM but every line of code used to be a journey and now it's a transaction.

   Is the write-up journey of making the thing less interesting to make because the journey featured less of an arc? A lot of my larger posts are on the 'well we tried x, and eventually got to y' but if the A -> B is so easy; that's less of a worthy pitch.

5. If I'm writing to explain a problem, does my version of the write-up add that much for the rest of the world or the team?

   I've found it's better to assume workmates haven't read these blog posts, and I'm finding there's little point in documentation for our codebases because pairing with an LLM is such a stronger way to get the outline of a system than me extensively writing about it. Then you can talk to a human.

6. I use a write-up to sort things out in my head. Now I have a permanent and always attentive oracle for asking questions about my decisions to. It often knows more than me on a topic, and most likely has a breadth of examples from people who have solved similar issues before me. So, like, is my answer going to end up as more of a remix?

The write-ups are often about the human parts of it all and it's not like I've been working on uninteresting things. In 2026 I've shipped 800+ PRs, gotta be a bunch of things worth writing about there! Yet there are really only three blog posts for the year (on Claude Code and Bluesky).

Though I do appreciate the irony in making a post about not posting!

## So, what now?

It has historically been easier to point at Artsy's as a great example of what a _team's_ principles were and I try to operate engineering teams under those principles.

So, it's probably time to re-examine my principles under the new constraints - I don't even know if I could make a set of engineering principles for Puzzmo in this era.

