+++
title = 'Migrating a third of a million lines of code to a monorepo'
date = 2024-08-31T22:56:17+01:00
+++

About 3 months ago, we made two decisions which would affect the technical roadmap of Puzzmo for years to come:

- We can't safely pull off a single React Native codebase for web + mobile (with our current team sizes / operational techniques)
- We have too many decoupled moving parts, almost all app features require two pull requests, and a non-significant amount require three

At the core of these changes, we free'd up two very big technical constraints

- We did not need to use Expo to act as a framework for a single codebase for web + mobile
- We would need to have an exit strategy from RedwoodJS, as it makes too many demands on layout of your project

So, for the last few months, I've been prototyping and figuring out a strategy to migrate our working in production projects to leave their cosy homes and migrate them all into a single monorepo with as few systemic dependencies as possible.

Let's go through some of my motivations, things shipped and goals to try get it polished.

### De-React Native-ifying

One of the first decisions I made for Puzzmo, was to go with React Native via Expo. The goal was that I could make a single codebase which would account for both the website and native apps. I considered that the "web" aspects of React Native would be the least baked from the framework's perspective, which was fine because web was the first platform we would be shipping on. So, the issues we'd find along the way we can iron out, and the native part would come along pretty easily once we started to focus on supporting the additional platforms.

To ensure we weren't losing track of the progress, from day one I had a fully working build of the codebase shipping as a native app via Expo's cloud services. For the first year, while I was the only programmer on Puzzmo, I would try to boot up the native builds and handle the changes to make it start working. Over time, I got a sense of what the trickiest things to try keep in sync were:

- Ensuring the game thumbnails weren't crashing the entire app
- Handling the subtle differences between navigational infrastructure

These both were solvable at the speed I was going at, and were constraints I could keep reasoning about (and kinda anticipate/write tests for with the SVG thumbnail renderer at least) but it was difficult to make sure we were only using properties supported in the React Native SVG project 



### De-Redwoodifying