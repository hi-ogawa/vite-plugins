import { createRoot } from "@remix-run/dom";
import { Root } from "./root";

function main() {
  const el = document.getElementById("root")!;
  createRoot(el).render(<Root />);
}

main();
