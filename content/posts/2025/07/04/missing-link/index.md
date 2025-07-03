+++
title = 'Missing Link'
date = 2025-07-03T00:00:38-04:00
authors = ["zach"]
tags = ["release"]
theme = "bright-white"
+++

![https://cdn.puzzmo.com/assets/missinglink-v1.gif](https://cdn.puzzmo.com/assets/missinglink-v1.gif)

1. Every day when I wake up and play Puzzmo, after I enjoy some of the classics, I play several games that aren't out yet. Lately, as we have more and more games at all stages of development, I've found my personal Puzzmo page is looking less and less like all of yours.

   So we're trying something new — we're releasing one of those half-baked games as a very experimental limited run. Missing Link is only running until the end of August. We'll decide what to do with it after that.

   This means we don't have to worry about polish or well-crafted code, and it means I can get the game out of my head and into your hands without burdening other people at Puzzmo with more work (well, mostly — thanks for your help [Orta](https://orta.io)).

1. So what's the deal with Missing Link? Why make this particular game?

   Missing Link is in a genre of game that I feel like I've seen about a thousand attempts at: A grid filled with letters, and the player is tasked with using every letter in exactly one word.

   It's the sort of idea that sounds great until you actually ask someone to play it. English letters are usable in so many different permutations that there's just nothing to grip onto as you try and solve the puzzle. Every answer you come up with has as equal a chance of being part of the solution as it does of sending you down a deep rabbit-hole of words that will never ever work.

   Lots of designers have taken a swing at this particular problem: Strands on NYT games, Cell Tower by Andrew T, and our very own Cube Clear are some notable attempts to navigate this nightmare possibility space. Ultimately I think all of those games fail for different reasons: If you solve the theme, Strands is just a word-search, and if you don't it's just inputting arbitrary words until you hit upon something that works. Cell Tower is really clever, but the mechanic has to push too far away from word-search to make the game work and it ends up being really unintuitive to beginners. Cube Clear tried to address the rabbit-holes by having open-ended solutions, but in the end, the game is still quite hard, and still has plenty of rabbit-holes.

   With Missing Link I really set out to solve this issue once and for all. How could I make a grid of letters game where the words you find always guide you towards the solution? The answer I found is to put more than one letter in each grid cell. With multiple letters in some cells I was able to write a puzzle generator that could actually ensure that there weren't rabbit-holes by making sure that the cells could only fit together one way. Or... well mostly... I do actually allow for one way for wrong words to be findable, but only if they're made up entirely of cells that are included in a correct answer. This adds just the right amount of ambiguity — maybe you'll find THOUGHTFUL when the answer is actually THOUGHTFULLY (and have to rework that later on in the puzzle).

1. One last thing to talk about with Missing Link: Hints!

   My philosophy with hints, which you may have encountered in some other games on Puzzmo, is that rather than giving you the answer, whenever possible I prefer hints to just change the puzzle into an easier, sometimes different puzzle. I think hints should always feel fun to use, and never feel like a spoiler!

   Most designers might give you a hint in Missing Link by linking two cells that are correct in the solution. I thought it would be more fun to instead put up a wall to show you groups that aren't linked. I prefer this because it cuts down the wrong-answer space, while still letting you find the right answer on your own. And it elegantly reaches all the way down to the lowest skill players — if you press the hint button a lot, you end up with a circled word, so you can always solve any puzzle with enough hints.
