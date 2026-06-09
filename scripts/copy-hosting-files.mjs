import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const files = [
  { from: "public/.htaccess", to: "dist/.htaccess" },
  { from: "public/web.config", to: "dist/web.config" },
];

for (const file of files) {
  await mkdir(dirname(file.to), { recursive: true });
  await copyFile(file.from, file.to);
}

console.log("Hosting files copied to dist.");