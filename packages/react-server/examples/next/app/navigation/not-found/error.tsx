"use client";

import type { ErrorPageProps } from "@hiogawa/react-server/server";
import styles from "./style.module.css";

export default function ErrorPage(props: ErrorPageProps) {
  return (
    <h1 id="not-found-component" className={styles.red}>
      Error: {props.serverError?.status}
    </h1>
  );
}
