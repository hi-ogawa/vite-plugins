"use client";

import React from "react";

export function ClinetPage() {
  React.useEffect(() => {
    throw new Error("boom!");
  }, []);
  return <div>Error on Effect</div>;
}
