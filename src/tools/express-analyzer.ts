import * as fs from "fs";
import * as path from "path";

export function analyzeExpressSource(expressPath: string): string {
  const sourcePath = path.join(
    process.cwd(),
    "analysis/express-source",
    expressPath
  );

  return fs.readFileSync(sourcePath, "utf8");
}
