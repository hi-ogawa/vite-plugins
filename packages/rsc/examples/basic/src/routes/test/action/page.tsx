import { hello } from "./action";
import { ClientFormImportAction, ClientFormPropAction } from "./client";

export default async function Page() {
  return (
    <div className="flex flex-col gap-2">
      <ClientFormImportAction />
      <ClientFormPropAction action={hello} />
      <form action={hello}>
        <button className="antd-btn antd-btn-default px-2">ServerForm</button>
      </form>
    </div>
  );
}
