"use client";

import styles from "./style.module.css";

export default function ErrorPage(props: any) {
  return (
    <h1 id="not-found-component" className={styles.red}>
      Error: {props.serverError?.status}
    </h1>
  );
}
