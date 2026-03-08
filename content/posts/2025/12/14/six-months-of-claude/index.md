+++
title = '9 Months of Claude'
date = 2025-12-14T12:00:22Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

I try to commit to things. My relationship with the craft of programming is significantly more intense than most of people I have worked with in my career. This isn't a slight to others, a more diverse set of interests makes for more well-rounded people and there's a lot of things to do as a human in a lifetime! My commitment to the craft comes with a cost - I am extremely wary of adding dependents and taking on responsibilies which do not give me maximal time and space to further the work on my craft.

The reason for being dependant phobic is the effort takes time. Unbelievable amounts of time. Since I started to commit to programming as a craft about 13 years ago, I have programmed almost every day for somewhere between 8 to 10 hours. I have devoted tens of thousands of hours to understanding and contributing back to each ecosystem I've relied on: Ruby, iOS Native, Node, Browsers and Server Infra over that time. Those hours are based on one simple foundational concept which I grasped right at the beginning of my career: Every day I build on the work and knowledge of past me. So, any extra work I put in today gives me the chance to build upon this further tomorrow.

My last 9 months of using Claude Code has really shaken that foundations, because I think at heart, it allows for others to have access to the skills you can gain from that commitment, without putting in the time.

I find it both very exciting, and deeply epochal.

---

As this is the third in a series on using Claude Code: [first, 1 week](/posts/2025/06/07/orta-on-claude/), [second, 6 weeks](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/). You can opt to skip them, but I will briefly get you up to speed, feel free to jump the next few paragraphs till you hit a horizontal rule to continue.

I'm Orta, one of the co-founders of Puzzmo (where we make daily web games with interesting systems around them, think Wordle meets Fortnite.) prior to that I worked on the TypeScript compiler team at Microsoft doing an odd compiler bug/feature but mostly working on docs and web infra. I have the serious backlog of open source contributions.

I lead a team of engineers here at Puzzmo, who have a varied amount of willingness to use or experiment with LLMs for their daily programming. I have used GitHub Copilot since it was a wee baby only in Microsoft and have a world of respect to the team working on it - I debated working on that insead of founding Puzzmo!

I found Copilot underwhelming on the TypeScript compiler, but very effective at guessing the end of my sentence when working in the fledgling Puzzmo codebase. Then this year, I explored Cursor and found myself very impressed at Cursor's ability to [infer the rest of the paragraph](https://blog.puzzmo.com/posts/2025/06/07/orta-on-claude/#from-elegant-auto-complete-to-let-me-take-the-wheel).

Then Claude Code came out, and completely changed what it meant to be a programmer. I found myself being able to simultaneously ship features and architectural refactors at the same time by using multiple clones. Maintenance/refactors which typically took substantial amounts of time and resources became commonplace everyday PRs as I flew through ~1,100 pull requests to Puzzmo since I started using Claude.

