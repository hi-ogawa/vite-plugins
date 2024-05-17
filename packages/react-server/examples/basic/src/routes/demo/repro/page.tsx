import { Client1, Client2 } from "./_client";

export default function Page() {
  return (
    <div>
      <h4 className="font-bold">Repro</h4>
      {/* not ok */}
      {/* TypeError: Cannot assign to read only property 'SomeComp' of object '#<Object>' */}
      <Client1 SomeComp={Client2} />

      {/* ok */}
      {/* <Client2 /> */}
    </div>
  );
}
