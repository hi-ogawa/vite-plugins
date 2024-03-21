// TODO: rsc stream doesn't keep "digest"?
//       for now, we just use Error.message
export function createError(status: number): Error {
  const digest = `__REACT_SERVER_ERROR__:${status}`;
  return Object.assign(new Error(digest), { digest });
}

export function getErrorStatus(error: Error): number | undefined {
  const m = error.message.match(/^__REACT_SERVER_ERROR__:(\d\d\d)$/);
  return m && m[1] ? Number(m[1]) : undefined;
}
