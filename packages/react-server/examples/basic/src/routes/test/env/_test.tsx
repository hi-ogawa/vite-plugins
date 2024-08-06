export function getTestEnv() {
  return {
    MY_PREFIX_ENV_TEST: import.meta.env.MY_PREFIX_ENV_TEST ?? null,
    VITE_ENV_TEST: import.meta.env.VITE_ENV_TEST ?? null,
    OTHER_ENV_TEST: import.meta.env.OTHER_ENV_TEST ?? null,
  };
}
