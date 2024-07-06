import { Tweet } from "react-tweet";

export default function Page() {
  return (
    <div className="flex flex-col items-start">
      <a
        className="text-lg font-bold antd-link"
        href="https://github.com/vercel/react-tweet"
        target="_blank"
      >
        vercel/react-tweet
      </a>
      <Tweet id="1725168756454785119" />
    </div>
  );
}
