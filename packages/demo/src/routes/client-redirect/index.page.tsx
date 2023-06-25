import { Link } from "react-router-dom";

export function Page() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Client redirect</h1>
          <div className="flex gap-2">
            <Link
              className="antd-btn antd-btn-default px-1"
              to="/client-redirect/good"
            >
              good link
            </Link>
            <Link
              className="antd-btn antd-btn-default px-1"
              to="/client-redirect/forbidden"
            >
              forbidden link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
