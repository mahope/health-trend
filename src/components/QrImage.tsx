"use client";

import Image from "next/image";

export function QrImage({ dataUrl }: { dataUrl: string }) {
  return (
    <Image
      src={dataUrl}
      alt="TOTP QR"
      width={176}
      height={176}
      className="w-44 h-44 border rounded-md bg-white"
      unoptimized
    />
  );
}
