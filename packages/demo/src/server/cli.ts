import process from "node:process";
import { tinyassert } from "@hiogawa/utils";
import { writeCookieSession } from "./session";

//
// dump session cookie for e2e
// e.g.
//   __session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJoZXkifX0.QeAtDpyeXxCDvd3sNOQbxg_RnZxhQBiDUanAow-k0FI; Path=/; HttpOnly; Secure; SameSite=Lax
async function getSessionCookie(args: string[]) {
  const name = args[0];
  tinyassert(name, "missing 'name'");

  const cookie = await writeCookieSession({ user: { name } });
  process.stdout.write(cookie);
}

//
// main
//
const COMMAND_MAP = new Map([getSessionCookie].map((f) => [f.name, f]));

function main() {
  const [command, ...args] = process.argv.slice(2);
  const commandFn = command && COMMAND_MAP.get(command);
  if (!commandFn) {
    console.error(`invalid command: ${command ?? '""'}`);
    console.error("availble command:", ...COMMAND_MAP.keys());
    process.exit(1);
  }
  commandFn(args);
}

main();
