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
   hugo server
   ```

4. Open the site in your browser: http://localhost:1313/

### How to make a new post

Use the CLI:

```sh
hugo new posts/[year]/[month]/[day]/[post name].md
```

A C&P example which does the dates for you:

```sh
hugo new posts/$(date +%Y)/$(date +%m)/$(date +%d)/my-post.md
```

### This blog

It uses Hugo as a static site generator, it was chosen because it is is simple to install and run locally and shouldn't break over a very long time period (the Artsy blog [I used to write on](https://artsy.github.io/blog/2019/05/03/ortas-best-of/) once or twice a month was Jekyll and required a lot of custom work to get useful features but those eventually started slowing the system down and getting ruby set up is a pain).