import { LinkInClientComponent } from "./client";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold">Other Page</h4>
      <div>
        <LinkInClientComponent />
      </div>
    </div>
  );
}
