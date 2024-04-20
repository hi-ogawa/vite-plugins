const ACTION_ID_HEADER = "x-server-action-id";

export function wrapStreamActionRequest(id: string) {
  return { [ACTION_ID_HEADER]: id };
}

export function unwrapStreamActionRequest(request: Request) {
  const id = request.headers.get(ACTION_ID_HEADER);
  if (id) {
    return { id };
  }
  return false;
}
