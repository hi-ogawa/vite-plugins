"use client";

import React from "react";

const MyContext = React.createContext("not-ok");

export function MyContextProvider(props) {
  return React.createElement(
    MyContext.Provider,
    { value: "ok" },
    props.children,
  );
}

// consume own context in client entry
export function TestClient() {
  const value = React.useContext(MyContext);
  return React.createElement("span", null, `[context: ${value}]`);
}
