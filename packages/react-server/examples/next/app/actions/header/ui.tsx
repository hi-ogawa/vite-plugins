"use client";

import { useState } from "react";

export default function UI({
  getCookie,
  getHeader,
  setCookie,
  setCookieAndRedirect,
  getAuthedUppercase,
}: any) {
  const [result, setResult] = useState("");

  return (
    <div>
      <h1>{result}</h1>
      <button
        id="cookie"
        onClick={async () => {
          // set cookie
          const random = Math.random();
          document.cookie = `random=${random}`;
          const res = await getCookie("random");
          setResult(random + ":" + res.value);
        }}
      >
        getCookie
      </button>
      <button
        id="setCookie"
        onClick={async () => {
          // set cookie on server side
          const random = Math.random();
          const res = await setCookie("random-server", random);
          setResult(
            random +
              ":" +
              res.value +
              ":" +
              document.cookie.match(/random-server=([^;]+)/)?.[1],
          );
        }}
      >
        setCookie
      </button>
      <button
        id="header"
        onClick={async () => {
          const res = await getHeader("User-Agent");
          setResult(res);
        }}
      >
        getHeader
      </button>
      <button
        id="authed"
        onClick={async () => {
          // TODO: propagate action error to client?
          // https://github.com/hi-ogawa/vite-plugins/issues/387
          try {
            const res = await getAuthedUppercase("hello, world");
            setResult(res);
          } catch (err: any) {
            setResult("Error: " + err.message);
          }
        }}
      >
        getAuthedUppercase
      </button>
      <form>
        <button
          id="setCookieAndRedirect"
          formAction={async () => {
            await setCookieAndRedirect(
              "redirect",
              Math.random().toString(36).substring(7),
              "/actions/redirect-target",
            );
          }}
        >
          setCookieAndRedirect
        </button>
      </form>
    </div>
  );
}
