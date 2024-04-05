"use client";

import React from "react";

export function Test(props: any) {
  React.useEffect(() => {
    console.log(props);
  });
  return <div>test</div>;
}
