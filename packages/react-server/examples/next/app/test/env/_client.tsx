"use client";

import { getTestEnv } from "./_test";

export function TestEnvClient() {
  return <>{JSON.stringify(getTestEnv())}</>;
}
