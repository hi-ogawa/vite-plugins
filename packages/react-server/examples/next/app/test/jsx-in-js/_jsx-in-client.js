"use client";

import React from "react";

export default function JsxInJs() {
  const [state] = React.useState("JsxInJs");
  return <>{state}</>;
}
