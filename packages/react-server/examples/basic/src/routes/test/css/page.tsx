import "./css-normal.css";
import { CssClientModule, CssClientNormal } from "./_client";
import cssModule from "./css-module.module.css";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div id="css-normal">css normal</div>
        <div className={cssModule.test}>css module</div>
        <CssClientNormal />
        <CssClientModule />
      </div>
    </div>
  );
}
