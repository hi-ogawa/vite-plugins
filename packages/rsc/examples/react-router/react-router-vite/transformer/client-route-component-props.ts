import {
  useActionData,
  useLoaderData,
  useMatches,
  useParams,
  useRouteError,
} from "react-router";

export const useComponentProps = () => ({
  loaderData: useLoaderData(),
  actionData: useActionData(),
  params: useParams(),
  matches: useMatches(),
});

export const useHydrateFallbackProps = () => ({
  loaderData: useLoaderData(),
  actionData: useActionData(),
  params: useParams(),
});

export const useErrorBoundaryProps = () => ({
  loaderData: useLoaderData(),
  actionData: useActionData(),
  params: useParams(),
  error: useRouteError(),
});
