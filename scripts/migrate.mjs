#!/usr/bin/env node

/**
 * Migration script: Hugo blog.puzzmo.com → Astro
 * Converts TOML frontmatter to YAML, Hugo shortcodes to component syntax,
 * and copies all content + images.
 *
 * Posts with shortcodes become .mdx with component imports.
 * Posts without stay as .md.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from "fs";
import { join, dirname, relative } from "path";

const HUGO_ROOT = join(dirname(new URL(import.meta.url).pathname), "../../blog.puzzmo.com");
const ASTRO_CONTENT = join(dirname(new URL(import.meta.url).pathname), "../src/content/blog");
const HUGO_POSTS = join(HUGO_ROOT, "content/posts");

// ── TOML Frontmatter Parser ──────────────────────────────────────────────────

function parseTOMLFrontmatter(content) {
  const match = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+/);
  if (!match) throw new Error("No TOML frontmatter found");

  const toml = match[1];
  const body = content.slice(match[0].length).trim();
  const data = {};

  for (const line of toml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1);
      data[key] = inner
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^["']|["']$/g, ""));
    } else if (value === "true") {
      data[key] = true;
    } else if (value === "false") {
      data[key] = false;
    } else if (value.startsWith("'") || value.startsWith('"')) {
      data[key] = value.replace(/^["']|["']$/g, "");
    } else {
      data[key] = value;
    }
  }

  return { data, body };
}

// ── YAML Frontmatter Writer ──────────────────────────────────────────────────

function toYAML(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - "${item}"`);
      }
    } else if (typeof value === "string") {
      const escaped = value.replace(/"/g, '\\"');
      lines.push(`${key}: "${escaped}"`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

// ── Shortcode detection ──────────────────────────────────────────────────────

const SHORTCODE_PATTERNS = {
  details: /\{\{<\s*details\s/,
  imageHighlight: /\{\{<\s*imageHighlight\s/,
  "image-caption": /\{\{<\s*image-caption\s/,
  "image-grid": /\{\{<\s*image-grid\s/,
  cite: /\{\{<\s*cite\s/,
  "line-break": /\{\{<\s*line-break\s*>\}\}/,
  "cta-button": /\{\{<\s*cta-button\s/,
  video: /\{\{<\s*video\s/,
  "claude-iframe": /\{\{<\s*claude-iframe\s/,
};

function detectShortcodes(body) {
  const found = new Set();
  for (const [name, pattern] of Object.entries(SHORTCODE_PATTERNS)) {
    if (pattern.test(body)) found.add(name);
  }
  return found;
}

// Shortcodes that require MDX (component imports) vs ones that work as plain HTML
const COMPONENT_SHORTCODES = new Set(["imageHighlight", "image-caption", "image-grid", "cite", "cta-button", "video", "claude-iframe"]);

/** Check if content has MDX-unsafe patterns (curly braces, template literals, angle brackets outside code fences) */
function hasMdxUnsafeContent(body) {
  // Strip code fences
  const withoutCode = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  // Check for curly braces or template literals or angle brackets that look like tags but aren't
  return /\$\{/.test(withoutCode) || /\{"/.test(withoutCode) || /<[a-z]+ \d/.test(withoutCode);
}

// ── Component import map ─────────────────────────────────────────────────────

const COMPONENT_IMPORTS = {
  imageHighlight: 'import ImageHighlight from "@/components/blog/ImageHighlight.astro";',
  "image-caption": 'import ImageCaption from "@/components/blog/ImageCaption.astro";',
  "image-grid": 'import ImageGrid from "@/components/blog/ImageGrid.astro";',
  cite: 'import Cite from "@/components/blog/Cite.astro";',
  "cta-button": 'import CtaButton from "@/components/blog/CtaButton.astro";',
  video: 'import Video from "@/components/blog/Video.astro";',
  "claude-iframe": 'import ClaudeIframe from "@/components/blog/ClaudeIframe.tsx";',
};

// ── Common pre-processing ────────────────────────────────────────────────────

function preProcessContent(content) {
  // Convert markdown image syntax for video files to video tags
  return content.replace(
    /!\[([^\]]*)\]\(\.?\/?([^)]*\.(?:mov|mp4))\)/g,
    (_, alt, src) => `<video controls style="width:100%"><source src="${src}" type="video/mp4" /></video>`
  );
}

