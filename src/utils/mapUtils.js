import L from 'leaflet';

export const createCustomIcon = (number, color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
};