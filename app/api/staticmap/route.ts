import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PARAMS = new Set(["center", "zoom", "size", "markers", "maptype"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Apenas parâmetros conhecidos são repassados ao serviço externo
  const safe = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_PARAMS.has(key)) {
      safe.append(key, value);
    }
  }

  if (!safe.has("center") || !safe.has("zoom") || !safe.has("size")) {
    return new NextResponse(null, { status: 400 });
  }

  const url = `https://staticmap.openstreetmap.de/staticmap.php?${safe.toString()}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "AlphamixGalpoes/1.0 (petrusweb.vercel.app)",
    },
  });

  if (!res.ok) {
    return new NextResponse(null, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
