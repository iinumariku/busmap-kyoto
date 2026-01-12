# Turf.js 使い方マニュアル

Turf.jsは、地理空間データの解析・処理を行うJavaScriptライブラリです。距離計算、エリア計算、ポイントの包含判定など、GIS（地理情報システム）の機能をブラウザやNode.jsで簡単に使えます。

## 目次

1. [基本セットアップ](#基本セットアップ)
2. [座標と距離の計算](#座標と距離の計算)
3. [ポイント操作](#ポイント操作)
4. [ライン操作](#ライン操作)
5. [ポリゴン操作](#ポリゴン操作)
6. [空間関係の判定](#空間関係の判定)
7. [変換と投影](#変換と投影)
8. [集約と統計](#集約と統計)
9. [バス路線での実践例](#バス路線での実践例)

---

## 基本セットアップ

### インストール

```bash
npm install @turf/turf
```

### インポート方法

```typescript
// 全体をインポート
import * as turf from '@turf/turf';

// 個別の関数をインポート（推奨：バンドルサイズ削減）
import { distance, point, lineString } from '@turf/turf';
```

### 基本的なデータ構造

Turf.jsはGeoJSON形式を使用します：

```typescript
// Point（点）
const point1 = turf.point([135.762, 35.0116]);

// LineString（線）
const line = turf.lineString([
  [135.762, 35.0116],
  [135.768, 35.0120],
  [135.775, 35.0125]
]);

// Polygon（面）
const polygon = turf.polygon([[
  [135.75, 35.00],
  [135.80, 35.00],
  [135.80, 35.05],
  [135.75, 35.05],
  [135.75, 35.00]
]]);
```

---

## 座標と距離の計算

### 2点間の距離

```typescript
import { point, distance } from '@turf/turf';

const kyotoStation = point([135.7581, 34.9857]);
const kinkakuji = point([135.7292, 35.0394]);

// 距離を計算（デフォルト: キロメートル）
const dist = distance(kyotoStation, kinkakuji);
console.log(`距離: ${dist.toFixed(2)} km`); // 約 6.14 km

// 単位を指定
const distMeters = distance(kyotoStation, kinkakuji, { units: 'meters' });
console.log(`距離: ${distMeters.toFixed(0)} m`); // 約 6140 m
```

**利用可能な単位**: `'meters'`, `'kilometers'`, `'miles'`, `'feet'`, `'degrees'`, `'radians'`

### 方位角（bearing）

```typescript
import { bearing } from '@turf/turf';

const angle = bearing(kyotoStation, kinkakuji);
console.log(`方位: ${angle.toFixed(1)}°`); // -15.3° (北から時計回り)
```

### 目的地の座標を計算

```typescript
import { destination } from '@turf/turf';

const start = point([135.762, 35.0116]);
const distance = 2; // km
const bearing = 45; // 北東方向

const endpoint = destination(start, distance, bearing);
console.log(endpoint.geometry.coordinates); // [135.7762..., 35.0242...]
```

---

## ポイント操作

### 最も近いポイントを見つける

```typescript
import { point, featureCollection, nearestPoint } from '@turf/turf';

const targetPoint = point([135.762, 35.0116]);

const busStops = featureCollection([
  point([135.7581, 34.9857], { name: '京都駅' }),
  point([135.7700, 35.0039], { name: '四条河原町' }),
  point([135.7292, 35.0394], { name: '金閣寺道' }),
]);

const nearest = nearestPoint(targetPoint, busStops);
console.log(nearest.properties.name); // 最も近いバス停
console.log(nearest.properties.distanceToPoint); // 距離（km）
```

### ポイントのグリッド生成

```typescript
import { pointGrid, bbox } from '@turf/turf';

const area = polygon([[
  [135.75, 35.00],
  [135.80, 35.00],
  [135.80, 35.05],
  [135.75, 35.05],
  [135.75, 35.00]
]]);

// 500m間隔でポイントを生成
const grid = pointGrid(bbox(area), 0.5, { units: 'kilometers' });
```

### ランダムポイント生成

```typescript
import { randomPoint } from '@turf/turf';

// 100個のランダムなポイントを生成
const points = randomPoint(100, { bbox: [135.75, 35.00, 135.80, 35.05] });
```

---

## ライン操作

### ラインの長さ

```typescript
import { lineString, length } from '@turf/turf';

const route = lineString([
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
]);

const routeLength = length(route, { units: 'kilometers' });
console.log(`路線の長さ: ${routeLength.toFixed(2)} km`);
```

### ライン上の特定距離の点

```typescript
import { along } from '@turf/turf';

const route = lineString([
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
]);

// 始点から2km地点の座標
const pointAt2km = along(route, 2, { units: 'kilometers' });
console.log(pointAt2km.geometry.coordinates);
```

### ラインを等間隔に分割

```typescript
import { lineChunk } from '@turf/turf';

const route = lineString([
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
]);

// 1kmごとに分割
const segments = lineChunk(route, 1, { units: 'kilometers' });
console.log(`セグメント数: ${segments.features.length}`);
```

### 最も近いライン上の点

```typescript
import { nearestPointOnLine } from '@turf/turf';

const route = lineString([
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
]);

const userLocation = point([135.765, 35.000]);

// ユーザー位置から最も近い路線上の点
const snapped = nearestPointOnLine(route, userLocation);
console.log(`路線上の最寄り地点:`, snapped.geometry.coordinates);
console.log(`距離: ${snapped.properties.dist} km`);
```

### ラインの簡略化

```typescript
import { simplify } from '@turf/turf';

const detailedRoute = lineString([/* 多数の座標 */]);

// 許容誤差10mで簡略化
const simplified = simplify(detailedRoute, { tolerance: 0.01, highQuality: true });
```

---

## ポリゴン操作

### 面積の計算

```typescript
import { polygon, area } from '@turf/turf';

const kyotoArea = polygon([[
  [135.75, 35.00],
  [135.80, 35.00],
  [135.80, 35.05],
  [135.75, 35.05],
  [135.75, 35.00]
]]);

const areaInSqMeters = area(kyotoArea);
console.log(`面積: ${(areaInSqMeters / 1000000).toFixed(2)} km²`);
```

### バッファ（緩衝地帯）の作成

```typescript
import { buffer } from '@turf/turf';

const busStop = point([135.762, 35.0116]);

// バス停から500m圏内のエリア
const serviceArea = buffer(busStop, 0.5, { units: 'kilometers' });
```

### ポリゴンの結合

```typescript
import { union } from '@turf/turf';

const area1 = polygon([[
  [135.75, 35.00],
  [135.77, 35.00],
  [135.77, 35.02],
  [135.75, 35.02],
  [135.75, 35.00]
]]);

const area2 = polygon([[
  [135.76, 35.01],
  [135.78, 35.01],
  [135.78, 35.03],
  [135.76, 35.03],
  [135.76, 35.01]
]]);

const combined = union(area1, area2);
```

### ポリゴンの交差

```typescript
import { intersect } from '@turf/turf';

const overlap = intersect(area1, area2);
if (overlap) {
  console.log('重複エリアあり');
}
```

### 中心点の取得

```typescript
import { center, centroid } from '@turf/turf';

const area = polygon([[
  [135.75, 35.00],
  [135.80, 35.00],
  [135.80, 35.05],
  [135.75, 35.05],
  [135.75, 35.00]
]]);

// 境界ボックスの中心
const centerPoint = center(area);

// 重心（ポリゴンの形状を考慮）
const centroidPoint = centroid(area);
```

---

## 空間関係の判定

### ポイントがポリゴン内にあるか

```typescript
import { point, polygon, booleanPointInPolygon } from '@turf/turf';

const kyotoCity = polygon([[
  [135.70, 34.95],
  [135.85, 34.95],
  [135.85, 35.10],
  [135.70, 35.10],
  [135.70, 34.95]
]]);

const location = point([135.762, 35.0116]);

const isInKyoto = booleanPointInPolygon(location, kyotoCity);
console.log(`京都市内: ${isInKyoto}`); // true
```

### ラインの交差判定

```typescript
import { lineString, lineIntersect } from '@turf/turf';

const route1 = lineString([
  [135.75, 35.00],
  [135.80, 35.05]
]);

const route2 = lineString([
  [135.75, 35.05],
  [135.80, 35.00]
]);

const intersections = lineIntersect(route1, route2);
console.log(`交差点数: ${intersections.features.length}`);
```

### 包含判定

```typescript
import { booleanContains, booleanWithin } from '@turf/turf';

const largeArea = polygon([[/* 大きなエリア */]]);
const smallArea = polygon([[/* 小さなエリア */]]);

// largeAreaがsmallAreaを含むか
const contains = booleanContains(largeArea, smallArea);

// smallAreaがlargeArea内にあるか
const within = booleanWithin(smallArea, largeArea);
```

---

## 変換と投影

### 座標の変換

```typescript
import { toMercator, toWgs84 } from '@turf/turf';

const wgsPoint = point([135.762, 35.0116]);

// WGS84からWeb Mercatorへ
const mercatorPoint = toMercator(wgsPoint);

// Web MercatorからWGS84へ
const backToWgs = toWgs84(mercatorPoint);
```

### バウンディングボックス

```typescript
import { bbox, bboxPolygon } from '@turf/turf';

const route = lineString([
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
]);

// [minX, minY, maxX, maxY]
const bounds = bbox(route);
console.log(bounds); // [135.7292, 34.9857, 135.77, 35.0394]

// バウンディングボックスをポリゴンに変換
const boundingBox = bboxPolygon(bounds);
```

### フィーチャーコレクションの結合

```typescript
import { featureCollection, combine } from '@turf/turf';

const points = featureCollection([
  point([135.762, 35.0116]),
  point([135.768, 35.0120])
]);

const combined = combine(points);
```

---

## 集約と統計

### ポイントの集約

```typescript
import { clustersKmeans } from '@turf/turf';

const busStops = featureCollection([
  point([135.7581, 34.9857], { name: '京都駅' }),
  point([135.7700, 35.0039], { name: '四条河原町' }),
  point([135.7292, 35.0394], { name: '金閣寺道' }),
  // ... 他のバス停
]);

// K-meansクラスタリング（3つのグループに分類）
const clustered = clustersKmeans(busStops, { numberOfClusters: 3 });
```

### ポリゴン内のポイント数

```typescript
import { pointsWithinPolygon } from '@turf/turf';

const area = polygon([[
  [135.75, 35.00],
  [135.80, 35.00],
  [135.80, 35.05],
  [135.75, 35.05],
  [135.75, 35.00]
]]);

const points = featureCollection([
  point([135.762, 35.0116]),
  point([135.768, 35.0120]),
  point([135.900, 35.100]) // エリア外
]);

const pointsInArea = pointsWithinPolygon(points, area);
console.log(`エリア内のポイント数: ${pointsInArea.features.length}`);
```

### 凸包（Convex Hull）

```typescript
import { convex } from '@turf/turf';

const points = featureCollection([
  point([135.762, 35.0116]),
  point([135.768, 35.0120]),
  point([135.775, 35.0125]),
  point([135.770, 35.0110])
]);

// ポイント群を囲む最小の凸多角形
const hull = convex(points);
```

---

## バス路線での実践例

### 例1: バス停から最寄りの路線を見つける

```typescript
import { point, lineString, nearestPointOnLine, distance } from '@turf/turf';

interface BusRoute {
  id: string;
  name: string;
  coordinates: number[][];
}

function findNearestRoute(
  userLocation: [number, number],
  routes: BusRoute[]
): { route: BusRoute; distance: number; point: any } {
  const user = point(userLocation);
  
  let nearest = {
    route: routes[0],
    distance: Infinity,
    point: null
  };

  routes.forEach(route => {
    const line = lineString(route.coordinates);
    const snapped = nearestPointOnLine(line, user);
    const dist = distance(user, snapped, { units: 'meters' });

    if (dist < nearest.distance) {
      nearest = {
        route,
        distance: dist,
        point: snapped
      };
    }
  });

  return nearest;
}

// 使用例
const userLocation: [number, number] = [135.765, 35.010];
const routes: BusRoute[] = [
  {
    id: '205',
    name: '205系統',
    coordinates: [
      [135.7581, 34.9857],
      [135.7700, 35.0039],
      [135.7292, 35.0394]
    ]
  },
  // ... 他の路線
];

const result = findNearestRoute(userLocation, routes);
console.log(`最寄り路線: ${result.route.name}`);
console.log(`距離: ${result.distance.toFixed(0)}m`);
```

### 例2: バス停のカバレッジエリア計算

```typescript
import { point, buffer, union } from '@turf/turf';

interface BusStop {
  name: string;
  coordinates: [number, number];
}

function calculateServiceArea(
  busStops: BusStop[],
  radiusKm: number = 0.3
) {
  const buffers = busStops.map(stop => {
    const pt = point(stop.coordinates);
    return buffer(pt, radiusKm, { units: 'kilometers' });
  });

  // すべてのバッファを結合
  let serviceArea = buffers[0];
  for (let i = 1; i < buffers.length; i++) {
    const combined = union(serviceArea, buffers[i]);
    if (combined) serviceArea = combined;
  }

  return serviceArea;
}

// 使用例
const busStops: BusStop[] = [
  { name: '京都駅', coordinates: [135.7581, 34.9857] },
  { name: '四条河原町', coordinates: [135.7700, 35.0039] },
  { name: '金閣寺道', coordinates: [135.7292, 35.0394] },
];

const coverage = calculateServiceArea(busStops, 0.3);
console.log('バス停から300m圏内のカバレッジエリアを計算');
```

### 例3: 路線の進行方向を計算

```typescript
import { lineString, bearing, along } from '@turf/turf';

function getRouteDirection(coordinates: number[][]): number {
  const route = lineString(coordinates);
  const start = along(route, 0);
  const end = along(route, 0.1, { units: 'kilometers' });
  
  return bearing(start, end);
}

// 使用例
const routeCoords = [
  [135.7581, 34.9857],
  [135.7700, 35.0039],
  [135.7292, 35.0394]
];

const direction = getRouteDirection(routeCoords);
console.log(`進行方向: ${direction.toFixed(1)}°`);
```

### 例4: バス停間の距離と所要時間の推定

```typescript
import { point, distance } from '@turf/turf';

interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
}

function calculateStopDistances(stops: BusStop[]) {
  const results = [];
  
  for (let i = 0; i < stops.length - 1; i++) {
    const from = point(stops[i].coordinates);
    const to = point(stops[i + 1].coordinates);
    
    const dist = distance(from, to, { units: 'kilometers' });
    const estimatedTime = (dist / 20) * 60; // 時速20kmと仮定
    
    results.push({
      from: stops[i].name,
      to: stops[i + 1].name,
      distance: dist,
      estimatedMinutes: estimatedTime
    });
  }
  
  return results;
}

// 使用例
const stops: BusStop[] = [
  { id: '1', name: '京都駅', coordinates: [135.7581, 34.9857] },
  { id: '2', name: '四条河原町', coordinates: [135.7700, 35.0039] },
  { id: '3', name: '金閣寺道', coordinates: [135.7292, 35.0394] },
];

const distances = calculateStopDistances(stops);
distances.forEach(d => {
  console.log(`${d.from} → ${d.to}: ${d.distance.toFixed(2)}km (約${d.estimatedMinutes.toFixed(0)}分)`);
});
```

### 例5: ユーザー位置から徒歩圏内のバス停を検索

```typescript
import { point, featureCollection, pointsWithinPolygon, buffer } from '@turf/turf';

interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
}

function findNearbyStops(
  userLocation: [number, number],
  allStops: BusStop[],
  walkingDistanceKm: number = 0.5
): BusStop[] {
  const user = point(userLocation);
  const walkingArea = buffer(user, walkingDistanceKm, { units: 'kilometers' });
  
  const stopPoints = featureCollection(
    allStops.map(stop => 
      point(stop.coordinates, { id: stop.id, name: stop.name })
    )
  );
  
  const nearby = pointsWithinPolygon(stopPoints, walkingArea);
  
  return nearby.features.map(f => ({
    id: f.properties.id,
    name: f.properties.name,
    coordinates: f.geometry.coordinates as [number, number]
  }));
}

// 使用例
const userLocation: [number, number] = [135.762, 35.0116];
const allStops: BusStop[] = [
  { id: '1', name: '京都駅', coordinates: [135.7581, 34.9857] },
  { id: '2', name: '四条河原町', coordinates: [135.7700, 35.0039] },
  { id: '3', name: '金閣寺道', coordinates: [135.7292, 35.0394] },
];

const nearbyStops = findNearbyStops(userLocation, allStops, 0.5);
console.log(`徒歩圏内のバス停: ${nearbyStops.length}件`);
nearbyStops.forEach(stop => console.log(`- ${stop.name}`));
```

---

## よく使う関数一覧

### 測定系
- `distance()` - 2点間の距離
- `length()` - ラインの長さ
- `area()` - ポリゴンの面積
- `bearing()` - 方位角

### 座標計算
- `destination()` - 目的地の座標
- `midpoint()` - 中点
- `center()` - 中心点
- `centroid()` - 重心

### 空間関係
- `booleanPointInPolygon()` - ポイントがポリゴン内か
- `booleanContains()` - 包含判定
- `booleanWithin()` - 内包判定
- `lineIntersect()` - ライン交差

### 変換・生成
- `buffer()` - バッファ生成
- `union()` - 結合
- `intersect()` - 交差
- `simplify()` - 簡略化

### 検索・分析
- `nearestPoint()` - 最も近いポイント
- `nearestPointOnLine()` - ライン上の最寄り点
- `pointsWithinPolygon()` - ポリゴン内のポイント
- `along()` - ライン上の特定距離の点

---

## 参考リンク

- [Turf.js 公式ドキュメント](https://turfjs.org/)
- [Turf.js API リファレンス](https://turfjs.org/docs/)
- [GeoJSON 仕様](https://geojson.org/)
- [GitHub リポジトリ](https://github.com/Turfjs/turf)
