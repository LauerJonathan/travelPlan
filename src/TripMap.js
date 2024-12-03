import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TripMap = ({ days, color, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapFullyLoaded, setIsMapFullyLoaded] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
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
    if (!isMapReady || !days.length) return;

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds();

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  
    tileLayer.on('load', () => {
      setTilesLoaded(true);
    });

    const routePoints = days
      .filter(day => day.location && day.location.lat && day.location.lon)
      .map(day => [day.location.lat, day.location.lon]);

    routePoints.forEach((point, index) => {
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${index + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
      });
      marker.addTo(map).bindPopup(`Jour ${index + 1}: ${days[index].name} - ${days[index].location.name}`);
      bounds.extend(point);
    });

    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: color, weight: 3 }).addTo(map);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else {
      map.setView([0, 0], 2);
    }
  
    map.once('moveend', () => {
      onMapReady();
    });

    map.on('load', () => {
      setIsMapFullyLoaded(true);
    });
  }, [days, color, isMapReady, onMapReady]);

 useEffect(() => {
  if (isMapReady && tilesLoaded) {
    onMapReady();
  }
}, [isMapReady, tilesLoaded, onMapReady]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default React.memo(TripMap);