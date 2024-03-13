"use client";

import { Link as Link2 } from "@hiogawa/react-server/client2";

export const Link = Link2;

// import { __history } from "../lib/csr";

// export function Link(props: JSX.IntrinsicElements["a"] & { href: string }) {
//   return (
//     <a
//       {...props}
//       onClick={(e) => {
//         e.preventDefault();
//         __history.push(props.href!);
//       }}
//     />
//   );
// }
