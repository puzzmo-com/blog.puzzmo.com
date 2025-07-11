+++
title = 'On pre-solving'
date = 2025-07-11T00:00:38-04:00
authors = ["zach"]
tags = ["release"]
theme = "bright-white"
+++

One of the unique features of Puzzmo as a platform is that we show you a visual representation of the puzzle you are about to solve before you play it. This preview of each puzzle is a core part of what we think makes Puzzmo special. For some games, this preview is enough of the puzzle that you can actually solve the whole puzzle without actually clicking into the puzzle at all. We refer to this as “pre-solving”. Although we don’t think it’s generally the most fun way to solve a puzzle, we don’t consider it to be cheating.

One of the things that's really difficult about creating new puzzle games is that many people are uncomfortable playing and learning a new game. This is especially true of players who do not consider themselves to be gamers. But something I witnessed over and over again throughout my childhood was watching my mom (who does not consider herself to be a gamer) discover and become enthralled by new games that she encountered on our newspaper's puzzles and games page.

There's something magical about printed newspaper games pages — I think it's that the games are all just "there". Most of the time when you introduce someone to a new game, you've placed it in front of them and told them that they have to learn it now, or you've pitched it from a trailer or a blog post or a review. But newspaper games are different. Newspaper games are all just sitting there alongside the game that you already like to play every day, waiting to catch your eye. There's no pressure at all. One day, perhaps, you finish the game you love early, and you're looking for something else to do, and the puzzle that you've passed over a hundred times suddenly feels like something you could get into.

This is something we wanted to recreate with Puzzmo and it's why we present all our games on one page together looking exactly the way they look when you open them up. Early on, this led to one very specific problem with my game Typeshift: pre-solving. People would look at the representation of Typeshift and fully solve it in their minds or on a piece of paper, before even opening up the puzzle. For players that play like this, the "Best Time" leaderboard isn't about how long it took you to solve the puzzle. Instead, it's about how long it took you to input the answers with your keyboard. 

To some players this is really disappointing and feels like cheating. Other players really love solving the puzzle on a piece of paper, and take strategic pleasure in how they input the words. Some players feel like they cannot escape the competitive nature of the leaderboards and, even though they don't like solving it in advance, they feel like they have to. And of course, some players don’t care at all and just solve the puzzle how they want without worrying about pre-solving.

In an ideal world, none of our puzzles would be pre-solvable, and we wouldn't be giving some kinds of players a bad experience. In the nearly two years since Typeshift launched, we have put a lot of thought into how we could address the pre-solving issue. And lately, I thought about it specifically in relation to Missing Link and another upcoming game that we plan to launch soon that can be pre-solved as well.

With Missing Link, I originally had a design where all of the cells were shuffled in the preview image of the game (if you hadn't clicked in yet). This did a great job presenting the game in a way where you could see what it looked like and start to think about how things might connect. But it also created this sort of low-level anxiety in my head when I looked at the image. Almost like an uncanny valley of puzzle solving. Things almost fit together, but then they never actually did. And it felt to me like this was merely an illusion of a solution to the pre-solving problem. It looked like it was working, but actually it wasn't allowing players to do the most important thing — to imagine what it was like to play the game. Instead, it was tricking them into a sort of secret hell.

{{< imageHighlight src="shuffled.png" alt="An image of a Missing Link puzzle with the cells shuffled." class="slack-inline-image" >}}

Another thing I tried was simply not showing all of the cells. We actually do this in Memoku (where it works great). But somehow, not showing all of the cells felt even worse than shuffling them. Instead of ending up in an uncanny valley, you ended up just in a valley. The game teased you with a notion of what it was, but not in a way that felt fun, because you couldn't actually figure out what was going on. And remember, the whole idea with showing these thumbnails is to get players like my mom to scroll past a new puzzle enough times that they become naturally curious about it. The last thing we want to do is make our puzzle previews *less compelling*.

{{< imageHighlight src="censored.png" alt="An image of a Missing Link puzzle with some of the cells blanked out." class="slack-inline-image" >}}

In the end, we decided there wasn't a solution that prevented pre-solving and didn’t also seriously hamper players' ability to play a game in their head before clicking in on it. But that doesn’t mean we just gave up. Instead, we looked for other angles by which we could address pre-solving. One example of this is how we use the champions leaderboards to relocate first place finishers (who are always pre-solving) off the main leaderboard.

Another place we can address pre-solving is by focusing more on friends and less on global leaderboards. The global leaderboards will always be there, of course, but if you're playing primarily on leaderboards with your friends, you know who's pre-solving and who isn't — and the kind of experience you're having with those players is more nuanced and personal (and less of a big deal).

So that's where we landed for now on pre-solving. This is a very hard problem, and something that all of us at Puzzmo will continue to think about as the site continues to expand and change.

