import { exec } from "node:child_process";
import { promisify } from "node:util";
import { TinyCliCommand, arg, tinyCliMain } from "@hiogawa/tiny-cli";
import process from "node:process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import fs from "node:fs";

const $ = promisify(exec);

/*

npx tsx misc/changelog.mts --dir packages/react-server

TODO
- choose bump prompt
- choose dir from workspaces via prompt
- commit prompt
*/

const cli = new TinyCliCommand(
  {
    program: "changelog",
    args: {
      from: arg.string("(default: last commit modified CHANGELOG.md", {
        optional: true,
      }),
      to: arg.string("(default: HEAD)", { default: "HEAD" }),
      dir: arg.string("(default: process.cwd())", { default: process.cwd() }),
      dry: arg.boolean(),
      keepScope: arg.boolean(),
    },
  },
  async ({ args }) => {
    // find last commit modified changelog
    const changelogPath = resolve(args.dir, "CHANGELOG.md");
    if (!args.from && existsSync(changelogPath)) {
      const { stdout } = await $(`git log --pretty=%H -n 1 ${changelogPath}`, {
        cwd: args.dir,
      });
      args.from = stdout.trim();
    }

    // collect git logs
    const entries = await getGitlogs(args);

    // format markdown
    let result = "## v?.?.?\n\n";
    for (const e of entries) {
      result += "- " + formatMessage(e.subject, args) + "\n";
    }
    result += "\n";

    // update changelog
    let header = `# Changelog\n\n`;
    let prev = "";
    if (existsSync(changelogPath)) {
      header = await fs.promises.readFile(changelogPath, "utf-8");
      const m = header.match(/##/);
      if (m) {
        prev = header.slice(m.index);
        header = header.slice(0, m.index);
      }
    }
    const changelogContent = header + result + prev;
    if (args.dry) {
      console.log(changelogContent);
    } else {
      await fs.promises.writeFile(changelogPath, changelogContent);
    }
  },
);

interface GitLogEntry {
  hash: string;
  subject: string;
}

async function getGitlogs(opts: {
  from?: string;
  to: string;
  dir: string;
}): Promise<GitLogEntry[]> {
  // https://github.com/unjs/changelogen/blob/42972f29e6d2c178fe27c8fad1e894858fab220a/src/git.ts#L62
  // https://git-scm.com/docs/pretty-formats
  const range = [opts.from, opts.to].filter(Boolean).join("...");
  const { stdout } = await $(
    `git --no-pager log ${range} --pretty=---START---%H---SEP---%s .`,
    { cwd: opts.dir },
  );
  return stdout
    .split("---START---")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) =>
      v
        .trim()
        .split("---SEP---")
        .map((v) => v.trim()),
    )
    .map(([hash, subject]) => ({ hash, subject }));
}

function formatMessage(s: string, opts: { keepScope: boolean }) {
  // format PR url
  //   (#184)  ⇒  ([#184](https://github.com/hi-ogawa/vite-plugins/pull/184))
  s = s.replace(
    /\(#(\d+)\)/,
    "([#$1](https://github.com/hi-ogawa/vite-plugins/pull/$1))",
  );
  // remove scope
  //   feat(react-server): ...  ⇒  feat: ...
  if (opts.keepScope) {
    s = s.replace(/^(\w+)(\([^)]*\))/, "$1");
  }
  return s;
}

tinyCliMain(cli);
