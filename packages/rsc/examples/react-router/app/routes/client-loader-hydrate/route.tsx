// @ts-ignore
import type { Route } from "./+types/route.ts";
import styles from "./styles.module.css";

export function loader() {
  return "hello, world from server loader";
}

export function clientLoader() {
  return "hello, world from client loader";
}

// TODO: this causes error in server-route-module?
// > ReferenceError: clientLoader is not defined
// clientLoader.hydrate = true;

export default function ClientLoaderHydrateRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main>
      <h1 className={styles.heading}>Client loader</h1>
      <p>Loader data: {loaderData}</p>
    </main>
  );
}
