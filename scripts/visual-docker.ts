import { spawnSync } from "node:child_process";

const IMAGE = "spidey-visual";
const BASELINES_DIR = `${process.cwd()}/test/visual/baselines`;
const RESULTS_DIR = `${process.cwd()}/test-results`;

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("docker", ["build", "--platform", "linux/amd64", "-f", "Dockerfile.visual", "-t", IMAGE, "."]);

run("docker", [
  "run",
  "--rm",
  "--platform",
  "linux/amd64",
  "-v",
  `${BASELINES_DIR}:/app/test/visual/baselines`,
  "-v",
  `${RESULTS_DIR}:/app/test-results`,
  IMAGE,
]);
