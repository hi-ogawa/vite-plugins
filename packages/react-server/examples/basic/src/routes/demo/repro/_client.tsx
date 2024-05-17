"use client";

import React from "react";

export function Client1(props: { SomeComp: React.ComponentType }) {
  return (
    <div>
      [Client1] props.SomeComp = <props.SomeComp />
    </div>
  );
}

export function Client2() {
  return <div>[Client2]</div>;
}
