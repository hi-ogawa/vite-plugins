"use client";

import {
  useParams,
  useRouter,
  useSelectedParams,
} from "@hiogawa/react-server/client";

export function ClientLocation() {
  const location = useRouter((s) => s.location);
  return <>{location.pathname}</>;
}

export function ClientParams() {
  const params = useParams();
  const selectedParams = useSelectedParams();
  return (
    <>
      <pre>useParams: {JSON.stringify(params)}</pre>
      <pre>useSelectedParams: {JSON.stringify(selectedParams)}</pre>
    </>
  );
}
