#!/usr/bin/env node
/**
 * build-site.mjs — assemble the landing page into dist/.
 *
 * 1. Reads site/index.html and site/content.md.
 * 2. Parses "### key" blocks from the Markdown.
 * 3. Renders each block with a minimal, escaped Markdown subset.
 * 4. Injects each rendered block into the element marked
 *    data-content="key" in the HTML.
 * 5. Computes the sha256 hash of the final inline script and
 *    substitutes it into the CSP meta placeholder.
 * 6. Writes dist/index.html and copies site/fonts/, site/assets/, site/media/,
 *    and (if present) site/_redirects and site/_headers into dist/.
 *
 * Plain Node >= 20, no dependencies. Exits non-zero on any failure.
 */

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const distDir = join(root, "dist");

function fail(message) {
  console.error(`build-site: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`build-site: warning: ${message}`);
}

/** Read a required file or exit non-zero. */
function readRequired(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}

/** Parse "### key" blocks into { key: markdownText }. */
function parseBlocks(md) {
  const blocks = {};
  let key = null;
  let buf = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^###\s+([\w.-]+)\s*$/);
    if (m) {
      if (key !== null) blocks[key] = buf.join("\n").trim();
      key = m[1];
      buf = [];
    } else if (key !== null) {
      buf.push(line);
    }
  }
  if (key !== null) blocks[key] = buf.join("\n").trim();
  return blocks;
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/**
 * Only these URL shapes become real links; anything else stays plain text.
 * The root-relative branch rejects "//" and "/\" so protocol-relative
 * URLs cannot masquerade as same-origin links.
 */
const SAFE_HREF = /^(https?:|mailto:|#|\/(?![/\\]))/i;

/**
 * Minimal Markdown subset -> HTML: paragraphs, "- " bullets, **bold**,
 * *italic*, `code`, [text](url). Input is HTML-escaped first.
 */
function renderMarkdown(src) {
  const paragraphs = src
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n");
      const isList = lines.every((l) => /^\s*-\s+/.test(l) || l.trim() === "") && /^\s*-\s+/.test(lines[0]);
      let h = isList
        ? lines
            .filter((l) => l.trim())
            .map((l) => "• " + escapeHtml(l.replace(/^\s*-\s+/, "")))
            .join("<br>")
        : escapeHtml(lines.join(" "));
      h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
      h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
      h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text, url) => {
        if (!SAFE_HREF.test(url)) return `${text} (${url})`;
        const ext = /^https?:/i.test(url);
        return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
      });
      return h;
    });
  return paragraphs.join("<br><br>");
}

/**
 * Replace the inner HTML of every element carrying data-content="key".
 * Assumes those elements contain no nested element of the same tag name
 * (true for this page: they hold text only).
 */
function injectBlocks(html, blocks) {
  const elementKeys = new Set();
  const out = html.replace(
    /<([a-z][\w-]*)((?:[^<>]*?)\bdata-content="([\w.-]+)"[^<>]*)>([\s\S]*?)<\/\1>/g,
    (match, tag, attrs, key, inner) => {
      elementKeys.add(key);
      if (/</.test(inner)) {
        fail(`element data-content="${key}" contains nested markup; data-content elements must hold text only`);
      }
      if (!(key in blocks)) return match; // keep built-in copy
      return `<${tag}${attrs}>${renderMarkdown(blocks[key])}</${tag}>`;
    },
  );
  for (const key of Object.keys(blocks)) {
    if (!elementKeys.has(key)) warn(`content.md block "${key}" has no matching data-content element`);
  }
  for (const key of elementKeys) {
    if (!(key in blocks)) warn(`element data-content="${key}" has no block in content.md; keeping built-in copy`);
  }
  return out;
}

/** Hash the (single) inline script and fill the CSP placeholder. */
function applyCspHash(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1) fail(`expected exactly 1 inline script, found ${scripts.length}`);
  const hash = createHash("sha256").update(scripts[0][1], "utf8").digest("base64");
  if (!html.includes("__CSP_SCRIPT_HASH__")) fail("CSP placeholder __CSP_SCRIPT_HASH__ not found");
  return html.replaceAll("__CSP_SCRIPT_HASH__", hash);
}

// ---- Build ----
const htmlPath = join(siteDir, "index.html");
const contentPath = join(siteDir, "content.md");

let html = readRequired(htmlPath);
const blocks = parseBlocks(readRequired(contentPath));
if (Object.keys(blocks).length === 0) fail(`no "### key" blocks found in ${contentPath}`);

html = injectBlocks(html, blocks);
html = applyCspHash(html);

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, "index.html"), html);

for (const dir of ["fonts", "assets", "media"]) {
  const from = join(siteDir, dir);
  if (!existsSync(from)) fail(`missing required directory ${from}`);
  cpSync(from, join(distDir, dir), { recursive: true });
}
for (const file of ["_redirects", "_headers"]) {
  const from = join(siteDir, file);
  if (existsSync(from)) cpSync(from, join(distDir, file));
}

console.log(`build-site: wrote dist/index.html (${html.length} bytes, ${Object.keys(blocks).length} content blocks)`);
