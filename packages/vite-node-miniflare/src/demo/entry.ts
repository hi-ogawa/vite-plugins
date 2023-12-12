export default {
  async fetch(_request: Request, _env: any) {
    return new Response("hello from workerd");
  }
}
