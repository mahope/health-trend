"""Export Garmin daily metrics to JSON (stdout).

Uses `garminconnect` and a tokenstore directory.

Args:
  --date YYYY-MM-DD

Env:
  GARMINTOKENS=/path/to/tokenstore (must contain oauth1_token.json + oauth2_token.json)

Output:
  Prints a JSON payload to stdout.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime

from garminconnect import Garmin


def _safe(obj):
    try:
        json.dumps(obj)
        return obj
    except TypeError:
        return str(obj)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", dest="day", required=True)
    args = ap.parse_args()

    day = args.day
    token_dir = os.environ.get("GARMINTOKENS")
    if not token_dir:
        raise SystemExit("Missing GARMINTOKENS")

    client = Garmin(None, None, prompt_mfa=False)
    client.login(tokenstore=token_dir)

    payload = {
        "date": day,
        "fetchedAt": datetime.utcnow().isoformat() + "Z",
        "stats": _safe(client.get_stats(day)),
        "heartRates": _safe(client.get_heart_rates(day)),
        "stress": _safe(client.get_stress_data(day)),
        "sleep": _safe(client.get_sleep_data(day)),
        "bodyBattery": _safe(client.get_body_battery(day)),
        "respiration": None,
        "spo2": None,
        "hrv": None,
        "trainingReadiness": None,
        "morningTrainingReadiness": None,
        "trainingStatus": None,
        "activities": None,
        "weight": None,
    }

    try:
        payload["activities"] = _safe(client.get_activities_by_date(day, day))
    except Exception:
        payload["activities"] = None

    for key, fn in [
        ("respiration", client.get_respiration_data),
        ("spo2", client.get_spo2_data),
        ("hrv", client.get_hrv_data),
        ("trainingReadiness", client.get_training_readiness),
        ("morningTrainingReadiness", client.get_morning_training_readiness),
        ("trainingStatus", client.get_training_status),
    ]:
        try:
            payload[key] = _safe(fn(day))
        except Exception:
            payload[key] = None

    try:
        payload["weight"] = _safe(client.get_body_composition(day))
    except Exception:
        payload["weight"] = None

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
