# blog.puzzmo.com

Puzzmo Blog

### How to get started

1. Install [Hugo](https://gohugo.io/getting-started/installing/)

   On a Mac with Homebrew, you can run `brew install hugo`.

2. Clone this repo

   ```
   git clone https://github.com/puzzmo-com/blog.puzzmo.com
   cd blog.puzzmo.com
   ```

3 . Run the server

   ```
   hugo server
   ```

4. Open the site in your browser: http://localhost:1313/


### How to make a new post

Use the CLI:

```
hugo new posts/[year]/[month]/[day]/[post name].md
```

A C&P example which does the dates for you:

```
hugo new posts/$(date +%Y)/$(date +%m)/$(date +%d)/my-post.md
```