// ── Shortcode Converters: Inline HTML (for .md files) ────────────────────────

function convertShortcodesToHtml(content) {
  let result = preProcessContent(content);

  result = result.replace(
    /\{\{<\s*details\s+summary="([^"]*?)"\s*>\}\}([\s\S]*?)\{\{<\s*\/?\s*details\s*>\}\}/g,
    (_, summary, inner) => `<details>\n<summary>${summary}</summary>\n\n${inner.trim()}\n\n</details>`
  );

  result = result.replace(
    /\{\{<\s*imageHighlight\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const alt = attrs.match(/alt="([^"]*?)"/)?.[1] || "";
      const maxWidth = attrs.match(/maxWidth="([^"]*?)"/)?.[1];
      if (src.endsWith(".mov") || src.endsWith(".mp4")) {
        return `<video controls style="width:100%"><source src="${src}" type="video/mp4" /></video>`;
      }
      const style = maxWidth
        ? `max-width:${maxWidth};margin:0 auto;display:block;`
        : `margin-left:-10%;margin-right:-10%;max-width:120%;`;
      return `<img src="${src}" alt="${alt}" style="${style}" />`;
    }
  );

  result = result.replace(
    /\{\{<\s*image-caption\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const alt = attrs.match(/alt="([^"]*?)"/)?.[1] || "";
      const caption = attrs.match(/caption="([^"]*?)"/)?.[1] || "";
      const link = attrs.match(/link="([^"]*?)"/)?.[1];
      const captionHTML = link ? `<a href="${link}">${caption}</a>` : caption;
      return `<figure><img src="${src}" alt="${alt}" style="width:100%;height:auto;" /><figcaption style="text-align:center;font-size:0.9em;color:#666;">${captionHTML}</figcaption></figure>`;
    }
  );

  result = result.replace(
    /\{\{<\s*image-grid\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const i1src = attrs.match(/image1_src="([^"]*?)"/)?.[1] || "";
      const i1alt = attrs.match(/image1_alt="([^"]*?)"/)?.[1] || "";
      const i1cap = attrs.match(/image1_caption="([^"]*?)"/)?.[1] || "";
      const i2src = attrs.match(/image2_src="([^"]*?)"/)?.[1] || "";
      const i2alt = attrs.match(/image2_alt="([^"]*?)"/)?.[1] || "";
      const i2cap = attrs.match(/image2_caption="([^"]*?)"/)?.[1] || "";
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;"><div><p style="text-align:center;font-size:0.9em;color:#666;">${i1cap}</p><img src="${i1src}" alt="${i1alt}" style="width:100%;height:auto;" /></div><div><p style="text-align:center;font-size:0.9em;color:#666;">${i2cap}</p><img src="${i2src}" alt="${i2alt}" style="width:100%;height:auto;" /></div></div>`;
    }
  );

  result = result.replace(
    /\{\{<\s*cite\s+src="([^"]*?)"\s+ref="([^"]*?)"\s*>\}\}/g,
    (_, src, ref) => `<cite><a href="${src}">${ref}</a></cite>`
  );

  result = result.replace(/\{\{<\s*line-break\s*>\}\}/g, "<br />");

  result = result.replace(
    /\{\{<\s*cta-button\s+href="([^"]*?)"\s+text="([^"]*?)"\s*>\}\}/g,
    (_, href, text) =>
      `<div style="margin:2rem 0;text-align:center;"><a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:0.75rem 2rem;border-radius:5px;text-decoration:none;font-weight:bold;font-size:1.1em;">${text}</a></div>`
  );

  result = result.replace(
    /\{\{<\s*video\s+src="([^"]*?)"\s*>\}\}/g,
    (_, src) => `<video controls style="width:100%"><source src="${src}" type="video/mp4" /></video>`
  );

  result = result.replace(
    /\{\{<\s*claude-iframe\s+(.*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/claude-iframe\s*>\}\}/g,
    (_, attrs, inner) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const trimmedInner = inner.trim();
      const innerHTML = trimmedInner ? `<div>${trimmedInner}</div>` : "";
      return `<div style="margin:1.5rem 0;">${innerHTML}<iframe src="${src}" width="100%" height="400" frameborder="0" loading="lazy" title="Claude conversation" style="border:1px solid #ddd;border-radius:8px;"></iframe></div>`;
    }
  );

  return result;
}

