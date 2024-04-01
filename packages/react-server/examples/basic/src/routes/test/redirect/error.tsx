"use client";

import { useRouter } from "@hiogawa/react-server/client";
import type { ErrorPageProps } from "@hiogawa/react-server/server";
import React from "react";

const suspensionCache = new WeakMap<Error, Promise<void>>();

export default function ErrorPage(props: ErrorPageProps) {
  const history = useRouter((s) => s.history);
  let suspend = suspensionCache.get(props.error);
  if (!suspend) {
    suspend = new Promise<void>(() => {});
    suspensionCache.set(props.error, suspend);
    const redirectLocation = props.serverError?.redirectLocation;
    if (redirectLocation) {
      setTimeout(() => history.replace(redirectLocation));
    }
  }
  return React.use(suspend);
}
