+++
title = 'Using Shiki Syntax Highlighting in Hugo'
date = 2024-06-23T14:59:00+01:00
authors = ["orta"]
tags = ["tech", "ablog", "shiki"]
theme = "outlook-hayesy-beta"
+++

When I decided on Hugo for this blog, I knew I was gonna have to take a hit on something I felt was very important to me and my writing: fancy tools for syntax highlighting.

I choose Hugo because it should be super easy for folks to contribute (no fancy Node tooling setup etc) - so I have Shiki being applied as an **optional** post build step.

First up, we need to disable the current syntax highlighting for codefences by editing `hugo.toml`:

```toml
[markup]
  [markup.highlight]
    codeFences = false
```

That means that the hugo process would make a codefenced block which looks like this HTML:

```html
<pre><code class="language-toml">[markup]
  [markup.highlight]
</code></pre>
```

Which we can work with! So, the goal will be to edit the built files after Hugo has done its thing to switch the syntax highlighter.So, lets add the Node infra to do this, starting with adding some dependencies:

```ts
yarn add shiki @types/node node-html-parser
```

Then create a new script file:

```ts
import { createHighlighter, bundledLanguages } from "shiki"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { parse } from "node-html-parser"

const posts = "public/posts"
const files = await readdirSync(posts, { recursive: true, encoding: "utf-8" })
const indexFiles = files.filter((file) => file.endsWith("index.html") && file.split("/").length > 3)

const highlighter = await createHighlighter({
  themes: ["nord"],
  langs: Object.keys(bundledLanguages),
})

// Find all of the files in the posts directory which are index.html
for (const file of indexFiles) {
  // Grab the file, and parse it into a DOM
  const content = readFileSync(posts + "/" + file, { encoding: "utf-8" }) 
  const dom = parse(content)

  // This isn't a particularly smart query implementation,
  // so lets take the simple route and just grab all of the pre tags
  const codeBlocks = dom.querySelectorAll("pre")

  for (const codeBlock of codeBlocks) {
    // We need to look for the code inside it
    const codeChild = codeBlock.childNodes[0]
    if (!codeChild) continue

    const codeElement = parse(codeChild.toString())

    // Pull out the language from the original code block
    let lang = "text"
    if (codeChild.rawText.startsWith('<code class="language-')) {
      lang = codeChild.rawText.split("language-")[1].split('"')[0]
    }

    const code = codeElement.textContent
    const highlighted = highlighter.codeToHtml(code, {
      lang: lang || "text",
      theme: "nord",
    })

    const newPreElement = parse(highlighted)
    codeBlock.replaceWith(newPreElement)
  }

  // Write the new HTML
  const newContent = dom.toString()
  writeFileSync(posts + "/" + file, newContent)
}
```

_( I saved mine at `scripts/shifify.ts` and use `tsx` to run the file as TypeScript. )_

Next, I changed the CI build process to also run the new script:

```yml
- name: Build with Hugo
  env:
    # For maximum backward compatibility with Hugo modules
    HUGO_ENVIRONMENT: production
    HUGO_ENV: production
  run: |
    hugo \
    --gc \
    --baseURL "${{ steps.pages.outputs.base_url }}/"  

- name: Setup Node
  uses: actions/setup-node@v3
  with:
    node-version: 20.x
    cache: yarn

- name: Install and run
  run: yarn install && yarn tsx scripts/shikify.ts

- name: Upload artifact
  uses: actions/upload-pages-artifact@v2
  with:
    path: ./public

```

_Note: minify is not enabled on the `hugo` command_

And... That's kinda it! So, TLDR:

- Make the default highlighter not do codefences
- Add a script to parse the output
- Change CI to run it

Good luck