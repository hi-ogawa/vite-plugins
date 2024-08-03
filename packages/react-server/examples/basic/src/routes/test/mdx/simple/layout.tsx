import React from "react";
import "./style.css";

export default function Layout(props: React.PropsWithChildren) {
  return <div className="vp-doc">{props.children}</div>;
}
