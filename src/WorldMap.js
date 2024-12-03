import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const WorldMap = ({ trips }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  /*const createCustomIcon = (number, color) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${number}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
  };*/

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapInstanceRef.current);

    setIsMapReady(true);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !trips.length) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds();

    trips.forEach((trip) => {
      const routePoints = trip.days
        .filter(day => day.location && day.location.lat && day.location.lon)
        .map(day => [day.location.lat, day.location.lon]);

      if (routePoints.length > 1) {
        L.polyline(routePoints, { color: trip.color, weight: 3 }).addTo(map);
        routePoints.forEach((point) => {
          bounds.extend(point);
        });
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
    } else {
      map.setView([0, 0], 2);
    }
  }, [trips, isMapReady]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default WorldMap;