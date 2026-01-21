import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// フォールバック座標（位置情報取得失敗時）
const FALLBACK_LOCATION = {
  latitude: 35.00697423611227,
  longitude: 135.7685951501843,
};

const STOPS_DATA_URL = '/stops.geojson';

function App() {
  const mapRef = useRef<MapRef>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [viewState, setViewState] = useState({
    longitude: FALLBACK_LOCATION.longitude,
    latitude: FALLBACK_LOCATION.latitude,
    zoom: 14,
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [iconLoaded, setIconLoaded] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setViewState((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        },
        (error) => {
          console.warn('位置情報の取得に失敗しました:', error.message);
          setUserLocation(FALLBACK_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn('このブラウザは位置情報をサポートしていません');
      setUserLocation(FALLBACK_LOCATION);
    }
  }, []);

  // マップがロードされた後にアイコンを追加
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();

    // アイコン画像を読み込んで登録
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!map.hasImage('poi-icon')) {
        map.addImage('poi-icon', img);
        setIconLoaded(true);
        console.log('アイコンを登録しました');
      }
    };
    img.onerror = (error) => {
      console.error('アイコン画像の読み込みに失敗しました:', error);
    };
    img.src = '/poi_icon.png';
  }, [mapLoaded]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onLoad={handleMapLoad}
      mapLib={maplibregl}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
    >
      {userLocation && (
        <Marker
          longitude={userLocation.longitude}
          latitude={userLocation.latitude}
          anchor="center"
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#4285F4',
              border: '3px solid white',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            }}
          />
        </Marker>
      )}
      <Source id="stops" type="geojson" data={STOPS_DATA_URL}>
        {iconLoaded && (
          <Layer
            id="stops-layer"
            type="symbol"
            layout={{
              'icon-image': 'poi-icon',
              'icon-size': 0.02,
              'icon-allow-overlap': true,
            }}
          />
        )}
      </Source>
    </Map>
  );
}

export default App;