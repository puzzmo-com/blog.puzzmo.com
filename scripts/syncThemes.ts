/**
 deno run scripts/syncThemes.ts

 only works for puzzmo folks, because it requires an internal submodule in the app repo
 */

import { themes } from "../../app/src/shared/themes.ts";

for (const theme of themes) {
    const vars = Object.entries(theme).map(([key, value]) => `--theme-${key}: "${value}";`).join("\n");
    const css = `:root {\n${vars}\n}`;
    const path = `assets/themes/${slugify(theme.name)}.css`;
    Deno.writeTextFileSync(path, css, { create: true });
}


function slugify (text: string) {
  return  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    
}