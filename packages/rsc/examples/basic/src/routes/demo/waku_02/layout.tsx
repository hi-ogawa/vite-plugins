export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-lg">
        Pokemon demo ported from{" "}
        <a
          className="antd-link"
          href="https://github.com/dai-shi/waku/tree/bdcb7b26ef8c69d95eae44cd9f46841fd4a82631/examples/02_demo"
          target="_blank"
        >
          Waku
        </a>
      </h2>
      {props.children}
    </div>
  );
}
