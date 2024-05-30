"use client";

import React from "react";
import { Client2Context } from "./_client2";

export function Client1() {
  const context = React.useContext(Client2Context);
  return <>Client2Context [{context}]</>;
}
