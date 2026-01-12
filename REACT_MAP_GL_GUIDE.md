# react-map-gl 使い方マニュアル

react-map-glは、MapLibre GLやMapbox GLをReactで簡単に使用できるようにするライブラリです。このプロジェクトではMapLibre GLと組み合わせて使用しています。

## 目次

1. [基本セットアップ](#基本セットアップ)
2. [基本的な地図の表示](#基本的な地図の表示)
3. [マーカーの追加](#マーカーの追加)
4. [ポップアップの表示](#ポップアップの表示)
5. [ラインやポリゴンの描画](#ラインやポリゴンの描画)
6. [地図の操作とイベント](#地図の操作とイベント)
7. [カスタムコントロール](#カスタムコントロール)
8. [よく使うプロパティ](#よく使うプロパティ)

---

## 基本セットアップ

### インストール

```bash
npm install react-map-gl maplibre-gl
```

### 必要なインポート

```tsx
import * as React from 'react';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
```

---

## 基本的な地図の表示

最もシンプルな地図の表示方法：

```tsx
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {
  return (
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
  );
}
```

### 制御された地図（Controlled Map）

状態を管理して地図を制御する場合：

```tsx
import { useState } from 'react';
import Map from 'react-map-gl/maplibre';

function App() {
  const [viewState, setViewState] = useState({
    longitude: 135.762,
    latitude: 35.0116,
    zoom: 12,
  });

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapLib={maplibregl}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
    />
  );
}
```

---

## マーカーの追加

### 基本的なマーカー

```tsx
import Map, { Marker } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map
      initialViewState={{
        longitude: 135.762,
        latitude: 35.0116,
        zoom: 12,
      }}
      mapLib={maplibregl}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
    >
      <Marker longitude={135.762} latitude={35.0116} color="red" />
    </Map>
  );
}
```

### カスタムマーカー

```tsx
import Map, { Marker } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map {...mapProps}>
      <Marker longitude={135.762} latitude={35.0116} anchor="bottom">
        <div style={{
          background: '#ff0000',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          border: '2px solid white',
        }} />
      </Marker>
    </Map>
  );
}
```

### 複数のマーカー

```tsx
const locations = [
  { id: 1, name: '京都駅', longitude: 135.7581, latitude: 34.9857 },
  { id: 2, name: '金閣寺', longitude: 135.7292, latitude: 35.0394 },
  { id: 3, name: '清水寺', longitude: 135.7850, latitude: 34.9949 },
];

function App() {
  return (
    <Map {...mapProps}>
      {locations.map((location) => (
        <Marker
          key={location.id}
          longitude={location.longitude}
          latitude={location.latitude}
          color="blue"
        />
      ))}
    </Map>
  );
}
```

---

## ポップアップの表示

### 基本的なポップアップ

```tsx
import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';

function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <Map {...mapProps}>
      <Marker
        longitude={135.762}
        latitude={35.0116}
        color="red"
        onClick={() => setShowPopup(true)}
      />
      
      {showPopup && (
        <Popup
          longitude={135.762}
          latitude={35.0116}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          <div>京都市内</div>
        </Popup>
      )}
    </Map>
  );
}
```

### クリックで表示するポップアップ

```tsx
import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const locations = [
    { id: 1, name: '京都駅', longitude: 135.7581, latitude: 34.9857 },
    { id: 2, name: '金閣寺', longitude: 135.7292, latitude: 35.0394 },
  ];

  return (
    <Map {...mapProps}>
      {locations.map((location) => (
        <Marker
          key={location.id}
          longitude={location.longitude}
          latitude={location.latitude}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedLocation(location);
          }}
        />
      ))}

      {selectedLocation && (
        <Popup
          longitude={selectedLocation.longitude}
          latitude={selectedLocation.latitude}
          onClose={() => setSelectedLocation(null)}
        >
          <div>
            <h3>{selectedLocation.name}</h3>
          </div>
        </Popup>
      )}
    </Map>
  );
}
```

---

## ラインやポリゴンの描画

### Source と Layer を使った描画

```tsx
import Map, { Source, Layer } from 'react-map-gl/maplibre';

function App() {
  const routeData = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [135.7581, 34.9857],
        [135.7292, 35.0394],
        [135.7850, 34.9949],
      ],
    },
  };

  return (
    <Map {...mapProps}>
      <Source id="route" type="geojson" data={routeData}>
        <Layer
          id="route-layer"
          type="line"
          paint={{
            'line-color': '#ff0000',
            'line-width': 4,
          }}
        />
      </Source>
    </Map>
  );
}
```

### ポリゴンの描画

```tsx
const areaData = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [135.75, 34.98],
      [135.78, 34.98],
      [135.78, 35.01],
      [135.75, 35.01],
      [135.75, 34.98],
    ]],
  },
};

<Source id="area" type="geojson" data={areaData}>
  <Layer
    id="area-layer"
    type="fill"
    paint={{
      'fill-color': '#0080ff',
      'fill-opacity': 0.3,
    }}
  />
  <Layer
    id="area-outline"
    type="line"
    paint={{
      'line-color': '#0080ff',
      'line-width': 2,
    }}
  />
</Source>
```

---

## 地図の操作とイベント

### クリックイベント

```tsx
import Map from 'react-map-gl/maplibre';

function App() {
  const handleMapClick = (event) => {
    console.log('クリック位置:', event.lngLat);
    console.log('経度:', event.lngLat.lng);
    console.log('緯度:', event.lngLat.lat);
  };

  return (
    <Map
      {...mapProps}
      onClick={handleMapClick}
    />
  );
}
```

### 移動・ズームイベント

```tsx
function App() {
  return (
    <Map
      {...mapProps}
      onMove={(evt) => console.log('移動中:', evt.viewState)}
      onMoveEnd={(evt) => console.log('移動終了:', evt.viewState)}
      onZoom={(evt) => console.log('ズーム:', evt.viewState.zoom)}
    />
  );
}
```

### プログラムで地図を操作

```tsx
import { useRef } from 'react';
import Map from 'react-map-gl/maplibre';

function App() {
  const mapRef = useRef();

  const flyToKyoto = () => {
    mapRef.current?.flyTo({
      center: [135.762, 35.0116],
      zoom: 14,
      duration: 2000,
    });
  };

  return (
    <>
      <button onClick={flyToKyoto}>京都へ移動</button>
      <Map ref={mapRef} {...mapProps} />
    </>
  );
}
```

---

## カスタムコントロール

### ナビゲーションコントロール

```tsx
import Map, { NavigationControl } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map {...mapProps}>
      <NavigationControl position="top-right" />
    </Map>
  );
}
```

### フルスクリーンコントロール

```tsx
import Map, { FullscreenControl } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map {...mapProps}>
      <FullscreenControl position="top-right" />
    </Map>
  );
}
```

### 位置情報コントロール

```tsx
import Map, { GeolocateControl } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map {...mapProps}>
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showUserHeading
      />
    </Map>
  );
}
```

### スケールコントロール

```tsx
import Map, { ScaleControl } from 'react-map-gl/maplibre';

function App() {
  return (
    <Map {...mapProps}>
      <ScaleControl position="bottom-left" />
    </Map>
  );
}
```

---

## よく使うプロパティ

### Map コンポーネント

| プロパティ | 型 | 説明 |
|----------|-----|------|
| `initialViewState` | `object` | 初期表示位置（longitude, latitude, zoom） |
| `mapStyle` | `string` | 地図スタイルのURL |
| `mapLib` | `object` | maplibregl オブジェクト |
| `style` | `CSSProperties` | コンテナのスタイル |
| `onClick` | `function` | クリックイベント |
| `onMove` | `function` | 移動イベント |
| `onZoom` | `function` | ズームイベント |
| `cursor` | `string` | カーソルスタイル |
| `minZoom` | `number` | 最小ズームレベル（デフォルト: 0） |
| `maxZoom` | `number` | 最大ズームレベル（デフォルト: 22） |
| `dragPan` | `boolean` | ドラッグで移動可能か（デフォルト: true） |
| `scrollZoom` | `boolean` | スクロールでズーム可能か（デフォルト: true） |

### Marker コンポーネント

| プロパティ | 型 | 説明 |
|----------|-----|------|
| `longitude` | `number` | 経度 |
| `latitude` | `number` | 緯度 |
| `color` | `string` | マーカーの色 |
| `anchor` | `string` | アンカー位置（center, top, bottom など） |
| `onClick` | `function` | クリックイベント |
| `draggable` | `boolean` | ドラッグ可能か |
| `onDragEnd` | `function` | ドラッグ終了イベント |

### Popup コンポーネント

| プロパティ | 型 | 説明 |
|----------|-----|------|
| `longitude` | `number` | 経度 |
| `latitude` | `number` | 緯度 |
| `anchor` | `string` | アンカー位置 |
| `onClose` | `function` | 閉じるイベント |
| `closeButton` | `boolean` | 閉じるボタンを表示するか（デフォルト: true） |
| `closeOnClick` | `boolean` | 地図クリックで閉じるか（デフォルト: true） |
| `offset` | `number \| object` | ポップアップのオフセット |

---

## 実践例：バス停の表示

```tsx
import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface BusStop {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

function BusMapApp() {
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  
  const busStops: BusStop[] = [
    { id: '1', name: '京都駅前', longitude: 135.7581, latitude: 34.9857 },
    { id: '2', name: '四条河原町', longitude: 135.7700, latitude: 35.0039 },
    { id: '3', name: '金閣寺道', longitude: 135.7292, latitude: 35.0394 },
  ];

  return (
    <Map
      initialViewState={{
        longitude: 135.762,
        latitude: 35.0116,
        zoom: 12,
      }}
      mapLib={maplibregl}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
    >
      {busStops.map((stop) => (
        <Marker
          key={stop.id}
          longitude={stop.longitude}
          latitude={stop.latitude}
          color="#0066cc"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedStop(stop);
          }}
        />
      ))}

      {selectedStop && (
        <Popup
          longitude={selectedStop.longitude}
          latitude={selectedStop.latitude}
          anchor="bottom"
          onClose={() => setSelectedStop(null)}
        >
          <div style={{ padding: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{selectedStop.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              バス停ID: {selectedStop.id}
            </p>
          </div>
        </Popup>
      )}
    </Map>
  );
}

export default BusMapApp;
```

---

## 参考リンク

- [react-map-gl 公式ドキュメント](https://visgl.github.io/react-map-gl/)
- [MapLibre GL JS ドキュメント](https://maplibre.org/maplibre-gl-js/docs/)
- [GeoJSON 仕様](https://geojson.org/)
