import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { type ActionFunctionArgs, json } from "@remix-run/server-runtime";

const kvKey = "counter";

export async function loader() {
  const value = await env.kv.get(kvKey);
  return json({ value: Number(value) });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const delta = Number(formData.get("delta"));
  const value = await env.kv.get(kvKey);
  await env.kv.put(kvKey, String(Number(value) + delta));
  return json(null);
}

export default function CounterRoute() {
  const { value } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";

  return (
    <div>
      <h2>KV Demo</h2>
      <pre>counter = {value}</pre>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Form method="POST">
          <input name="delta" value="-1" type="hidden" />
          <button disabled={loading}>-1</button>
        </Form>
        <Form method="POST">
          <input name="delta" value="+1" type="hidden" />
          <button disabled={loading}>+1</button>
        </Form>
        {loading && <span>(loading...)</span>}
      </div>
    </div>
  );
}
