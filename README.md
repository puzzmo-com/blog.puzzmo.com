# blog.puzzmo.com

Puzzmo Blog

### How to get started

1. Install [Hugo](https://gohugo.io/getting-started/installing/)

   On a Mac with Homebrew, you can run `brew install hugo`.

2. Clone this repo

   ```sh
   git clone https://github.com/puzzmo-com/blog.puzzmo.com
   cd blog.puzzmo.com
   ```

3. Run the server

   ```sh
   hugo server -D
   ```

   If you want future dated posts to appear use `-F` as well

4. Open the site in your browser: http://localhost:1313/

### How to make a new post

Use the CLI:

```sh
hugo new posts/[year]/[month]/[day]/[post name]/index.md
```

A C&P example which does the dates for you:

```sh
hugo new posts/$(date +%Y)/$(date +%m)/$(date +%d)/my-post/index.md
```

Then change `my-post` to be a cool URL. Next: set up the metadata at the top of the `index.md` to include your name, the tags and the theme.

You can see [the themes here](https://github.com/puzzmo-com/blog.puzzmo.com/tree/main/static/themes).

If it is your first post, you will need to add yourself to `content/authors/[you]/_index.md`. It'll make sense when you look. Then you can use that as the author.

### How do we handle separate sections?

Right now, via tags:

```sh
+++
title = 'How the Puzzmo API handles integrations on a per-game basis'
date = 2024-04-08T12:00:32Z
authors = ["orta"]
tags = ["tech", "api", "plugins"]
theme = "outlook-hayesy-beta"
+++

```

This post would appear in 3 sections: tech, api and plugins. Which have their own url: https://blog.puzzmo.com/tags/tech/

### This blog

It uses Hugo as a static site generator, it was chosen because it is is simple to install and run locally and shouldn't break over a very long time period (the Artsy blog [I used to write on](https://artsy.github.io/blog/2019/05/03/ortas-best-of/) once or twice a month was Jekyll and required a lot of custom work to get useful features but those eventually started slowing the system down and getting ruby set up is a pain).

It has an optional post-completion hook which you can test via `yarn build && yarn shikify` which uses Shiki for code samples instead of Hugo's defaults.
