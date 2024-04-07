import { useRouter } from "./router";

// TODO: study prior art
// https://github.com/TanStack/router/blame/a1030ef24de104eb32f7a781cda247458e0ec90a/packages/react-router/src/link.tsx
// https://github.com/remix-run/react-router/blob/9e7486b89e712b765d947297f228650cdc0c488e/packages/react-router-dom/index.tsx#L1394

export function Link(props: JSX.IntrinsicElements["a"] & { href: string }) {
  const history = useRouter((s) => s.history);

  return (
    <a
      {...props}
      onClick={(e) => {
        const target = e.currentTarget.target;
        if (
          e.button === 0 &&
          !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
          (!target || target === "_self")
        ) {
          e.preventDefault();
          history.push(props.href!);
        }
      }}
    />
  );
}

export function LinkForm(
  props: JSX.IntrinsicElements["form"] & { action: string },
) {
  const history = useRouter((s) => s.history);

  return (
    <form
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        // cf. react-router's getFormSubmissionInfo and normalizeNavigateOptions
        // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/react-router-dom/dom.ts#L237
        // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/router/router.ts#L3591-L3639
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        data.forEach((v, k) => {
          if (typeof v === "string") {
            params.set(k, v);
          }
        });
        const href = props.action + `?${params}`;
        history.push(href);
      }}
    />
  );
}