// ── Shortcode Converters: Component JSX (for .mdx files) ─────────────────────

function convertShortcodesToComponents(content) {
  let result = preProcessContent(content);

  // details → native HTML (works in MDX if content is safe)
  result = result.replace(
    /\{\{<\s*details\s+summary="([^"]*?)"\s*>\}\}([\s\S]*?)\{\{<\s*\/?\s*details\s*>\}\}/g,
    (_, summary, inner) => `<details>\n<summary>${summary}</summary>\n\n${inner.trim()}\n\n</details>`
  );

  result = result.replace(
    /\{\{<\s*imageHighlight\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const alt = attrs.match(/alt="([^"]*?)"/)?.[1] || "";
      const maxWidth = attrs.match(/maxWidth="([^"]*?)"/)?.[1];
      const mwProp = maxWidth ? ` maxWidth="${maxWidth}"` : "";
      return `<ImageHighlight src="${src}" alt="${alt}"${mwProp} />`;
    }
  );

  result = result.replace(
    /\{\{<\s*image-caption\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const alt = attrs.match(/alt="([^"]*?)"/)?.[1] || "";
      const caption = attrs.match(/caption="([^"]*?)"/)?.[1] || "";
      const link = attrs.match(/link="([^"]*?)"/)?.[1];
      const linkProp = link ? ` link="${link}"` : "";
      return `<ImageCaption src="${src}" alt="${alt}" caption="${caption}"${linkProp} />`;
    }
  );

  result = result.replace(
    /\{\{<\s*image-grid\s+(.*?)\s*>\}\}/g,
    (_, attrs) => {
      const i1src = attrs.match(/image1_src="([^"]*?)"/)?.[1] || "";
      const i1alt = attrs.match(/image1_alt="([^"]*?)"/)?.[1] || "";
      const i1cap = attrs.match(/image1_caption="([^"]*?)"/)?.[1] || "";
      const i2src = attrs.match(/image2_src="([^"]*?)"/)?.[1] || "";
      const i2alt = attrs.match(/image2_alt="([^"]*?)"/)?.[1] || "";
      const i2cap = attrs.match(/image2_caption="([^"]*?)"/)?.[1] || "";
      return `<ImageGrid image1Src="${i1src}" image1Alt="${i1alt}" image1Caption="${i1cap}" image2Src="${i2src}" image2Alt="${i2alt}" image2Caption="${i2cap}" />`;
    }
  );

  result = result.replace(
    /\{\{<\s*cite\s+src="([^"]*?)"\s+ref="([^"]*?)"\s*>\}\}/g,
    (_, src, ref) => `<Cite src="${src}" ref="${ref}" />`
  );

  result = result.replace(/\{\{<\s*line-break\s*>\}\}/g, "<br />");

  result = result.replace(
    /\{\{<\s*cta-button\s+href="([^"]*?)"\s+text="([^"]*?)"\s*>\}\}/g,
    (_, href, text) => `<CtaButton href="${href}" text="${text}" />`
  );

  result = result.replace(
    /\{\{<\s*video\s+src="([^"]*?)"\s*>\}\}/g,
    (_, src) => `<Video src="${src}" />`
  );

  result = result.replace(
    /\{\{<\s*claude-iframe\s+(.*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/claude-iframe\s*>\}\}/g,
    (_, attrs, inner) => {
      const src = attrs.match(/src="([^"]*?)"/)?.[1] || "";
      const id = attrs.match(/id="([^"]*?)"/)?.[1] || "";
      const trimmedInner = inner.trim();
      if (trimmedInner) {
        return `<ClaudeIframe client:visible src="${src}" id="${id}">\n${trimmedInner}\n</ClaudeIframe>`;
      }
      return `<ClaudeIframe client:visible src="${src}" id="${id}" />`;
    }
  );

  return result;
}

// ── MDX post-processing ──────────────────────────────────────────────────────

// ── Find all post directories ────────────────────────────────────────────────

function findPosts(dir) {
  const posts = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "index.md") {
        posts.push(currentDir);
      }
    }
  }

  walk(dir);
  return posts;
}

// ── Copy assets (excluding index.md) ─────────────────────────────────────────

function copyAssets(srcDir, destDir) {
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.name === "index.md") continue;
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      cpSync(srcPath, destPath, { recursive: true });
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

