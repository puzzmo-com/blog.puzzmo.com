+++
title = 'On Coding with Claude'
date = 2025-06-07T06:26:14+01:00
authors = ["orta"]
tags = ["tech", "programming", "autocomplete", "culture"]
theme = "outlook-hayesy-beta"
+++

Alright, that's a very straight faced title. Might force more folks to read the contents.

When I was planning on leaving working on [TypeScript](https://www.typescriptlang.org) full-time, I looked around for a few interesting places to work in Microsoft/GitHub instead of founding [Puzzmo with Zach](https://www.theverge.com/23929222/puzzmo-newspaper-games-crossword-zach-gage). One of the teams I had interacted with a bit during my time at Microsoft was the GitHub Copilot team, they had just finished up [LiveShare](https://visualstudio.microsoft.com/services/live-share/) and were really starting to see some interesting results in the auto-complete space. I had been doing bits of TypeScript compiler work at the time, and used Copilot lightly with that work but found it struggled with the compiler codebase (it's weird) but could do a pretty reasonable job when working on the website (a React app).

So, I always have felt some affinity to GitHub Copilot, and it's been a great tool for finishing the line of code you are currently writing. A real [incremental revolution](https://github.com/artsy/README/blob/main/culture/engineering-principles.md#incremental-revolution) on the auto-complete. This I think has been a really safe domain for starting off with LLMs, it's well scoped (nearly always right after your cursor), easy to understand (its just greyed out text right where your eyes are) and feels un-intrusive and predictable. I've been using it every day

Over the last three months, I have been trying to really push myself out of that comfort zone and to start exploring the tools that you see the 'vibe coding' folks are using and get a sense for what these systems are like when you are someone who takes this stuff very seriously, and considers programming + systemic design to be the craft I plan to do for the rest of my life.

That said, allow me to self flagellate before we dig in. I don't think LLMs are a good thing for the world. I think they concentrate power to those with capital, I think they will "increase throughput" for folks in ways that will give fewer people jobs and will force higher inter-class competition in culturally unhealthy ways like a concentrated version of the gig economy. If you want to see the epitome of "[worst person you know](https://knowyourmeme.com/memes/worst-person-you-know-made-a-great-point)" meme, Tucker Carlson's point about [what the social cost of driverless trucking looks like](https://www.youtube.com/watch?v=o5zPKxpPHFk) (0m-3m, perhaps open in a private browser to avoid poisoning your algorithms) is something which is always in the back of my mind. I believe in the [dead internet](https://www.cnet.com/home/internet/what-is-the-dead-internet-theory/) theory and think that using LLMs to make slop which looks like it was authored by a human is unethical. I think LLMs are assisting to push the [Overton window](https://en.wikipedia.org/wiki/Overton_window) towards authoritarianism by making it easier to spread disinformation, to create false narratives and to remove decision-making autonomy in favour of algorithms. Some of this stuff could be OK if we had widescale social safety nets and a healthy labour class, but I don't think something like [UBI](https://en.wikipedia.org/wiki/Universal_basic_income) is coming, and I think LLMs are going to continue to push economic growth over [planet-wide](https://www.youtube.com/watch?v=Mf1FbRaf5gY) health. This technology will help contribute to a worse world for most people.

{{< details summary="Connections between Crypto and 'AI' technologists" >}}

After a recent re-read + [podcast review](https://doofmedia.com/kingslingers-season-1) of Stephen Kings magnum opus [The Dark Tower](<https://en.wikipedia.org/wiki/The_Dark_Tower_(series)>) series during the "crypto wave" of 2022-2023. I was really hit with the notion that there are a massive set of technologists who will happily work on something they know is a net negative on the world in order to personally benefit.

In the Dark Tower, there is a prison where telepaths collectively work together to undermine the systems which hold reality together. The prison was a perfectly idyllic space for "getting stuff done" and didn't feel like a prison at all. They loved to use their telepathy, and it felt good to use their skills: ["To break is divine."](https://darktower.fandom.com/wiki/Breakers) As they worked to end everything faster.

Anyone who made the choice to get into Crypto as an experienced western`*` engineer in that era knew what they were supporting: a system built for unaccountability, using unbelievable amounts of energy for little to no gains over conventional technology choices. Making the world worse for everybody on the hopes that because you got in earlier you were more likely to gain in a relatively zero-sum game. They are like real-world breakers.

`*` _I respect that there are folks outside of mainstream internet countries where getting paid is hard, and Crypto can provide a useful out._

I'm not sure if I think will the same of the folks who have switched to become "prompt engineers" or work on large scale LLM projects. Unlike Crypto, there is something of _real value_ in LLMs, I just don't know if the entire space is worth the social/human costs that we will collectively pay.

{{< /details >}}

Yet still, LLMs are here. They've already come for artists, and voice actors. Now they are here for programmers. I can't stop that. I dig that for some people absolute embargo is the only option, but I want to understand what they are and they are going to affect culture. A lot of my private slacks now have an opt-in space where people are using these tools but no-one would talk about it publicly. I'm going to lose some internet points and try talk through my usage and experiences.

--

So, a few months ago I decided to buckle in and see what it looks like to be writing code of the same quality which I have been writing and to allow LLMs to creep a bit further into my workflows. **TLDR: There is something real in this space. Occasionally it feels like magic, but nowadays with [Claude Code](https://www.anthropic.com/claude-code), it feels like pairing with someone with a few years under their belt who just needs the occasional nudge**. Then like with pairing, it's review, refactor and test time because it's still your name on the git commit.

For folks who do not know my programming environments, I am mostly always working in and around puzzmo.com - a puzzle game website, which is almost exclusively written in TypeScript and uses very mainstream technology choices which me and some friends [decided on](https://www.youtube.com/watch?v=1Z3loALSVQM&t=481s&pp=0gcJCcYCDuyUWbzu) a [decade](https://github.com/artsy/mobile/issues/22#issuecomment-91199506) ago. React, Relay and GraphQL. I write code expecting to be maintaining it for ~5 years, I try to write tests when its easy but prefer _"easy to change"_ over _"is a perfect abstraction."_

## From elegant auto-complete to 'let me take the wheel'

I've gone through two epoch moments with these tools, the first was [adopting Cursor as my text editor](https://www.cursor.com). I'm [9 years](https://artsy.github.io/blog/2016/08/15/vscode/) into using VS Code daily, I have made loads of extensions, maintained a fork for a while, understand the codebase, know a lot of the team personally and really think the way it thinks. So, a new editor needs to really do something interesting. Here's what I thought of it two days in.

{{< imageHighlight src="cursor.png" alt="Yesterday's change graph showing a wild set of curves being flattened" class="slack-inline-image" >}}

And I gave a few videos of the examples:

{{< video src="cursor-rename.mov" >}}

{{< video src="cursor-questions.mov" >}}

The key difference I found with Cursor is this idea that we're not going to "just do auto-complete" which was Copilot's approach at the time. Cursor is going to use your cursor as a starting point and start making changes which are outside of your current scope. This took a while to get used to.

I found that this format of tooling has the tools lead you rather than the other way around. For example, this video during that period I gave the smallest change (switching a `<div` to an `<li`) and the LLM starts to take the wheel:

{{< video src="cursor-edits.mov" >}}

I think of this approach as trying to infer your intent, and then using the locally available source code to figure out the rest of the pattern. I can get that for some, this is where the LLM integrations crosses into "who is writing this code?" territory, but I'm not convinced that is where the line is.

Over the two months I used Cursor, this was my main experience using an LLM for writing software. You would start to write what you were planning on writing, then, most of the time, the LLM would recognise the pattern you were following within the codebase and make the change within the file you were editing.

Often this made me feel like I had more mental space for refactoring. I could copy some code, write a very simple outline-y function to put it in and then have the LLM hook up the correct imports/function args in order to make that work as a new scope. Then when writing tests, assuming you were adding to an existing file, once you had written the description of the test then it was very likely that you had a pretty rough approximation of what you were going to test added ahead of time. If it was a new test suite, then you're kinda back to writing a few tests to get started.

Still very hands on, but kinda occasionally hands off.

## Agents "aka tell the LLM what to do"

Cursor was the first place I explored using the "Chat" style functionality with LLMs. I think of this as being closer to a "multi-file request" to the LLM. I found a few easy wins in this space asking for things like "convert these inline styles to use library [x]" for example as we were migrating to use [stylex](https://stylexjs.com/) during the [re-design project](/posts/2025/02/06/redesign/) which just shipped.

These types of changes typically took 10-30 seconds and were pretty localized in their scope. Cursor could use the editor's IDE integrations like TypeScript, oxlint, prettier to double check on the change to make sure it linted correctly and you can provide a screenshot as a part of the text input.

This would provide a pretty solid basis for the first pass of a idea, which you would then take over and bring to completion. To get this system working well, you need to put in some ahead of time effort. There was a few easy wins from my side:

- Using [Cursor Rules](https://docs.cursor.com/context/rules) files to pre-fill the chat with context of your codebase ahead of time. This ranges from some styling recommendations, to opinions on how to use frameworks correctly or what parts of the codebase require a bit of thinking about ahead of time. You can define these rules against file regexes. I'll put ones I use on puzzmo.com's monorepo below.

  {{< details summary="Puzzmo Monorepo Cursor Rules" >}}

  Just mainly collecting the things I gripe about when trying to keep the codebase consistent.

  ```md
  ---
  description:
  globs: apps/puzzmo.com/src/**.ts,apps/puzzmo.com/src/**.tsx
  alwaysApply: false
  ---

  The project in `apps/puzzmo.com` uses React, Relay, TypeScript and stylex. We are avoiding using React Native in this codebase, which you will still find in some places.

  You can find a lot of user interface components in [primitives.tsx](mdc:apps/puzzmo.com/src/palette/primitives.tsx) [tokens.stylex.ts](mdc:apps/puzzmo.com/src/palette/tokens.stylex.ts)

  ## General Formatting Rules

  - Always end variables with a capital ID when available (e.g. `userID` not `userId` )
  - Use `const` functions for react components
  - Use a separately declared props type
  - Keep stylex declarations at the end of the file, use `s` for the name of the declaration
  - For function arguments, prefer inline params, if you have more than 3 arguments add a `config` param which is an object with keys for less critical variables
  - Never use all-caps variable names
  ```

  {{< /details >}}

- Not treating the chat like an annoyance. This one took me a while to adapt to. Because I want to write something like "convert these inline styles to use stylex" but that's really not that much context to go on. If you were talking to a human, you'd at least try offer some advice or y'know point at the screen or something. I think typing is real the pain here, oddly enough for this case I'd like to be using a voice input. So I expect sometime in the next month I will explore hooking up my OS' speech-to-text system to the LLM I am working with.

- Asking it to write or extend a set of tests with a goal in mind

## Vibe Coding With No Expectations On Quality

I asked myself, _"what does it mean to not care about the code I am creating?"_ as that seems to largely be the wave that folks doing _"vibe coding"_ are surfing. So, I needed a project which was never going to be production-worthy. I wanted to make a menu-bar application which tracked active deploys to render.com (for our servers) and vercel.com (for the puzzmo.com front-end.)

{{< imageHighlight src="vibe.png" alt="Yesterday's change graph showing a wild set of curves being flattened" class="slack-inline-image" >}}

I have been using a Mac while building the iOS App for Puzzmo, but I've been looking forwards to getting myself back to main Linux box and so I wanted this menu-bar app to be cross-platform. I've got very little experience in rust, but I thought it might be cool to build it in [Tauri](https://tauri.app). No slight to Tauri, but I think the amount of training code and infrastructure for the LLM was not there yet. I couldn't successfully get a build _by just chatting_ which had a menu item I could control based on a few API calls.

I could have settled in and started learning the ecosystem and environment, but that was not the point. That would be just how I roll. Instead, I opted to add ~150mb of node and google chrome by moving to Electron.

I restarted the project, and re-wrote in Electron and it took two evenings. I told it what npm modules to use, and we back and forth'd figuring out a few edge cases during implementation. Making a release build was definitely a struggle, but after a few runs and a bit of elbow work on my part (it was just JavaScript infrastructure after all.)

So, I can see the idea of a "kind of programming" that vibe coding represents, it's not really my bag but I think its a cool way for people to do prototypes and throw-away projects.

You can [feel this](https://github.com/orta/pzdeploys/blob/master/src/main.ts) in my own codebase, this is not something someone cares about in terms of the maintainability - but again, that was not my goal. I think for small one-offs this might be interesting, but I don't think its the sort of thing I'm really looking for in a tool.

## Agentic Pair Programming

In contrast, I have been exploring the idea of fully giving the keyboard away.

{{< imageHighlight src="claude.png" alt="Yesterday's change graph showing a wild set of curves being flattened" class="slack-inline-image" >}}

Playing with [Claude Code](https://www.anthropic.com/claude-code) is the second epoch, and the reason I think it is worth me writing about this stuff publicly. Claude Code is a background app which runs in the terminal which is sortof a long-running connection to an LLM which can do _very long running tasks_ and has a sense of how to verify things in the way that you would when writing code.

To me, using Claude Code is lot like [pair programming](https://artsy.github.io/blog/2018/10/19/pair-programming/) (a programming system I've used successfully in many contexts back at Artsy) where there is someone with energy on the keyboard, and someone with experience drinking a tea and occasionally taking over mid-way and then is responsible for finishing and productionizing.

Over this last week I shipped three projects which were done in concert with Claude Code:

1. Adding support for a Crossword clue to be able to colour a word. [PR](https://github.com/puzzmo-com/xd-crossword-tools/pull/39). I wrote the README change, and then asked Claude to implement that change and to ensure there were some tests. There was very little back-and-forth (it was a very easily scoped project.)

2. Looking at adding Schrödinger's Squares to our Crossword. This I knew was going to be a tricky problem, and took me a full day and a half to get it to a pull request. I started the conversation by telling Claude Code that I wanted to specifically fix [this GitHub issue](https://github.com/puzzmo-com/xd-crossword-tools/issues/29) which gave it a lot of context about how I expected it to work.

3. Building an admin page for a new system for admins. [Here is a full transcript](/posts/2025/06/07/orta-on-claude/chat-on-a-feature.html) over the course of roughly two hours.

   Some highlights, I started with:

   > I would like to make an interface here where we have a split system where people can comment on lines in the puzzlestring on the current version of the submission

   And updated that to:

   > dont use an existing comment, I want the comments to feel more like chat messages in the side. Sorta like how google docs / ms office does it

   I got given a plan back:

   ```
   I'll create a split interface with the puzzlestring on the left and a
   chat-like comment system on the right, similar to Google Docs/MS Office.
   Let me build this for you.
   ⎿ ☐ Create split layout with puzzlestring lines on left and comments
   panel on right
   ☐ Add line numbers and make lines clickable/hoverable
   ☐ Create comment thread component for chat-like messages
   ☐ Add comment input form with line association
   ☐ Style the interface to match Google Docs/Office
   ```

   Next Claude uses all the techniques I would use:

   - It looks at the `schema.graphql` to find out what queries to make
   - It runs `yarn type-check`
   - It knows to compile Relay to generate my queries

   After the first stab. I ask:

   > I want the comments to always be showing and to have the side by side with the lines that they are attached to, and can you make them smaller - it should feel more like a chat client than a forum post

   Again, Claude Code takes a stab, uses all my tools to validates that it thinks the code is correct. I run the code, and tell it that I got an error message

   > I'm getting undefined is not an object (evaluating 'puzzleSubmission.currentVersion.puzzleString')

   And repeat as I go through different ideas, bugs and ideas, including a few dead-ends which got reverts.

   Throughout this whole process, I am reading the code, editing it between chat messages and thinking about what the long term plan is for it.

What I am finding _stunning_ about working with Claude Code, is its ability to write tests. It is substantial. For some of the Schrödinger's squares pull requests inside the Crossword engine, I built out fixtures and then just said _"make tests based on the file at x/y/z"_.

The tests were arguably better than had I written them, there was more of them, they were commented well to describe the actual [SUT](https://en.wikipedia.org/wiki/System_under_test) better than I would have bothered and represented the type of test you would write for enterprise code and not nimble startup. They were not added at the end, and so were useful as internal details of the pull request changes

```ts
describe("commitLetter with Schrödinger squares", () => {
  it("accepts any valid letter for a Schrödinger tile", () => {
    const xd = withSchrodingerXd

    const { store } = createTestEngine(xd)

    // Move to the Schrödinger square at row 2, col 1
    store.dispatch(positionCursor({ position: { index: 2, col: 1 } }))

    // Test that 'O' is accepted (from CONE)
    store.dispatch(commitLetterAtPosition({ letter: "O", position: { index: 2, col: 1 } }))
    const inputO = getInput(store.getState().userInput, { index: 2, col: 1 })
    if (inputO?.type === "rebus") throw new Error("Expected input to be a letter, not a rebus")

    expect(inputO?.letter).toBe("O")
    expect(inputO?.foundAt).toBeDefined() // Should be marked as correct

    // Reset and test that 'A' is also accepted (from CANE)
    store.dispatch(commitLetterAtPosition({ letter: "A", position: { index: 2, col: 1 } }))
    const inputA = getInput(store.getState().userInput, { index: 2, col: 1 })
    if (inputA?.type === "rebus") throw new Error("Expected input to be a letter, not a rebus")

    expect(inputA?.letter).toBe("A")
    expect(inputA?.foundAt).toBeDefined() // Should be marked as correct
  })

  // ...
})
```

For a pull request which is really touching all of the internal guts of an engine, being able to trivially generate a useful and well described test suite whenever you want is worth the price of Claude Code's most expensive offering to me. Easy.

What I think is important to keep in mind is that this is a tool, and not a replacement for critical thinking and taking responsibility. If you're writing production code, regardless of its source you need to be treating every line as though you wrote it and present it as code which you fully understand and can handle feedback on when it comes to code review. I'm on-call 12 hours a day every day for this code.

I do not think Claude Code has generated bad code for me, so far, but I am also careful and take my time with using it. I also build strict systems with TypeScript/GraphQL to ensure that there's less systemic ambiguities which are not ratified by a type system somewhere.

Does Claude Code make me faster? At this stage, I'm not totally sure. I do think the breadth of extra tests and refactors which I do now _because it is easier_ has tangible long term value to the codebases I am contributing to.

I think with Copilot's _"auto-complete but a bit more"_ it was a more universal _"yes"_. I feel I ship more code which I would have written eventually with such a controlled tool. With a cursor-like aggressive out-of-scope recommendations, they also are nearly always right and what I want. If I don't want them, I don't accept the recommendation. It's worth noting that Copilot now also has the aggressive recommendations (framed as "[Next Edit Suggestions](https://code.visualstudio.com/blogs/2025/02/12/next-edit-suggestions)") which are good enough to not warrant needing Cursor for me, so I'm back to VS Code nightlies.

Letting go of the keyboard, and passing the reins to Claude Code is genuinely an interesting experience as someone with 2 decades of programming under his belt. I think it's likely that Claude Code will be one tool of many which I will find a place where it fits instead of being a broad replacement for writing code on a day-to-day.

On a final note, there is an interesting tension in both _"it's likely that Claude Code will be one tool of many..."_ and _"I don't think LLMs are a good thing for the world."_ I think the core difference here is scale, it's like ensuring you are always turning off your house lights to save power, only to look out of the window at a bunch of commercial properties which never bother, individual choice can matter but it's a drop in the bucket compared to say making a law encouraging self-driving cars.
