import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StaticMaps = require("staticmaps");

// CartoDB Light @2x — mapa limpo, ideal para PDF
const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const size = searchParams.get("size");
  const markersParam = searchParams.get("markers");

  if (!size || !markersParam) {
    return new NextResponse(null, { status: 400 });
  }

  const [width, height] = size.split("x").map(Number);
  if (isNaN(width) || isNaN(height)) {
    return new NextResponse(null, { status: 400 });
  }

  // Formato: "lat,lon,N" separados por "|"
  const markers: { lat: number; lon: number; num: number }[] = [];
  for (const m of markersParam.split("|")) {
    const parts = m.split(",");
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    const num = parseInt(parts[2] ?? "1");
    if (!isNaN(lat) && !isNaN(lon)) {
      markers.push({ lat, lon, num: isNaN(num) ? 1 : num });
    }
  }

  if (markers.length === 0) {
    return new NextResponse(null, { status: 400 });
  }

  const map = new StaticMaps({
    width,
    height,
    tileUrl: CARTO_LIGHT,
    tileSubdomains: ["a", "b", "c"],
    tileSize: 512,
    zoomRange: { min: 10, max: 16 },
    paddingX: 60,
    paddingY: 60,
  });

  // Define o extent para auto-zoom — staticmaps calcula zoom e centro automaticamente
  map.addBound({
    coords: markers.map(({ lon, lat }) => [lon, lat]),
  });

  for (const { lat, lon, num } of markers) {
    // Círculo vermelho preenchido
    map.addCircle({
      coord: [lon, lat],
      radius: 200,
      fill: "#dc2626",
      color: "#ffffff",
      width: 4,
    });
    // Número branco sobre o círculo
    map.addText({
      coord: [lon, lat],
      text: String(num),
      size: 14,
      font: "Arial, sans-serif",
      color: "#ffffff",
      fill: "#ffffff",
      anchor: "middle",
      offsetX: 0,
      offsetY: 5, // ajuste para centralizar verticalmente (baseline SVG)
    });
  }

  try {
    // render() sem args usa auto-zoom a partir do extent definido pelo addBound
    await map.render();
    const buffer = await map.image.buffer("image/png");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("staticmap render error:", err);
    return new NextResponse(null, { status: 502 });
  }
}