The [list of changes](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#maintenance-is-significantly-cheaper) from the first 6 weeks is formidable for an actually fully staffed team of engineers.

Interestingly, I found it [very hard to quantify](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/#quantifying-the-change-is-hard) the change in a concrete metric like Pull Requests, commits or lines of code changed. I will re-explore this.

---

## LLMs as the "killer app" Of This Generation

I've seen _many_ technical fads come and go: 'ChatBots', 'Metaverse', 'Edutainment', 'Crypto', 'AR/VR', 'Uber for X', 'Apps' etc. I try to understand their underlying 'why is this happening now?' and 'what tech underpins this?' but I absolutely bet against all of them.

To me, there's not been many 'Killer Apps', ones which literally change how you interact with the world. Most recent prior 'Killer App' which really impressed me is the mix of GPS, Google Maps and the smartphone. That was some transformative tech. It's not to say there aren't other great bits of technology, but the idea that would could effectively never get lost planet-wide must have been unfathomable to previous generations.

I think LLMs, Reasoning Loops and Code is the next 'Killer App' - it's not reached accessibility for everyone yet but almost everyone I've met who has genuinely engaged with it comes out changed. When I consider:

- The complexity of actually understanding how a computer works, how far away people are starting to get from some of the most primitive abstractions like files and folders due to consolidation on apps which aim to replace understanding 

- The security theatre offered via app stores on Android and iOS, and the dance they force you to commit to put software on a device you own

Something derived from the lineage of Claude Code has the potential to fully undermine these systems and make computing far more accessible to individuals.

We used to need to print out instructions from Google Maps. Today to be effective with Claude Code you need the mind of a computer systems expert, but most people don't need that level of application. We found the shape of next the killer app.

## 9 Months of Claude Code

At the core, after 9 months of every day usage, thousands of conversations, I have come to view Claude Code as a tool. When I first started using it, Claude Code was truly magical, inconsistent and hard to grasp. Now I have a good mental model of when and how to use the tool in my head, and I feel like I'm pretty good at knowing when I'm over or under applying using an agent as the main way to make a change to a codebase.

The simile which might work for some folks is learning TypeScript and having a feel for when you should/shouldn't type something. It can be really tempting when you grasp the power of the type system to add type annotations everywhere, make incredibly complex generics to solve exact one-off problems and use rich but deeply nuanced typing toolkits to feel like you have an incredible coverage from TypeScript.

I'd argue that overuse in both cases is a phase you go through, and on the other side you start writing less types. (Except you "Doom in TypeScript" guy, never change.) You end up being more comfortable not passing in the whole type for a function but just the parts it needs, using type drilling syntax (`Type["field"]`) to avoid duplications, groking systems that affect the flow graph for a type and instead of _more_ you find that _less_ ends up being a great spot for flexibility but with enough coverage that you feel comfy.

I am at the comfy stage of Claude Code usage. I would say that I rarely write entire features by hand now, and when I don't have internet access I effectively only write the notes for what an upcoming project should be e.g. doing spec work instead which is a far cry from the last decade of 'offline means I can concentrate on writing code.'

There's no denying this is a big change, and it does come with trade-offs. I'd like to imagine in a year or so, I'd be at a point where. I could consider using a local model for some of my work, but as long as it's being subsidized so hard, I intend to take advantage of that.

### On Models and Agents

I have still not tried anything other than Claude Code as an agent, for anything other than simple 'Claude is down, lets try _x_.' In part, because it is an effective tool and the rate of change for just this one single application is very high. You get new features at a daily/weekly basis, and trying to keep up with the community of hackers making systems around Claude Code.

The models themselves come and go, I don't really think much about them. I think there's been a few Opus/Sonnet upgrades in the last 9 months and I'd say those are good times to reset my expectations on what lengths I am willing to make the leash for Claude. Often I would explore a fresh side-project or try see what a one-shot of a complex app/feature looks like and see if I need to update my priors.

I don't worry about them though, I know its easy to to be super excited for these updates and read a bunch of interesting graphs and comparisons but I try to ground myself with this: a year and a half ago this wasn't really possible and we are incredibly lucky to have tools of this calibre. Fretting over increments  between Claude/GPT/Gemini/etc is like arguing over centimeters when we're collectively traveled meters. Fun, but pedantic.

### Ease of Change

Once I had started to settle in, I started to really feel like for the first few months I was just excited to be using Claude Code at all. I took almost every long running bug, architecture redesign idea and small feature and just did it on a whim in meetings or

Now the easy stuff is all done, (which was _years of backlog_ done in weeks!), I've been trying to reflect on how easy Claude Code has made systemic changes to our codebase. It's not trivial like the beginning, where you could just eyeball the changes and be certain everything is correct off the ball.

### What a Feature Looks Like

Today, I bucket the work based on a guess for its relative size. If I think I'll be thinking about it for an hour or two, then I'll start in a plan mode where I work back and forth on a single markdown document for a while. I'm trying to anticipate all of the upcoming peculiarities of what we're trying to mkae 

### An Over-reliance?

I find myself musing over a lot of architectural maybes in my day to da

### Toxic Thoughts

In a true Lord of The Rings style 'power corrupts' I think being such an active user of a tool like Claude Code starts to affect how you interact with others. Again, think of this as like when you're an adopter of any technology and you want to try persuade others of its value _'this crash which took down the site wouldn't have happened if we had strict mode enabled'_ - except now it is literally everything in your day-to-day work: _"What did Claude say about how to do an analytics db?"_, _"Yeah, agree Prisma has a weird model for bi-directional relationships, but I just get Claude to write my SQL now"_, _"Just ask Claude to write your JS Docs and focus on making a good README"_, _"this is just an admin tool, a modal with more info is only a few extra minutes to add"_, _"You've never set up postgres? Claude can walk you through it"_, _"@claude add JSDocs to this PR"_ etc, etc.

I find myself perceive the folks who are not adopting these types of tools differently. A recent example is that I have never been great at estimating how long other folks can perform tasks, so I usually make a relative tally and keep a multiplier in my head for how long it would take relative to myself. For the longest time, I've been trying to resist updating my own time estimations to include my Claude Code usage because that means either updating the multipliers for them too to the point where it starts to feel a bit silly.

They've not changed, but it feels like they are on a casual stroll when you are running and watching them get smaller in the distance behind.

### Owning the Stack

I've never found software to be more malleable than this last 6 months. Here's some examples of things which were just straight up not possible, but are now mundane to me.

- I have re-implemented a significant number of applications into the native UI toolkit of my (obscure Linux) OS. I use very few Electron apps now because I just start a native re-write on a weekend, then keep the clone around while I fine tune over the course of the week.

  We're talking re-implementing a SoundCloud player, the Signal Messenger client, dumb desktop toys I enjoyed in my youth.

- Other peoples software which previously relied on "security by obscurity" is absolutely an open book now. I've built non-trivial decryption algorithms, extracted full API client specs from de-compiling Android apks, collected HARs from web UIs to re-implement clients against private APIs - unless you are 100% server side rendering, the ability for Claude to be tasked to 'figure out how this works and make me a JavaScript implementation' is further than my own personal capabilities.