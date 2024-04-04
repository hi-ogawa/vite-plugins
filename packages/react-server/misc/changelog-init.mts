import { $ as $_ } from "execa";
import { groupBy } from "@hiogawa/utils";

/*
script to initially setup CHANGELOG.md
npx tsx packages/react-server/misc/changelog-init.mts > packages/react-server/CHANGELOG.md
*/

const $ = $_({ verbose: true });

async function main() {
  // https://github.com/unjs/changelogen/blob/42972f29e6d2c178fe27c8fad1e894858fab220a/src/git.ts#L62
  // https://git-scm.com/docs/pretty-formats
  const gitLog =
    await $`git --no-pager log --pretty=---START---%H---SEP---%s packages/react-server`;

  interface LogEntry {
    hash: string;
    subject: string;
    version: string;
  }

  const entries: LogEntry[] = gitLog.stdout
    .split("---START---")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) =>
      v
        .trim()
        .split("---SEP---")
        .map((v) => v.trim()),
    )
    .map(([hash, subject]) => ({ hash, subject, version: "(none)" }));

  // check package.json version
  for (const e of entries) {
    try {
      const gitShow =
        await $`git show ${e.hash}:packages/react-server/package.json`;
      e.version = JSON.parse(gitShow.stdout).version;
    } catch (e) {}
  }

  // group by version
  const groups = groupBy(entries, (e) => e.version);

  let result = "# Changelog\n\n";

  for (const [version, group] of groups) {
    result += `## v${version}\n\n`;
    for (const e of group) {
      result += "- " + formatPullRequestUrl(e.subject) + "\n";
    }
    result += "\n";
  }

  console.log(result);
}

function formatPullRequestUrl(s: string) {
  // format PR url
  //   (#184) -> ([#184](https://github.com/hi-ogawa/vite-plugins/pull/184))
  return s.replace(
    /\(#(\d+)\)/,
    "([#$1](https://github.com/hi-ogawa/vite-plugins/pull/$1))",
  );
}

main();
