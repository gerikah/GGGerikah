import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";

const source = readFileSync("frontend/design/opendesign/index.html", "utf8");
const css = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if (!css) throw new Error("OpenDesign stylesheet is missing");
const tree = postcss.parse(css);

// Split selector lists without splitting the arguments of :where() or attributes.
function selectors(value) {
  const parts = []; let depth = 0; let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(" || value[i] === "[") depth++;
    if (value[i] === ")" || value[i] === "]") depth--;
    if (value[i] === "," && depth === 0) { parts.push(value.slice(start, i)); start = i + 1; }
  }
  parts.push(value.slice(start)); return parts;
}

tree.walkRules(rule => {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === "atrule" && parent.name.endsWith("keyframes")) return;
    parent = parent.parent;
  }
  rule.selector = selectors(rule.selector).map(raw => {
    let selector = raw.trim();
    if (/^(:root|html|body)(?=$|[.\s:])/.test(selector)) return selector.replace(/^(:root|html|body)/, ".od-public");
    if (selector.startsWith(".js ")) return selector.replace(/^\.js/, ".od-public.is-enhanced");
    if (selector.startsWith(".intro-on ")) return selector.replace(/^\.intro-on/, ".od-public.intro-on");
    return `.od-public ${selector}`;
  }).join(", ");
});

writeFileSync("frontend/styles/opendesign.css", `/* Faithfully extracted and scoped from frontend/design/opendesign/index.html.\n * Run node scripts/adopt-opendesign.mjs after changes to the source handoff.\n * App-specific image and accessibility adaptations live in opendesign-adaptations.css. */\n${tree.toString().trimEnd()}\n`);
console.log("Extracted OpenDesign tokens, layout, states, motion, and all responsive rules.");
