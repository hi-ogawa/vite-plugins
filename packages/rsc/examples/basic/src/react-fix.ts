import React from "react";

// TODO
// dedicated vite server for RSC
// https://github.com/facebook/react/pull/27436
// https://github.com/facebook/react/issues/27478
Object.assign(
  // @ts-ignore
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  // @ts-ignore
  React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
);
