import type { Metadata } from "@hiogawa/react-server/server";

export const metadata: Metadata = {
  title: "test-metadata",
};

export default function Layout() {
  return (
    <div className="p-2">
      <h3 className="font-bold">Test Metadata</h3>
    </div>
  );
}
