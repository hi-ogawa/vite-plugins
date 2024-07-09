import type { PageProps } from "@hiogawa/react-server/server";

export default async function Page({ params }: PageProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h3>(shop)/[categorySlug]/[subCategorySlug]/page.tsx</h3>
      <pre className="text-sm">{JSON.stringify(params)}</pre>
    </div>
  );
}
