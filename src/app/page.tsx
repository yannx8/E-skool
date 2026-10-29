import { databaseStatus } from "@/modules/core";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await databaseStatus();

  return (
    <main className="mx-auto max-w-2xl p-8 text-base">
      <h1 className="text-2xl font-semibold">E-skool</h1>
      {status.ok ? (
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="font-medium">Database</dt>
            <dd>{status.version}</dd>
          </div>
          <div>
            <dt className="font-medium">Server time</dt>
            <dd>{status.now}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4">Database unreachable</p>
      )}
    </main>
  );
}
