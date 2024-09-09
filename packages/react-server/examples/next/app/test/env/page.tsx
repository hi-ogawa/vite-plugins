export default function Page() {
  return (
    <div style={{ padding: 4 }}>
      <h4>process.env</h4>
      <pre data-testid="process.env">
        {JSON.stringify(
          {
            SECRET_ENV_TEST: process.env.SECRET_ENV_TEST ?? null,
            NEXT_PUBLIC_ENV_TEST: process.env.NEXT_PUBLIC_ENV_TEST ?? null,
            VITE_ENV_TEST: process.env.VITE_ENV_TEST ?? null,
          },
          null,
          2,
        )}
      </pre>
      <h4>import.meta.env</h4>
      <pre data-testid="import.meta.env">
        {JSON.stringify(
          {
            SECRET_ENV_TEST: import.meta.env.SECRET_ENV_TEST ?? null,
            NEXT_PUBLIC_ENV_TEST: import.meta.env.NEXT_PUBLIC_ENV_TEST ?? null,
            VITE_ENV_TEST: import.meta.env.VITE_ENV_TEST ?? null,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
