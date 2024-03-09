// TODO(test): browser reload after changing RSC
export function Header() {
  return (
    <div>
      <h4 style={{ display: "flex", gap: "1rem" }}>
        Hello RSC
        <a
          href="https://github.com/hi-ogawa/vite-plugins/pull/172"
          target="_blank"
        >
          Github
        </a>
      </h4>
    </div>
  );
}
