import React from "react";
import { RouterProvider } from "react-router";

// quick-and-dirty patch to access `isPending` state

export function RouterProviderWithTransition(
  props: React.ComponentProps<typeof RouterProvider>
) {
  const [isPending, startTransition] = React.useTransition();
  return (
    <IsPendingContext.Provider value={isPending}>
      <RouterProvider
        {...props}
        {...{ PATCH_startTransition: startTransition }}
      />
    </IsPendingContext.Provider>
  );
}

const IsPendingContext = React.createContext(false);

export function useIsPending() {
  return React.useContext(IsPendingContext);
}
