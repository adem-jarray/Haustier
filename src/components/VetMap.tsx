import { useEffect, useRef } from "react";
import type { VetEntry } from "@/hooks/useDynamicData";

// Leaflet CSS
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = () => { leafletLoaded = true; resolve(); };
      document.head.appendChild(script);
    } else {
      leafletLoaded = true;
      resolve();
    }
  });

  return loadPromise;
}

interface VetMapProps {
  vets: VetEntry[];
  onSelectVet: (vet: VetEntry) => void;
}

export function VetMap({ vets, onSelectVet }: VetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const vetsWithCoords = vets.filter(v => v.lat && v.lng);
    if (!containerRef.current || vetsWithCoords.length === 0) return;

    loadLeaflet().then(() => {
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      // Init map once
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView(
          [46.6, 2.3], 6 // center France
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(mapRef.current);
      }

      // Custom marker icon
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,hsl(158,42%,22%),hsl(36,82%,58%));
          transform:rotate(-45deg);border:2px solid white;
          box-shadow:0 2px 8px hsl(158,42%,20%,0.4);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      // Clear old markers
      mapRef.current.eachLayer((l: any) => {
        if (l instanceof L.Marker) mapRef.current.removeLayer(l);
      });

      // Add markers
      for (const vet of vetsWithCoords) {
        const marker = L.marker([vet.lat, vet.lng], { icon }).addTo(mapRef.current);
        marker.bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:180px">
            <p style="font-weight:700;margin:0 0 2px;color:hsl(158,48%,10%)">${vet.name}</p>
            <p style="font-size:12px;color:hsl(158,14%,44%);margin:0 0 6px">${vet.specialty} · ${vet.location}</p>
            <p style="font-size:12px;color:hsl(158,14%,44%);margin:0 0 8px">⭐ ${vet.rating} (${vet.reviews} avis)</p>
            <button
              onclick="window.__vetMapSelect('${vet.id}')"
              style="background:hsl(158,42%,22%);color:white;border:none;border-radius:8px;
                     padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;width:100%"
            >Voir le profil</button>
          </div>
        `);
      }

      // Global click bridge
      (window as any).__vetMapSelect = (id: string) => {
        const vet = vets.find(v => String(v.id) === String(id));
        if (vet) onSelectVet(vet);
      };

      // Fit bounds
      if (vetsWithCoords.length > 0) {
        const bounds = L.latLngBounds(vetsWithCoords.map(v => [v.lat, v.lng]));
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }

      // Invalidate size after container becomes visible
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    });

    return () => {
      delete (window as any).__vetMapSelect;
    };
  }, [vets, onSelectVet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "480px", borderRadius: "16px", overflow: "hidden" }}
    />
  );
}
