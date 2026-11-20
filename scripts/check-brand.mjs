#!/usr/bin/env node
/**
 * Guards the final spec: fails if the old working name or any Supabase
 * Storage usage appears in source, config or docs.
 *   npm run check:brand
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP = new Set(["node_modules", ".next", ".git", "scripts"]);
const EXT = /\.(ts|tsx|js|mjs|json|md|sql|css|svg|example|txt|toml|yml|yaml)$|^\.env/;

const RULES = [
  { name: "old brand name", re: /masala\s*desk|masaala\s*desk|মাসয়ালা ডেস্ক|মাসআলা ডেস্ক/i },
  { name: "Supabase Storage", re: /\.storage\s*\.\s*from\(|supabase[-_ ]?storage|storage\.buckets|storage\.objects/i },
];

const hits = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { walk(path); continue; }
    if (!EXT.test(name)) continue;
    readFileSync(path, "utf8").split("\n").forEach((line, i) => {
      for (const rule of RULES) {
        if (rule.re.test(line) && !line.includes("check-brand: allow")) {
          hits.push(`${relative(ROOT, path)}:${i + 1}  [${rule.name}]  ${line.trim()}`);
        }
      }
    });
  }
})(ROOT);

if (hits.length) {
  console.error("✗ Spec violations found:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("✓ No old brand name and no Supabase Storage usage found.");
