import { prisma } from "@/lib/prisma";
import { pickMetrics } from "@/lib/garminLocal";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    out[k] = v ?? "1";
  }
  return out;
}

function toTakenAt(day: string) {
  // Stable timestamp per day (Copenhagen winter time).
  return new Date(`${day}T12:00:00+01:00`);
}

function isDayFile(name: string) {
  return /^garmin-\d{4}-\d{2}-\d{2}\.json$/i.test(name);
}

async function main() {
  const args = parseArgs(process.argv);
  const dataDir = args.dir || "C:/Users/mads_/Garmin/data";
  const email = args.email || "madsholstp@gmail.com";
  const overwrite = args.overwrite === "1" || args.overwrite === "true";

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) throw new Error(`No user found for email: ${email}`);

  const files = fs
    .readdirSync(dataDir)
    .filter(isDayFile)
    .sort();

  if (!files.length) {
    console.log(`No files found in ${dataDir}`);
    return;
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const f of files) {
    const day = f.slice("garmin-".length, "garmin-YYYY-MM-DD".length);
    const full = path.join(dataDir, f);

    try {
      const raw = fs.readFileSync(full, "utf8");
      const payload = JSON.parse(raw) as unknown;
      const metrics = pickMetrics(payload);
      const takenAt = toTakenAt(day);

      const existing = await prisma.garminSnapshot.findUnique({
        where: { userId_takenAt: { userId: user.id, takenAt } },
        select: { id: true },
      });

      if (existing && !overwrite) {
        skipped++;
        continue;
      }

      await prisma.garminSnapshot.upsert({
        where: { userId_takenAt: { userId: user.id, takenAt } },
        update: {
          day,
          ...metrics,
          // Prisma accepts JSON values; payload comes from JSON.parse.
          rawJson: payload as unknown,
        },
        create: {
          userId: user.id,
          day,
          takenAt,
          ...metrics,
          rawJson: payload as unknown,
        },
      });

      ok++;
      if (ok % 25 === 0) console.log(`Imported ${ok}…`);
    } catch (e: unknown) {
      failed++;
      console.error(`Failed ${f}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
