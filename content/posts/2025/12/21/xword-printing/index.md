+++
title = 'Crossword Printing Techniques'
date = 2025-12-21T15:39:17Z
authors = ["orta"]
tags = ["tech"]
theme = "outlook-hayesy-beta"
+++

Printing a Crossword, easy problem right? No art in getting this right, nuh uh. Just simply render a Crossword in the corner and then throw some clues under it. done :shippit:

OK, so I admit I didn't come into this _that_ blasé but I sure underestimated this project. I tend to frame projects under the ["unknown known" matrix](https://en.wikipedia.org/wiki/There_are_unknown_unknowns) and thought that shipping printing support for Crosswords (which you can see on any [New](https://www.newyorker.com/puzzles-and-games-dept/mini-crossword/2025/11/27#intcid=_the-new-yorker-article-bottom-recirc_5722aeda-b776-4234-83ad-d353e349979f_roberta-similarity1) [Yorker](https://www.newyorker.com/magazine/2025/12/22/rough-copy-crossword) [Crossword](https://www.newyorker.com/puzzles-and-games-dept/mini-crossword/2025/09/26) ) was basically a _known unknown_ problem.

The unknown here being that I wanted to avoid having a separate clue rendering system, so we would need to be able to handle server-side rendering our clues so that users aren't downloading the whole Crossword game engine to simply make sure our templating system is the same! This would be my first introduction to writing my a server-side React renderer but we needed to understand it anyway as The New Yorker used server-side rendering for showing the Crossword in their articles!

So, that was my thoughts on the big unknown, a little bit of tooling and build infrastructure later I'd built out a small server-side renderer which sits on [fastify](http://fastify.dev) with which corresponds to our print server. It's not too wild, the rendering looks like this:

```tsx
import { renderToString } from "react-dom/server"
import { decode } from "html-entities"

import crosswordStyles from "../styles/crossword-print.scss?inline"

import { Provider } from "react-redux"
import { createCrosswordStore } from "./createCrosswordStore"
import { ClueFeedbackProvider } from "@puzgames/crossword/src/renderer/html/ClueFeedbackContext"
import { PrintCrosswordRenderer } from "../components/crossword/CrosswordPrintRenderer"
import { CrosswordPrintOptions } from "../routes/crossword"

export async function generateCrosswordReactHTML(xdFile: string, options: CrosswordPrintOptions, partnerSlug?: string): Promise<string> {
  try {
    // Create actual crossword store using proper initialization
    const showSolution = false
    const store = createCrosswordStore(xdFile, showSolution)

    const reactHTML = renderToString(
      <Provider store={store}>
        <ClueFeedbackProvider config={{}}>
          <PrintCrosswordRenderer options={options} />
        </ClueFeedbackProvider>
      </Provider>
    )
    const bodyClass = partnerSlug

    // The moz attributes on html remove ugly 'marginal content' like page url and title when printing in Firefox
    return `<!DOCTYPE html>
<html moznomarginboxes mozdisallowselectionprint lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${decode(options?.title)}</title>
    <style>${crosswordStyles}</style>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
    ${reactHTML}
</body>
</html>`
  } catch (error) {
    console.error("Error rendering React crossword:", error)
    throw new Error(`Failed to render crossword: ${error instanceof Error ? error.message : String(error)}`)
  }
}
```

