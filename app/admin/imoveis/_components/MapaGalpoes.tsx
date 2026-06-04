"use client";

import { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { tipoLabel } from "@/lib/galpao-utils";

export type GalpaoPin = {
  id: string;
  titulo: string;
  tipo: string;
  valor: number | null;
  cidade: string;
  bairro: string | null;
  area_construida_m2: number | null;
  publicado: boolean;
  latitude: number;
  longitude: number;
};

type Props = {
  galpoes: GalpaoPin[];
  editMode?: boolean;
  onPinDrag?: (id: string, lat: number, lng: number) => void;
  selecionadoId?: string | null;
  onPinClick?: (id: string) => void;
  criarMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
};

function makeIcon(publicado: boolean, selecionado?: boolean) {
  const color = selecionado ? "#2e3092" : publicado ? "#16a34a" : "#6b7280";
  const size = selecionado ? 32 : 24;
  const h = selecionado ? 42 : 32;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 24 32">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -h],
  });
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [map, lat, lng]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaGalpoes({
  galpoes,
  editMode = false,
  onPinDrag,
  selecionadoId,
  onPinClick,
  criarMode = false,
  onMapClick,
  height = "520px",
}: Props) {
  const comCoordenadas = galpoes.filter((g) => g.latitude && g.longitude);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const centro: [number, number] = comCoordenadas.length > 0
    ? [
        comCoordenadas.reduce((s, g) => s + g.latitude, 0) / comCoordenadas.length,
        comCoordenadas.reduce((s, g) => s + g.longitude, 0) / comCoordenadas.length,
      ]
    : [-23.508, -46.845];

  const selecionado = comCoordenadas.find((g) => g.id === selecionadoId);

  const setMarkerRef = useCallback((id: string, ref: L.Marker | null) => {
    if (ref) markerRefs.current[id] = ref;
    else delete markerRefs.current[id];
  }, []);

  // Open popup when selected from list
  useEffect(() => {
    if (selecionadoId && markerRefs.current[selecionadoId]) {
      markerRefs.current[selecionadoId].openPopup();
    }
  }, [selecionadoId]);

  return (
    <div
      className={`w-full rounded overflow-hidden border border-gray-200 ${criarMode ? "cursor-crosshair" : ""}`}
      style={{ height }}
    >
      {comCoordenadas.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-gray-400 bg-gray-50">
          Nenhum imovel com coordenadas.
        </div>
      ) : (
        <MapContainer center={centro} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selecionado && <FlyTo lat={selecionado.latitude} lng={selecionado.longitude} />}
          {criarMode && onMapClick && <MapClickHandler onClick={onMapClick} />}
          {comCoordenadas.map((g) => (
            <Marker
              key={g.id}
              position={[g.latitude, g.longitude]}
              icon={makeIcon(g.publicado, g.id === selecionadoId)}
              draggable={editMode}
              ref={(ref) => setMarkerRef(g.id, ref)}
              eventHandlers={{
                click: () => onPinClick?.(g.id),
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  onPinDrag?.(g.id, latlng.lat, latlng.lng);
                },
              }}
            >
              <Popup minWidth={200}>
                <div className="space-y-1.5 py-1">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{g.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {tipoLabel(g.tipo)}
                    {g.area_construida_m2 ? ` · ${g.area_construida_m2} m²` : ""}
                  </p>
                  {g.valor && (
                    <p className="text-xs text-gray-700 font-medium">
                      R$ {Number(g.valor).toLocaleString("pt-BR")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{[g.bairro, g.cidade].filter(Boolean).join(", ")}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-xs px-1.5 py-0.5 font-medium ${g.publicado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {g.publicado ? "Publicado" : "Oculto"}
                    </span>
                    <Link href={`/admin/imoveis/${g.id}/editar`} className="text-xs text-blue-600 hover:underline">
                      Editar
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
