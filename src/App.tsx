import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// GeoJSON型定義
interface StopProperties {
  stop_id: string;
  stop_name: string;
  stop_desc: string;
  stop_url: string;
  platform_code: string | null;
}

interface StopFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: StopProperties;
}

interface StopsGeoJSON {
  type: 'FeatureCollection';
  features: StopFeature[];
}

interface NearestStop {
  name: string;
  desc: string;
  distance: number; // メートル
  url: string;
  coordinates: [number, number];
}

interface SelectedStop {
  longitude: number;
  latitude: number;
  name: string;
  desc: string;
  url: string;
}

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
  const [stopsData, setStopsData] = useState<StopsGeoJSON | null>(null);
  const [nearestStops, setNearestStops] = useState<NearestStop[]>([]);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null);

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

  // バス停データを取得
  useEffect(() => {
    fetch(STOPS_DATA_URL)
      .then((response) => response.json())
      .then((data: StopsGeoJSON) => {
        setStopsData(data);
        console.log(`${data.features.length}件のバス停データを取得しました`);
      })
      .catch((error) => {
        console.error('バス停データの取得に失敗しました:', error);
      });
  }, []);

  // 最寄りのバス停5つを計算
  useEffect(() => {
    if (!userLocation || !stopsData) return;

    const userPoint = turf.point([userLocation.longitude, userLocation.latitude]);

    const stopsWithDistance = stopsData.features.map((feature) => {
      const stopPoint = turf.point(feature.geometry.coordinates);
      const distance = turf.distance(userPoint, stopPoint, { units: 'meters' });

      return {
        name: feature.properties.stop_name,
        desc: feature.properties.stop_desc,
        distance: Math.round(distance),
        url: feature.properties.stop_url,
        coordinates: feature.geometry.coordinates,
      };
    });

    // 距離でソートして上位5つを取得
    const nearest = stopsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearestStops(nearest);
  }, [userLocation, stopsData]);


  // マップがロードされた後のスタイル設定
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();

    // スタイルレイヤーのカスタマイズ
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        // 町名・地区名レイヤーを非表示（place_label_other）
        if (layer.id === 'place_label_other') {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
        // POIレイヤーを表示しやすくする（minzoomを下げる）
        if (layer.id === 'poi_label') {
          map.setLayoutProperty(layer.id, 'visibility', 'visible');
          // フィルターを緩和してrank 1以外も表示
          map.setFilter(layer.id, ['all', ['==', '$type', 'Point']]);
          // minzoomを下げて早めに表示
          map.setLayerZoomRange(layer.id, 12, 24);
        }
      });
    }
  }, [mapLoaded]);

  // バス停マーカーのクリックハンドラ
  const handleStopClick = (feature: StopFeature) => {
    setSelectedStop({
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      name: feature.properties.stop_name,
      desc: feature.properties.stop_desc,
      url: feature.properties.stop_url,
    });
  };

  // バス停マーカーの長押しハンドラ
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStopPointerDown = (url: string) => {
    longPressTimerRef.current = setTimeout(() => {
      window.open(url, '_blank');
    }, 500);
  };

  const handleStopPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        mapLib={maplibregl}
        style={{ width: '100%', height: '100%' }}
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
        {/* バス停マーカー */}
        {stopsData?.features.map((feature) => (
          <Marker
            key={feature.properties.stop_id}
            longitude={feature.geometry.coordinates[0]}
            latitude={feature.geometry.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleStopClick(feature);
            }}
          >
            <div
              onPointerDown={() => handleStopPointerDown(feature.properties.stop_url)}
              onPointerUp={handleStopPointerUp}
              onPointerLeave={handleStopPointerUp}
              style={{ cursor: 'pointer' }}
            >
              <svg width="24" height="36" viewBox="0 0 100 100" fill="none">
                <path
                  d="M50.002 0C30.763 0 15 15.718 15 34.902c0 7.432 2.374 14.34 6.392 20.019L45.73 96.994c3.409 4.453 5.675 3.607 8.51-.235l26.843-45.683c.542-.981.967-2.026 1.338-3.092A34.446 34.446 0 0 0 85 34.902C85 15.718 69.24 0 50.002 0zm0 16.354c10.359 0 18.597 8.218 18.597 18.548c0 10.33-8.238 18.544-18.597 18.544c-10.36 0-18.601-8.215-18.601-18.544c0-10.33 8.241-18.548 18.6-18.548z"
                  fill="#982553"
                />
              </svg>
            </div>
          </Marker>
        ))}

        {/* バス停ポップアップ */}
        {selectedStop && (
          <Popup
            longitude={selectedStop.longitude}
            latitude={selectedStop.latitude}
            anchor="bottom"
            onClose={() => setSelectedStop(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {selectedStop.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                {selectedStop.desc}
              </div>
              <button
                onClick={() => window.open(selectedStop.url, '_blank')}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  backgroundColor: '#4285F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                時刻表を見る
              </button>
              <div style={{ fontSize: 10, color: '#999', marginTop: 6, textAlign: 'center' }}>
                💡 アイコンを長押しでも時刻表に飛べます
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* 最寄りバス停リスト */}
      {nearestStops.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: isListExpanded ? '40vh' : 'auto',
            overflowY: isListExpanded ? 'auto' : 'hidden',
          }}
        >
          <h3
            onClick={() => setIsListExpanded(!isListExpanded)}
            style={{
              margin: 0,
              marginBottom: isListExpanded ? 12 : 0,
              fontSize: 14,
              color: '#333',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            <span>🚌 最寄りのバス停</span>
            <span style={{ fontSize: 12, color: '#666' }}>
              {isListExpanded ? '▼' : '▲'}
            </span>
          </h3>
          {isListExpanded && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {nearestStops.map((stop, index) => (
                <li
                  key={`${stop.desc}-${index}`}
                  onClick={() => window.open(stop.url, '_blank')}
                  style={{
                    padding: '10px 12px',
                    marginBottom: index < nearestStops.length - 1 ? 8 : 0,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8e8e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                        {stop.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        {stop.desc}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#4285F4', fontWeight: 500 }}>
                      {stop.distance}m
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;