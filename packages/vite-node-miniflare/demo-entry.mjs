export default {
  fetch(request, env, ctx) {
    console.log(env);
    return new Response("hello" + env.SOME_VAR);
  },
};
