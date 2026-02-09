export default function GarminPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Garmin</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Connect flow + token store (krypteret) kommer her.
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Status</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Når DB kører: vi viser om dine tokens er gemt, og hvornår de sidst blev
          opdateret.
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Kryptering</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Tokens gemmes krypteret med ENCRYPTION_KEY (AES-256-GCM).
        </p>
      </div>
    </div>
  );
}
