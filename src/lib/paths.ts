import path from "node:path";

export const GARMIN_TOKEN_DIR =
  process.env.GARMIN_TOKEN_DIR || "C:\\Users\\mads_\\Garmin\\tokens";

export const GARMIN_DATA_DIR =
  process.env.GARMIN_DATA_DIR || "C:\\Users\\mads_\\Garmin\\data";

export const LOCAL_DATA_DIR =
  process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".local-data");