// ── Generate description from content ────────────────────────────────────────

function generateDescription(body) {
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("!") ||
      trimmed.startsWith("<") ||
      trimmed.startsWith("{{") ||
      trimmed.startsWith("```") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("1.")
    )
      continue;
    let desc = trimmed
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\{[^}]*\}/g, "");
    if (desc.length > 20) {
      return desc.length > 200 ? desc.slice(0, 197) + "..." : desc;
    }
  }
  return "A blog post from Puzzmo.";
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("Starting migration from Hugo to Astro...\n");

// Clean existing content
if (existsSync(ASTRO_CONTENT)) {
  // Remove only year directories (migrated content), preserve any non-year files
  for (const entry of readdirSync(ASTRO_CONTENT)) {
    if (/^\d{4}$/.test(entry)) {
      rmSync(join(ASTRO_CONTENT, entry), { recursive: true });
    }
  }
}

const postDirs = findPosts(HUGO_POSTS);
console.log(`Found ${postDirs.length} posts\n`);

let migrated = 0;
let mdxCount = 0;
let errors = [];

for (const postDir of postDirs) {
  const relPath = relative(HUGO_POSTS, postDir);
  const indexPath = join(postDir, "index.md");

  try {
    const raw = readFileSync(indexPath, "utf-8");
    const { data, body } = parseTOMLFrontmatter(raw);

    // Detect shortcodes
    const usedShortcodes = detectShortcodes(body);
    const hasComponentShortcodes = [...usedShortcodes].some(sc => COMPONENT_SHORTCODES.has(sc));
    const contentUnsafe = hasMdxUnsafeContent(body);

    // Use MDX only when we have component shortcodes AND content is MDX-safe
    const needsMdx = hasComponentShortcodes && !contentUnsafe;

    // Build YAML frontmatter
    const yamlData = {
      title: data.title || "Untitled",
      description: generateDescription(body),
      pubDate: data.date,
    };

    if (data.authors) yamlData.authors = data.authors;
    if (data.tags) yamlData.tags = data.tags;
    if (data.theme) yamlData.theme = data.theme;
    if (data.series) yamlData.series = data.series;
    if (data.comments !== undefined) yamlData.comments = data.comments;
    if (data.draft) yamlData.draft = data.draft;

    // Convert shortcodes - use components for MDX, inline HTML for .md
    let convertedBody;
    let imports = "";

    if (needsMdx) {
      convertedBody = convertShortcodesToComponents(body);
      // Deindent <details> blocks that are inside list items
      convertedBody = convertedBody.replace(/^(\s+)(<details>)/gm, "$2");

      const importLines = [];
      for (const sc of usedShortcodes) {
        if (COMPONENT_IMPORTS[sc]) {
          importLines.push(COMPONENT_IMPORTS[sc]);
        }
      }
      if (importLines.length > 0) {
        imports = importLines.join("\n") + "\n\n";
      }
    } else {
      convertedBody = convertShortcodesToHtml(body);
      if (contentUnsafe && hasComponentShortcodes) {
        console.log(`    (MDX-unsafe content, using inline HTML instead of components)`);
      }
    }

    // Write to Astro content directory
    const destDir = join(ASTRO_CONTENT, relPath);
    mkdirSync(destDir, { recursive: true });

    const ext = needsMdx ? "mdx" : "md";
    const yamlFrontmatter = toYAML(yamlData);
    const output = `---\n${yamlFrontmatter}\n---\n\n${imports}${convertedBody}\n`;
    writeFileSync(join(destDir, `index.${ext}`), output);

    // Copy all assets
    copyAssets(postDir, destDir);

    migrated++;
    if (needsMdx) mdxCount++;
    console.log(`  ✓ ${relPath}${needsMdx ? " (mdx)" : ""}`);
  } catch (err) {
    errors.push({ path: relPath, error: err.message });
    console.error(`  ✗ ${relPath}: ${err.message}`);
  }
}

console.log(`\nMigration complete: ${migrated} posts (${mdxCount} mdx, ${migrated - mdxCount} md), ${errors.length} errors`);
if (errors.length > 0) {
  console.log("\nErrors:");
  for (const e of errors) {
    console.log(`  ${e.path}: ${e.error}`);
  }
}
