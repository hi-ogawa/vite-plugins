// TODO: maybe unocss is processing all css into one?
import "./css-split.css";
import classes from "./css-split.module.css";

export function Component() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">css code-split test</div>
      <div id="css-split-red">css-split-red</div>
      <div id="css-split-blue">css-split-blue</div>
      <div className={classes["css-split-red"]}>css-split-red</div>
      <div className={classes["css-split-blue"]}>css-split-blue</div>
    </div>
  );
}
