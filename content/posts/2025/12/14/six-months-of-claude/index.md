+++
title = '6 Months of Claude'
date = 2025-12-14T12:00:22Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

I try to commit to things. My relationship with the craft of programming is significantly more intense than most of people I have worked with in my career. I don't say this to slight others, a more diverse set of interests makes for more well-rounded people and there's a lot of things to do as a human in a lifetime! That commitment to the craft comes with a cost - I am extremely wary of adding dependents and taking on responsibilies which do not give me maximal time and space to further the work on my craft.

The reason for being dependant phobic is the effort takes time. Unbelievable amounts of time. Since I started to commit to programming as a craft about 13 years ago, I have programmed almost every day for somewhere between 8 to 10 hours. I have devoted tens of thousands of hours to understanding and contributing back to each ecosystem like Ruby, iOS Native, Node, Browsers and Platform Infra over that time. Those hours are based on one simple foundational concept which I grasped at the beginning of my career: Every day I build on the work and knowledge of past me - so any extra work I put in today gives me the chance to build upon this further tomorrow.

My last 6 months of using Claude Code has really shaken my foundations, because I think at heart, it allows for others to have access to the skills you can gain from that commitment, without putting in the time beforehand.

I find it both very exciting, and deeply epochal.

---

As this is the third in a series on using Claude Code: [first, 1 week](/posts/2025/06/07/orta-on-claude/), [second, 6 weeks](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/). You can opt to skip them, but I will briefly get you up to speed, feel free to jump the next few paragraphs till you hit a horizontal rule to continue.

I'm Orta, one of the co-founders of Puzzmo (where we make daily web games with interesting systems around them, think Wordle meets Fortnite.) prior to that I worked on the TypeScript compiler team at Microsoft doing an odd compiler bug/feature but mostly working on docs and web infra. I have a pretty serious backlog of open source contributions.

I lead a team of engineers here at Puzzmo, who have a varied amount of willingness to use or experiment with LLMs for their daily programming. I have used GitHub Copilot since it was a wee baby only in Microsoft and have a world of respect to the team working on it - I debated working on that insead of founding Puzzmo!

I found Copilot underwhelming on the TypeScript compiler, but very effective at guessing the end of my sentence when working in the fledgling Puzzmo codebase. Then this year, I explored Cursor and found myself very impressed at Cursor's ability to [infer the rest of the paragraph](https://blog.puzzmo.com/posts/2025/06/07/orta-on-claude/#from-elegant-auto-complete-to-let-me-take-the-wheel).

Then Claude Code came out, and completely changed what it meant to be a programmer. I found myself being able to simultainously ship features and architectual refactors at the same time by using multiple clones. Maintainance wins which typically took substantial amounts of time and resources became commonplace everyday PRs as I flew through ~1,100 pull requests to Puzzmo since I started using Claude.

The [list of changes](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#maintenance-is-significantly-cheaper) from the first 6 weeks is formiddable.

Interestingly, I found it [very hard to quantify](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#quantifying-the-change-is-hard) the change in a concrete metric like Pull Requests, commits or lines of code changed. I will re-explore this.

---

## 6 Months of Claude Code

At the core, after 6 months of every day usage, thousands of conversations, I have come to view Claude Code as a tool. When I first started using it, Claude Code was truly magical, inconsistent and hard to grasp. Now I have a good model of when and how to use the tool in my head, and I feel like I'm pretty good at knowing when I'm over or under applying using it as the main way to make a change to a codebase.

The simile which might work for some folks is learning TypeScript and having a feel for when you should/shouldn't type something. It can be really tempting when you grasp the power of the type system to add type annotations everywhere, make incredibly complex generics to solve exact one-off problems and use rich but deeply nuanced typing toolkits to feel like you have an incredible coverage from TypeScript.

I'd argue that this is a phase you go through, and on the other side you start writing less types. (Except you Doom in TypeScript guy, never change.) You end up being more comfortable not passing in the whole type for a function but just the parts it needs, using type drilling syntax to avoid duplications, groking systems that affect the flow graph for a type and instead of _more_ you find that _less_ ends up being a great spot for flexibility but with enough coverage that you feel comfy.

I am at the comfy stage of Claude Code usage.

### Ease of Change

Once I had started to settle in, I started to really feel like for the first few months I was just excited to be using Claude Code at all. I took almost every long running bug, architecture redesign idea and small feature and just did it on a whim.

Now the easy stuff is all done, (which was years of backlog done in weeks!), I've been trying to reflect on how easy Claude Code has made systemic changes to our codebase. It's not trivial like the beginning, where you could just eyeball the changes and be certain everything is correct off the ball.

### What a Feature Looks Like

I would start work with a relative

### An Over-reliance?

I find myself musing over a lot of architectural

### Toxic Thoughts

In a true Lord of The Rings style 'power corrupts' I think being such an active user of a tool like Claude Code starts to affect how you interact with others. Again, think of this as like when you're an adopter of any technology and you want to try persuade others of its value _'this crash which took down the site wouldn't have happened if we had strict mode enabled'_ - except now it is literally everything in your day-to-day work: _"What did Claude say about how to do an analytics db?"_, _"Yeah, agree Prisma has a weird model for bi-directional relationships, but I just get Claude to write my SQL now"_, _"Just ask Claude to write your JS Docs and focus on making a good README"_, _"this is just an admin tool, a modal with more info is only a few extra minutes to add"_, _"You've never set up postgres? Claude can walk you through it"_, _"@claude add JSDocs to this PR"_ etc, etc.

I find myself perceive the folks who are not adopting these types of tools differently. A recent example is that I have never been great at estimating how long other folks can perform tasks, so I usually make a relative tally and keep a multiplier in my head for how long it would take relative to myself. For the longest time, I've been trying to resist updating my own estimations to include my Claude Code usage because that means either updating the multipliers for them too to the point where it starts to feel a bit silly. My current tactic to side-step this has been to let them provide estimations instead of doing it myself.

They've not changed, but it feels like they are on a casual stroll when you are running and watching them get smaller in the distance behind.
