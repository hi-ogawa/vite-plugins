"use client";

import React from "react";
import { useNavigate } from "react-router";

export function ServerHmr() {
  if (import.meta.hot) {
    const hot = import.meta.hot;
    const navigate = useNavigate();
    React.useEffect(() => {
      const refetch = () =>
        navigate(window.location.pathname, { replace: true });
      hot.on("rsc:update", refetch);
      return () => {
        hot.off("rsc:update", refetch);
      };
    }, [navigate]);
  }
  return null;
}
