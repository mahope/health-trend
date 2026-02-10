"""Garmin login helper for Health Trend.

This script logs into Garmin Connect and dumps OAuth tokens to a directory.

Env vars:
- GARMIN_EMAIL
- GARMIN_PASSWORD
- GARMINTOKENS (output directory)

Notes:
- We DO NOT store the password. We only dump tokens.
- MFA: this version assumes no MFA prompt is required. (We can extend later.)
"""

import os
from garminconnect import Garmin


def main():
    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    token_dir = os.environ.get("GARMINTOKENS")

    if not email or not password:
        raise SystemExit("Missing GARMIN_EMAIL or GARMIN_PASSWORD")
    if not token_dir:
        raise SystemExit("Missing GARMINTOKENS")

    os.makedirs(token_dir, exist_ok=True)

    # prompt_mfa=False for now (no MFA flow). If user enables MFA later, we extend.
    client = Garmin(email, password, prompt_mfa=False)

    # Important: garminconnect will try to auto-load from tokenstore.
    # It uses: tokenstore = tokenstore or os.getenv("GARMINTOKENS")
    # In our app we set GARMINTOKENS to the *output* dir, which on first run is empty.
    # So we MUST remove it from env for the actual credential login.
    os.environ.pop("GARMINTOKENS", None)
    client.login(tokenstore="")

    # Persist tokens
    client.garth.dump(token_dir)

    print(f"Tokens saved to: {token_dir}")


if __name__ == "__main__":
    main()
