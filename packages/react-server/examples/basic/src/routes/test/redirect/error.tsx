"use client";

import { useRouter } from "@hiogawa/react-server/client";
import type { ErrorPageProps } from "@hiogawa/react-server/server";
import React from "react";

export default function ErrorPage(props: ErrorPageProps) {
  // TODO: effect is too late.
  //       can we trigger transition during getDerivedStateFromError?
  const history = useRouter((s) => s.history);

  React.useEffect(() => {
    if (props.serverError?.redirect) {
      history.push(props.serverError?.redirect.location);
    }
  }, [props.serverError?.redirect]);

  return null;
}