Which is pretty simple, you pass a JSX component into [`renderToString`](https://react.dev/reference/react-dom/server/renderToString) and it turns that into HTML. So, I guess that makes the unknown a known!

Now, the easy part, making a column layout for the clues which is cross-browser and supports different positions of the Grid crossing many columns depending on sizes and clue length. Easy. Right?

{{< blank height="50" >}}
_Right?!_

{{< blank height="70" >}}
**RIGHT?!**

{{< blank height="150" >}}

{{< imageHighlight src="meme.png" alt="right?!!!!!!!!" >}}

It's safe to say this turned into the real unknown inside the project. I had assumed that a newspaper-like columns and grid system which works across browsers was feasible with modern CSS. This was not the case.

Starting off easy, lets look at the shape of the first layout:

{{< imageHighlight src="two-grid.png" alt="Two grid" >}}

This one, you can do a million ways. The next one, where clues can flow from one column to another it is still easy to do in modern CSS:

{{< imageHighlight src="two-grid-flow.png" alt="Two grid with flow" >}}

This can be done via the CSS [`columns`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/columns) attribute.

These designs are great for mini Crosswords, but that's only a small subset of Crosswords. For bigger grids, we're gonna need more space to fill with clues:

{{< imageHighlight src="4-grid.png" alt="4 column grid" >}}

Plus, 5 column:

{{< imageHighlight src="5-grid.png" alt="5 column grid" >}}

Now. Parts of this are easy independently but the two things combined: a re-flowing column layout with a potential inset. That's a big no-no.

I tried CSS [grid](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid), I tried [columns](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/columns) and I thought pretty hard about whether I could make it work with [flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout).

I spent some time exploring if we could use the (not yet released) CSS [masonry](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) layouts, but those layouts are built on the concept of an un-ordered set of items and Crossword clues are ordered - they need to go into the same or next column.

So what to do? Well, it may be server-side React but the old ways are still around!

My solution was to server-side render all our React components into a `<div style="display: none" />` then make sure there's enough information available to run a layout script inside the client.

```tsx
<script dangerouslySetInnerHTML={{ __html: `window.xdJSON = ${JSON.stringify(xwordJSON || {})}; ` }} />
<script dangerouslySetInnerHTML={{ __html: `window.printSettings = ${JSON.stringify(options || {})};` }} />
<script src="/assets/layoutPrintPageForCrossword.js" />
```

This gives us the ability to render the clues exactly as our Crossword game does and get them correctly in the DOM via server-side rendering, but then we fully manipulate them into position when we have the browser for computing layouts. So, the next problem - how do we determine how many columns to show and when one is 'full'?

My goal for our print pages was: try really hard to fit on one page, re-use as much Crossword engine rendering as possible and support a bunch of design options. So, making it fit on one page gives a pretty reasonable height constraint!

To figure out the how many columns are a good fit for that height, you need to have a sense of the height of your content and in reality, you can only know how by laying it out and seeing how well it fits. Once I had come to this conclusion, I came up with a pretty solid answer for how to describe algorithm.

We can use a [genetic algorithm](https://en.wikipedia.org/wiki/Genetic_algorithm). Not a tool I've really used much in my decades of programming! My approximation/interpretation is an algorithm where you have a defined 'fit' function and a set of parameters which you change to determine how well the fit is.

For this project, the 'fit' is how much whitespace is left in the columns. So, we define our layouts and their constraints:

```ts
/** @type {Omit<ResolutionOption, "clueSpacing">[]} */
const baseLayoutOptions = [
  // Big centered mini, with two cols below, this one has clues
  // and sections
  {
    crosswordPosition: "center",
    crosswordHeight: 400,
    columnCount: 2,
    indexesOfShortColumns: [0, 1],
    newColumnForDown: false,
    numberOfColumnsForTitle: 2,
  },
  // This one always splits at "down"
  {
    crosswordPosition: "center",
    crosswordHeight: 400,
    columnCount: 2,
    indexesOfShortColumns: [0, 1],
    newColumnForDown: true,
    numberOfColumnsForTitle: 2,
  },
  // Large right-aligned, 5 cols
  {
    crosswordPosition: "right",
    crosswordHeight: 400,
    columnCount: 5,
    indexesOfShortColumns: [2, 3, 4],
    newColumnForDown: false,
    numberOfColumnsForTitle: 2,
  },
  // Large right-aligned, 4 cols
  {
    crosswordPosition: "right",
    crosswordHeight: 400,
    columnCount: 4,
    indexesOfShortColumns: [2, 3],
    newColumnForDown: false,
    numberOfColumnsForTitle: 2,
  },
]
```

Then combine these with font sizes, because a larger font size feels better.

```ts
/** @type {ResolutionOption["clueSpacing"][]} */
const clueSpacing = ["tighter", "tight", "looser", "normal", "large"]

/** Base font sizes for each spacing option (in pixels) */
const baseFontSizes = {
  tighter: 12,
  tight: 13,
  looser: 14,
  normal: 15,
  large: 18,
}
```

The algorithm uses these as parameters, so for each layout run through 5 different sizes and determine the 'fit'.

We use the DOM API [`cloneElement`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) to make a replica of every clue DOM node which were server-side rendered into the set of columns. Given the goal is a single sheet of paper, then we have a rough number of how many pixels are available on a sheet of paper, and can use that as a max height. If the new node makes the column taller, then remove it node and migrate to the next column instead.

If there isn't a next column, then it doesn't fit - in that case, mark the layout as not usable and look at the next layout. If we have run out of clues to migrate over, then it is done. After that count how much whitespace is left in the current and upcoming columns. This is the 'fit' we are looking to get that number as low as possible.

If we can't make it fit at all, then we need to use a different process for rendering multi-page support!

Here's a version of the rendering process happening visually for [a large Crossword](https://www.newyorker.com/puzzles-and-games-dept/crossword/2025/02/10). You can see it iterate through all of the normal layouts and settles in multi-page mode!

{{< imageHighlight src="layout-renderer.gif" alt="A GIF showing all the layouts being ran through" >}}

Now, doing print focused CSS is nontrivial! For example you can't trust the print preview! The map:

{{< imageHighlight src="preview.png" alt="Print preview of a Crossword in Safari" >}}

Is not the territory!

{{< imageHighlight src="reality.png" alt="The actual Crossword as a PDF" >}}

I (luckily for me) was on vacation during some of the polish passes around making sure it fits on the many different formats of "A4" paper in the world and making it all fit and feel great - that's Saman's work!

It'll be cool to come and bring print support to puzzmo.com, and then make this be generally available to anyone looking to make a PDF version of an xd file in the future!
