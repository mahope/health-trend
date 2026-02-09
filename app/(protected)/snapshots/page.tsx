export default function SnapshotsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Snapshots</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Her kommer morgen/middag/aften snapshots + delta-visning.
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Tag snapshot</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Endpoint er klar som placeholder: <code>/api/snapshots/take</code>.
        </p>
      </div>
    </div>
  );
}
