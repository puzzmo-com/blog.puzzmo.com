// yarn build && yarn syntax

import { createHighlighter, bundledLanguages } from "shiki"
import { transformerTwoslash } from "@shikijs/twoslash"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { parse } from "node-html-parser"

const posts = "public/posts"
const files = await readdirSync(posts, { recursive: true, encoding: "utf-8" })
const indexFiles = files.filter((file) => file.endsWith("index.html") && file.split("/").length > 3)

const highlighter = await createHighlighter({
  themes: ["solarized-light"],
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
      theme: "solarized-light",
      transformers: [transformerTwoslash({ explicitTrigger: true })],
    })

    const newPreElement = parse(highlighted)
    codeBlock.replaceWith(newPreElement)
  }

  // Write the new HTML
  const newContent = dom.toString()
  console.log("Updating", posts + "/" + file)
  writeFileSync(posts + "/" + file, newContent)
}
