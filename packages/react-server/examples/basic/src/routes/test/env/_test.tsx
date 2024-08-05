export function getTestEnv() {
  return {
    "import.meta.env.MY_PREFIX_ENV_YES":
      import.meta.env.MY_PREFIX_ENV_YES ?? null,
    "import.meta.env.MY_PREFIX_ENV_NO":
      import.meta.env.MY_PREFIX_ENV_NO ?? null,

    // vite doesn't replace `process.env` by default
    // "process.env.MY_PREFIX_ENV_YES":
    //   globalThis?.process.env.MY_PREFIX_ENV_YES ?? null,
    // "process.env.MY_PREFIX_ENV_NO":
    //   globalThis?.process.env.MY_PREFIX_ENV_NO ?? null,
  };
}
