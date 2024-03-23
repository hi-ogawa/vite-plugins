export default async function Page() {
  return (
    <div className="flex flex-col gap-1">
      <p>You can find me online here:</p>
      <ul className="pl-2">
        <li className="flex items-center">
          <span className="text-lg pr-2">•</span> admin@mysite.com
        </li>
        <li className="flex items-center">
          <span className="text-lg pr-2">•</span> +123456789
        </li>
      </ul>
    </div>
  );
}
