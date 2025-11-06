import data from "./data.bin" with { type: "bytes" };

async function main() {
  document.getElementById("app")!.textContent =
    `data.bin: ${new TextDecoder().decode(data)}`;

  const dynamic = await import("./dynamic.bin", { with: { type: "bytes" } });
  document.getElementById("app")!.textContent +=
    `, dynamic.bin: ${new TextDecoder().decode(dynamic.default)}`;
}

main();
