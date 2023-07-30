import process from "node:process";
import { tinyassert } from "@hiogawa/utils";
import { writeCookieSession } from "./session";

// dump cookie for e2e

async function writeCookieCli(args: string[]) {
  const name = args[0];
  tinyassert(name, "missing 'name'");

  const cookie = await writeCookieSession({ user: { name } });
  process.stdout.write(cookie);
}

function main() {
  const args = process.argv.slice(2);
  writeCookieCli(args);
}

main();
