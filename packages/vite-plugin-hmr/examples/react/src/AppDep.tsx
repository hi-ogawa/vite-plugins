import { AppDepDep } from "./AppDepDep";

export function AppDep1() {
  return <div>AppDep1</div>;
}

export const AppDep2 = () => {
  return (
    <div>
      AppDep2 - <AppDepDep />
    </div>
  );
};
