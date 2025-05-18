// @ts-ignore
import type { Route } from "./+types/route.ts";
import styles from "./styles.module.css";

// TODO: how to do hdr?
export function loader() {
  return "hello, world from server loader";
}

export default function ServerLoaderRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main>
      <h1 className={styles.heading}>Server loader</h1>
      <p>Loader data: {loaderData}</p>
    </main>
  );
}
