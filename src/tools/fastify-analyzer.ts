import * as fs from "fs";
import * as path from "path";

export function analyzeFastifySource(fastifyPath: string): string {
  const sourcePath = path.join(
    process.cwd(),
    "analysis/fastify-source",
    fastifyPath
  );

  return fs.readFileSync(sourcePath, "utf8");
}
