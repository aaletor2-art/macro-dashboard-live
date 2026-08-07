import fs from "node:fs/promises";

const required = [
  "public/index.html",
  "public/data/latest-export.json"
];

for (const file of required) {
  await fs.access(file);
}

const snapshot = JSON.parse(await fs.readFile("public/data/latest-export.json", "utf8"));
if (!Array.isArray(snapshot.assets) || snapshot.assets.length === 0) {
  throw new Error("Latest export has no market data rows");
}

console.log(`Static dashboard ready with ${snapshot.assets.length} market rows.`);
