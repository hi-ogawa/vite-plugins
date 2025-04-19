// import type { Route } from "./+types/home";
namespace Route {
  export type LoaderArgs = any;
  export type ComponentProps = any;
}

import { log } from "./home.actions.ts";

export function loader({}: Route.LoaderArgs) {
  return "hello, world";
}

export default function ServerComponent({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <h1>Home</h1>
      <p>This is the home page.</p>
      <p>loaderData: {loaderData}</p>
      <form action={log}>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
