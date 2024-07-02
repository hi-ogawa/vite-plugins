import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";

export function createEditor(filepath: string) {
  const init = readFileSync(filepath, "utf-8");
  return {
    edit(editFn: (data: string) => string) {
      const next = editFn(init);
      writeFileSync(filepath, next);
    },
    [Symbol.dispose]() {
      writeFileSync(filepath, init);
    },
  };
}

export async function runCommand(command: string, ...args: string[]) {
  const proc = spawn(command, args, {
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: undefined,
    },
  });

  let stdout = "";
  let stderr = "";
  proc.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  proc.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  const code = await new Promise<number>((resolve, reject) => {
    proc.once("close", (code) => {
      if (code === null) {
        reject(new Error("exit null"));
      } else {
        resolve(code);
      }
    });

    proc.once("error", (error) => {
      reject(error);
    });
  });

  return { code, stdout, stderr };
}
