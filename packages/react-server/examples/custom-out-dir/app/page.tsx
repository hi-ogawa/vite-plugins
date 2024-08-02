function page() {
  const outDir = import.meta.env.VITE_E2E_OUT_DIR;
  return (
    <div>
      <h1>Hello from custom out dir!</h1>
      {outDir && <pre>{outDir}</pre>}
    </div>
  );
}

export default page;
