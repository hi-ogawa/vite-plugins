import "./install-polyfill";
import process from "node:process";
import { TinyCli, arg, tinyCliMain } from "@hiogawa/tiny-cli";
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
  },
);

// main
tinyCliMain(cli);
