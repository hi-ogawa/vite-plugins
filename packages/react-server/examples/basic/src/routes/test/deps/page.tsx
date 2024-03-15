import { TestDepUseClient } from "@hiogawa/test-dep-use-client";

export default function Page() {
  return (
    <div>
      <h4 className="font-bold">Test Dependencies</h4>
      <div>
        <TestDepUseClient />
      </div>
    </div>
  );
}
