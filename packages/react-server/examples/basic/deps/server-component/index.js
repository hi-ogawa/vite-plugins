import React from "react";

export async function TestDepServerComponent() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return React.createElement("span", null, "TestDepServerComponent");
}
