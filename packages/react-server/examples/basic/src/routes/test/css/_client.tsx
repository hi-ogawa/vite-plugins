"use client";

import "./css-client-normal.css";
import cssModule from "./css-client-module.module.css";

export function CssClientNormal() {
  return <div id="css-client-normal">css client normal</div>;
}

export function CssClientModule() {
  return <div className={cssModule.test}>css client module</div>;
}
