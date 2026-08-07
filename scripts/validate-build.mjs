import fs from "node:fs/promises";

const required = [
  "public/index.html",
  "public/enhancements.css",
  "public/app-enhancements.js",
  "public/data/latest-export.json"
];

for (const file of required) {
  await fs.access(file);
}

const snapshot = JSON.parse(await fs.readFile("public/data/latest-export.json", "utf8"));
if (!Array.isArray(snapshot.assets) || snapshot.assets.length === 0) {
  throw new Error("Latest export has no market data rows");
}

const page = await fs.readFile("public/index.html", "utf8");
for (const requiredText of ["data-page=\"countries\"", "data-page=\"country\"", "data-page=\"updates\"", "id=\"refresh-number\""]) {
  if (!page.includes(requiredText)) throw new Error(`Dashboard UI is missing ${requiredText}`);
}

console.log(`Static dashboard ready with ${snapshot.assets.length} market rows.`);
