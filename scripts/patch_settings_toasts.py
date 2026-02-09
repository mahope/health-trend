from pathlib import Path

p = Path(r"C:\Users\mads_\.openclaw\workspace\health-trend\app\(protected)\settings\page.tsx")
text = p.read_text(encoding="utf-8")

if "useToast" in text:
    print("Already patched")
    raise SystemExit(0)

# 1) extend react import
text = text.replace(
    'import { useEffect, useMemo, useState } from "react";',
    'import { useEffect, useMemo, useRef, useState } from "react";',
)

# 2) add toast import
ins = 'import { authClient } from "@/lib/auth-client";'
rep = ins + "\nimport { useToast } from \"@/components/ToastProvider\";"
text = text.replace(ins, rep)

# 3) insert toast setup after function start
marker = "export default function SettingsPage() {"
idx = text.find(marker)
assert idx != -1
insert_after = idx + len(marker)
addition = (
    "\n  const { toast } = useToast();\n"
    "  const lastToastAt = useRef(0);\n\n"
    "  function rateLimitedToast(next: Parameters<typeof toast>[0]) {\n"
    "    const now = Date.now();\n"
    "    if (now - lastToastAt.current < 1200) return;\n"
    "    lastToastAt.current = now;\n"
    "    toast(next);\n"
    "  }\n"
)
text = text[:insert_after] + addition + text[insert_after:]

# 4) goals save
needle = (
    "                const json = await res.json();\n"
    "                if (!res.ok) throw new Error(json.error || \"Kunne ikke gemme mål\");"
)
if needle not in text:
    raise SystemExit("Could not find goals save block")
text = text.replace(
    needle,
    needle + "\n                rateLimitedToast({ title: \"Mål gemt ✓\", kind: \"success\", vibrateMs: 10 });",
)

needle = (
    "              } catch (e: unknown) {\n"
    "                setError(e instanceof Error ? e.message : \"Kunne ikke gemme mål\");"
)
if needle not in text:
    raise SystemExit("Could not find goals catch block")
text = text.replace(
    needle,
    needle
    + "\n                rateLimitedToast({\n"
    + "                  title: e instanceof Error ? e.message : \\\"Kunne ikke gemme mål\\\",\n"
    + "                  kind: \\\"error\\\",\n"
    + "                  vibrateMs: 35,\n"
    + "                });",
)

# 5) context save
needle = (
    "                const json = await res.json();\n"
    "                if (!res.ok) throw new Error(json.error || \"Kunne ikke gemme\");"
)
if needle not in text:
    raise SystemExit("Could not find context save ok block")
text = text.replace(
    needle,
    needle + "\n                rateLimitedToast({ title: \"Kontekst gemt ✓\", kind: \"success\", vibrateMs: 10 });",
)

needle = (
    "              } catch (e: unknown) {\n"
    "                setError(e instanceof Error ? e.message : \"Kunne ikke gemme\");"
)
if needle not in text:
    raise SystemExit("Could not find context catch block")
text = text.replace(
    needle,
    needle
    + "\n                rateLimitedToast({\n"
    + "                  title: e instanceof Error ? e.message : \\\"Kunne ikke gemme\\\",\n"
    + "                  kind: \\\"error\\\",\n"
    + "                  vibrateMs: 35,\n"
    + "                });",
)

# 6) 2FA enable success
needle = (
    "                if (res.error) {\n"
    "                  setError(res.error.message || \"Kunne ikke aktivere 2FA\");\n"
    "                } else {\n"
    "                  setTotpURI(res.data.totpURI);\n"
    "                  setBackupCodes(res.data.backupCodes);"
)
if needle not in text:
    raise SystemExit("Could not find 2FA enable success block")
text = text.replace(
    needle,
    needle
    + "\n                  rateLimitedToast({ title: \\\"2FA klargjort — scan QR\\\", kind: \\\"success\\\", vibrateMs: 12 });",
)

# 7) verify success
needle = (
    "                    if (res.error) {\n"
    "                      setError(res.error.message || \"Verificering fejlede\");\n"
    "                    } else {\n"
    "                      window.location.reload();"
)
if needle not in text:
    raise SystemExit("Could not find verify success block")
text = text.replace(
    needle,
    needle.replace(
        "window.location.reload();",
        'rateLimitedToast({ title: "2FA aktiveret ✓", kind: "success", vibrateMs: 15 });\n                      window.location.reload();',
    ),
)

p.write_text(text, encoding="utf-8")
print("Patched settings page with toasts")
