import data from "./data.bin" with { type: "bytes" };

function main() {
  const decoded = new TextDecoder().decode(data);
  document.getElementById("app")!.textContent = `data.bin: ${decoded}`;
}

main();
