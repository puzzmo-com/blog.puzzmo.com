+++
title = 'From Groups to Clubs'
date = 2024-07-24T10:23:52+01:00
authors = ['orta']
tags = ["changelog"]
theme = "puzzmo-light"
+++

With the $50 billion dollar mark passed on the Pile-Up Poker launch fund we're releasing a re-think of how ~~Groups~~ Clubs work in Puzzmo.

**TLDR:** Groups are now called clubs, you do not need to have Puzzmo Plus to create your first club and clubs can have leaderboards.

Starting today you'll see a way to quickly create a club with a leaderboard based on the game that you are in, which is available diwbn

![A CTA to trigger creating a typeshift club](insta-club.png)

Creating a club through this will take you through to the blank club, ready to customize or invite your friends.

![An example of a freshly created club](blank-group.png)

Some key things to note:

- There is an easy invite URL to share with club members. This link will handle guiding someone through creating a Puzzmo account if they need it

- There is a big "Set up your leaderboard" button to get started with the new club leaderboards, which we'll go into further

- Inter-group competitive aspects of Puzzmo, based on scores in games, are below

### Club Leaderboards

To get you started quickly we offer a series of interesting leaderboards for clubs which cover all the games on Puzzmo:

![The list of templates](club-templates.png)

Completing a referenced puzzle in the template will give you a first place! Easy.

![An exampple with a score](won.png)

Any member of your group will post to the leaderboard, meaning you can compare scores with non-Puzzmo Plus folks for the first time for most of these games.

### Custom Club Leaderboards

For me, this is where clubs get interesting. The templates which we provide cover a broad range of new leaderboards, most of which are not the same as the leaderboards available for Puzzmo Plus members after playing a game. We call them templates though because we are providing full access to the machinary which powers all of the leaderboards across Puzzmo to groups.

As with the [theme editing support](https://blog.puzzmo.com/posts/2024/04/25/theme-editor/) for Puzzmo, we do not anticipate this be a feature most people engage with. However, for those who are interested in being creative around the meta-games you play - I think we're offering some of the most in-depth leaderboard tools to non-programmers.

In _very_ quick: Puzzmo's custom leaderboards lets you write a line of JavaScript-like code which you can use to create a score from all games played that day, mixing all sorts of interesting gameplay statistics.

![alt text](custom-leaderboards.png)

These two underwhelming "expression" text boxes are what have been powering all of Puzzmo's leaderboards for the last few months! We've been using our own tools for this work, so with this release we've polished the page we use to figure out what to put into those two text boxes:

![Example of the REPL](repl.png)

This is a live environment where you can safely explore your ideas about what a leaderboard could be, for example:

- A leaderboard which counts how many pawns are converted in Really Bad Chess
- A leaderboard which you can only use if you use more than 3 hints in a Cross|word
- A leaderboard which combines the words found in Spelltower and Wordbind
- A leaderboard which counts Flipart time, but only if you get no excess rotates
- A leaderboard which uses the words per minute on Spelltower and Cubeclear, but only if you have an average word length greater than 5
- A leaderboard which takes the most points for a word in SpellTower, but only if it contains two `A`s
- A leaderboard for Cross|word which requires having 'Brooke's expert settings' enabled
- A leaderboard in Spelltower's scores, where you are not able to use bonus tiles

It's hard to describe how many bits of data you can work with, it's a lot, and you can combine them into all sorts of leaderboards.

I'm hoping folks will find all sorts of creative uses of this leaderboard infrastructure, and am excited to be surprised. We'll be setting up a space in our discord for answering questions and sharing leaderboard ideas, similar to how the theme editing has been going.
