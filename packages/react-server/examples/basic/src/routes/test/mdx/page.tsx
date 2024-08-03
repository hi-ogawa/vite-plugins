import Test from "./_test.mdx";

export default function Page() {
  return (
    <>
      <Test
        components={{
          h1: (props) => <h1 className="font-bold">{props.children}</h1>,
          li: (props) => (
            <li className="flex items-center">
              <span className="text-lg pr-2 select-none">•</span>
              {props.children}
            </li>
          ),
        }}
      />
    </>
  );
}
