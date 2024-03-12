import { getCounter, hello } from "./action";
import {
  ClientFormImportAction,
  ClientFormPropAction,
  Counter,
} from "./client";

export default async function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Counter value={getCounter()} />

      {/* TODO: server reference on RSC itself */}
      {false && (
        <>
          <ClientFormImportAction />
          <ClientFormPropAction action={hello} />
          <form action={hello}>
            <button className="antd-btn antd-btn-default px-2">
              action (server)
            </button>
          </form>
        </>
      )}
    </div>
  );
}
