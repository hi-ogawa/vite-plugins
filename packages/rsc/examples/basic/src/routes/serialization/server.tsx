import { testSerializationAction } from "./action";
import { TestSerializationClient } from "./client";

export function TestSerializationServer() {
  const original = <TestSerializationClient action={testSerializationAction} />;
  const deserialized = original;
  return <div>test-serialization:{deserialized}</div>;
}
