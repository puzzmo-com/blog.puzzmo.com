+++
title = 'Re-evaluating core craft values in a post-LLM world'
date = 2026-09-06T09:45:54-04:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

A link I have relied on for the last 8 years broke:

<https://github.com/artsy/README/blob/main/culture/engineering-principles.md>

The link was a markdown document in Artsy's shared open-source documentation repo, it was the result of a few introspective sessions by the Artsy dev team maybe a decade ago where we settled on a series of principles that describe our general approach to software. I used the link in blog posts, hiring notice and in private chats a bunch.

Here's [the fixed link btw](https://github.com/artsy/README/blob/e4b7dff3209b43f4ab63bad919f2500972aade1b/culture/engineering-principles.md) because it's a git repo. The I think the removal of the engineering principles isn't some ominous mark against the current day Artsy dev team, but I wonder if they just spotted a cultural change before I noticed it.

I've been wondering just how sturdy those values are in the face of a dancing landscape.

Aside from our [xd language tools](https://github.com/puzzmo-com/xd-crossword-tools) project, a lot of my open source at Puzzmo has been closer to source-available instead of a fully committed open source project. For some projects I opted out of making packaging easy on npm, and the rest live in our [OSS repo](https://github.com/puzzmo-com/oss) for people to read and reference - but not really contribute. This is not _open source by default_, a tenet of my last decade.

From my Artsy era, I had a principle of _'if someone I trust asks to take a software project from me, I should give it away'_. Post-LLMs I found myself examining this as the barrier to entry of complex work has been lowered but the rigor of integrating with existing production software and the cultural work of alignment still stayed at the same place and the principle gave me the wrong answer.

But, what made me really reflect is that I don't think so much about writing up my work anymore.

For the last decade, I've considered _'it ain't finished till there's a write-up'_ as one of my core principles values. Over the last decade I've averaged about one a month. A write-up is both a way to put a flag on some hard work, give credit to folks who also contributed and it turns into a big cool web of interlinked history.

## What gives?

I don't have a single answer, but writing about the problem seems as good a reason as any to try and dig into it. Here's a few of my guesses:

1. I think it's harder to have a single _'it's done'_ moment. Software just feels so much more malleable and often it's conceptually cheap to tweak on something for longer.

2. Managing multiple streams of work is much easier, and any actual wins are just notes on a chord now. Why write up about my techniques for sandboxing thumbnails on Puzzmo when I'm still half-way though reducing the time an opengraph image renders.

3. I knew 2026 was going to be a meh year (a mix of Puzzmo legal faff, some unlucky decisions and life stuff), so I dropped a lot of the engineering beaurocratic work to give myself some space. It's likely this has eaten into the time that I would have given to write-ups, given that a write-up is high on the maslow's heirarchy of engineering needs.

4. How much of the work am _I_ doing? I give pretty specific instructions, read all the code for Puzzmo systems and am very present in reviewing the output of an LLM but every line of code used to be a journey and now it's a transaction.

   Is the write-up journey of making the thing less interesting to make because the journey featured less of an arc? A lot of my larger posts are on the 'well we tried x, and eventually got to y' but if the A -> B is so easy; that's less of a worthy pitch.

5. If I'm writing to explain a problem, does my version of the write-up add that much for the rest of the world or the team?

   I've found it's better to assume workmates haven't read these blog posts, and I've finding there's little point in documentation for our codebases because pairing with an LLM is such a stronger way to get the outline of a system than me extensively writing about it. Then you can talk to a human.

6. I use a write-up to sort things out in my head. Now I have a permanent and always attentive oracle for asking questions about my decisions to. It often knows more than me on a topic, and most likely has a breadth of examples from people who have solved similar issues before me. So, like, is my answer going to end up as more of a remix?

The write-ups are often about the human parts of it all and it's not like I've been working on uninteresting things. In 2026 I've shipped 800+ PRs, gotta be a bunch of things worth writing about there! Yet there are really only three blog posts for the year (on Claude Code and Bluesky).

## So, what now?

Maybe it's time to re-examine my principles under the new constraints - unlike for Artsy, I never tried to write my own down.

It has historically been easier to point at Artsy's as a great example of what a _team's_ principles were and that I tried to operate teams under those principles.

Then potentially stay tuned for another post in the vein of working through what my principles could be in this new era.
