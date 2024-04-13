"use client";

export default function Page() {
  return <div>{import.meta.env.SSR ? "server" : "client"}</div>
}
