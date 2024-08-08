export function getTestEnv() {
  return {
    NEXT_PUBLIC_ENV_TEST: process.env.NEXT_PUBLIC_ENV_TEST ?? null,
    ENV_TEST_SECRET: process.env.ENV_TEST_SECRET ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  };
}
