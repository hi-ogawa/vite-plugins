import { GlobalProgress } from "./global-progress";

export function Header() {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-bold">RSC Experiment</h1>
      <a
        className="antd-link i-ri-github-line w-6 h-6"
        href="https://github.com/hi-ogawa/vite-plugins/tree/main/packages/react-server"
        target="_blank"
      />
      <GlobalProgress />
    </div>
  );
}
