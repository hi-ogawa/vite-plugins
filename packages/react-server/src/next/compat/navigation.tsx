import React from "react";
import { useRouter } from "../../client";

export function useSearchParams() {
  const search = useRouter((s) => s.location.search);
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function usePathname() {
  return useRouter((s) => s.location.pathname);
}

/** @todo */
export function useParams() {}

/** @todo */
export function useSelectedLayoutSegments() {}

/** @todo */
function useNextRouter() {}

export { useNextRouter as useRouter };

export type * from "./navigation.react-server";
