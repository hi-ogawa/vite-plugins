import "./install-polyfill";
import process from "node:process";
import { TinyCli, TinyCliParseError, arg } from "@hiogawa/tiny-cli";
import { formatError } from "@hiogawa/utils";
import { writeCookieSession } from "./session";

const cli = new TinyCli();

//
// dump session cookie for e2e
// e.g.
//   __session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Im5hbWUiOiJoZXkifX0.QeAtDpyeXxCDvd3sNOQbxg_RnZxhQBiDUanAow-k0FI; Path=/; HttpOnly; Secure; SameSite=Lax

cli.defineCommand(
  {
    name: "getSessionCookie",
    args: {
      name: arg.string("session user name", { positional: true }),
    },
  },
  async ({ args }) => {
    const cookie = await writeCookieSession({ user: { name: args.name } });
    process.stdout.write(cookie);
  }
);

//
// main
//

async function main() {
  try {
    await cli.parse(process.argv.slice(2));
  } catch (e) {
    console.error(formatError(e));
    if (e instanceof TinyCliParseError) {
      console.error("See '--help' for more info.");
    }
    process.exit(1);
  }
}

main();
