"use client";

import React from "react";

// test case to verify this module won't get "dual-package"-ed when
// - imported by server component and
// - imported by client component

// imported by _client1.tsx
export const Client2Context = React.createContext("not-ok");

// imported by page.tsx
export function Client2Provider(props: React.PropsWithChildren) {
  return (
    <Client2Context.Provider value="ok">
      {props.children}
    </Client2Context.Provider>
  );
}
