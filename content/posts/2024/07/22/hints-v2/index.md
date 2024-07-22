+++
title = 'Hints v2: Moving from a time penalty to a cooldown period'
date = 2024-07-22T16:40:29-04:00
authors = ["brooke"]
tags = ["crossword"]
theme = "bright-white"
draft = true
comments = false
+++

Crossword puzzle solving has a learning curve. There are tons of guidelines that crossword constructors and editors adhere to, and in general these conventions aren't written down anywhere. Instead, solvers typically learn about crossword conventions through the process of solving tens, hundreds, and thousands of puzzles, eventually coming to understand the language of crossword clues and the signals they give to solvers about their answers.

However, this can be a daunting process — and it's not like anyone tells you there's going to be a process at all! Lots of potential crossword solvers attempt a puzzle or two and then think, "well, this isn't for me," often not realizing that *no one* is a natural at solving crosswords and that *everyone* has to learn their conventions and language. (There's a lot to be said about how the *content* of crosswords can be encouraging or discouraging; I've [spoken about that elsewhere](https://www.twitch.tv/videos/1002528362) (the relevant discussion is from 4:35-8:45) and also recommend [this 2021 article](https://www.washingtonpost.com/lifestyle/crossword-puzzle-diversity/2021/03/10/884828e0-753c-11eb-9537-496158cc5fd9_story.html).)

When Zach decided that he wanted Puzzmo to have a crossword, he thought about the ways in which he could ease the new-to-experienced crossword solver transition by presenting a familiar puzzle form in a welcoming, accessible way. The two main "assists" that Zach introduced to [Puzzmo's Cross|word](https://www.puzzmo.com/play/crossword) are hints and word-separating lines,  both of which appear in all of our crosswords. On days when we run rebus puzzles, there are also rebus-specific assists.

### Hints

Every Puzzmo Cross|word has two sets of clues: the regular "clues" written by the constructor and edited by the clue editor, and a secondary, easier set of "hints." The second set of hints is written by a hint writer and edited separately from the regular clues. When I joined Puzzmo last summer, the first thing I did was write a detailed style guide describing the philosophy behind what a hint should and shouldn't be, and practical guidelines for writing them. Here's an abbreviated version of my hint philosophy:

A solver who is opting into a clue set is presumed to be stumped by the original clue and seeks an easier clue. In this spirit:

- The hint should not be too much of a "gimme"; namely, it should not make the solver feel like they are cheating.

- The hint should not be too similar to the original clue. The solver shouldn't think, "The reason I used the hint was because I didn't know that, and I still don't know it!"

- The hint should be easier than the original clue. If the clue is already easy and the answer is not trivia-based, a comparatively easy hint might be acceptable, especially if it is for a different definition of the answer.

- The hint should not rely on trivia, nor should it attempt to be clever or misdirecting.

- For trivia-based answers or difficult vocabulary, the hint should provide the solver with all or some of the answer. The goal is to minimize the chance that the solver who has requested the hint gains no information from the hint. For this reason, names should often be given lexical "problem solving" clues that feature hidden words, anagrams, or similar.


The hints also include a word count if the answer is more than one word, and an abbreviation indicator.

For example, from the crossword that ran on Monday, June 22 by [Rebecca Goldstein](https://www.puzzmo.com/user/xwc/rebecculous), the answer `THRONE ROOMS` gets the clue `Reception areas?`, which is a tricky misdirect that evokes cell phone usage, not castles' ceremonial halls. The easier hint [Matthew](https://www.puzzmo.com/user/xwc/mstock) wrote for this answer is `Places in castles where monarchs sit in fancy chairs: 2 wds.`

Elsewhere in the same puzzle, Rebecca's `LIN` clue is "`Moana" songwriter ___-Manuel Miranda`. Matthew's hint is `Name hidden in the phrase "artificial intelligence"`, which avoids the need to know this particular celebrity by instead presenting a lexical problem for the solver to figure out.

Our hints are written and edited with care and for the purpose of helping the solver who requests one. Zach likes to describe hints as similar to a smart friend who's looking over your shoulder giving you a nudge in the right direction. We want you to use them!

### v1: Time penalties

Since launch, each time you use a hint in Puzzmo's Cross|word, 30 seconds is added to your solve time.

Unsurprisingly, the existence of a time penalty can be a deterrant to clicking the hint button. Despite the fact that we painstakingly write and edit them (and pay for them!) this penalty can still give off the vibe that the solve is in some way "lesser" if any hints were used. (For awhile, there was also a bug in our code that enabled players to display their lowest-ever hint usage if it was zero, which further discouraged hint usage. We try to avoid enabling any stats of this nature, and it should've never been available in the first place!)

Should hints be "free," though? While we want you to use the hints, we also hope that the more you use hints, the better you become at solving crosswords... which may lead you to use fewer hints in future puzzles. Our aim is both to encourage judicious use of hints and that, over time, solvers may discover that spending more time thinking about a tough answer is better for their time than using the hint.

The time penalty was our first attempt at conveying this, but we've continued to hear from players that they don't like being penalized for hints. Therefore, over the past several months, we've been testing out a new paradigm that drops the time penalty while still encouraging a conscious decision.

### v2: Cooldown period

Starting today, using a hint will *never* incur a time penalty. Our new system is a combination of a hint cache and a cooldown timer. Every player starts with a full cache of three hints available to use as soon as they want to. When their cache isn't full, they get a hint back every 30 seconds until the cache has three hints again. This means if you immediately use all three hints upon opening the puzzle, you'll have to wait 30 seconds to use another one, and 90 seconds to have your full cache back.

We equilibrated to this paradigm after two rounds of playtesting with volunteers. Each round of testing included two weeks of puzzles, and we encouraged solvers to give feedback only after regularly playing for a week. The first round's mechanics were very similar to what you see today, and we got really exciting feedback about solvers who were playing with newly-possible strategies.

In our second round of playtesting, we dropped the cache and used a shorter cooldown after every hint usage. We found this to be overall less enjoyable for our playtesters, so we brought the cache back. We're very grateful to our volunteers who provided such insightful feedback over the course of playtesting: if this was you, thank you so much!

We're excited for you to try out this new hint system! Maybe you will use a hint for the first time, or maybe you will discover a new, exciting way of playing our Cross|word.




