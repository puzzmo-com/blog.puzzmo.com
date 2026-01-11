+++
title = 'Follows Not Friends'
date = 2026-01-11T06:34:49-05:00
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Heyo folks,

When we set out to figure out what a social network layer would be on top of our platform, we thought that a traditional one-to-one bi-directional relationship was probably the right call. We imagined a pretty small set of folks you already knew off the platform and finding each other as Puzzmo friends was a way to be able to compare scores and share highlights.

A few years later, I don't think that is too far from what happens socially on the platform but this year we're going to try and give the social layer another look over.

This starts with converting the core relationship metaphor from "friends" to "follows". Prior today, you could send a friend invite to someone and they would need to accept it. Now, you can simply 'follow' someone, and they can 'follow' you back.

One of the main goals here is that we want to give Puzzmo a feel that people are playing around you. For example there six figures of puzzles being completed a day but a lot of the people we raise up to being seen in the user interface are our power players! They are definitely doing interesting plays, but it can also be a bit
intimidating to always be compared to them.

If we loosen the 'both parties know each other' part of the relationship, then its possible we can start exploring ways to give people a chance to find and follow others who are similar to you!

So, today we've converted all existing friends on Puzzmo to be mutual followers, removed all friend requests, and places where we you could 'friend' are you now 'follow' - over time, we'll flesh this out more and add follower specific parts to the site
