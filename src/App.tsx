import { useState } from 'react';
import { useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

const App = () => {
  return (
    <div className="App">
      <Map
        initialViewState={{
          longitude: 135.762,
          latitude: 35.0116,
          zoom: 12,
        }}
        mapLib={maplibregl}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
      />
    </div>
  );
};

export default App;
