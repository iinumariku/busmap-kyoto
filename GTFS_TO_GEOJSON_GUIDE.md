# GTFSライブラリでSQLiteテーブルをGeoJSONに書き出す方法

gtfsライブラリを使ってSQLiteデータベースからデータを取得し、GeoJSON形式で書き出す方法を説明します。

## 目次

1. [基本的な流れ](#基本的な流れ)
2. [バス停をGeoJSONに変換](#バス停をgeojsonに変換)
3. [路線をGeoJSONに変換](#路線をgeojsonに変換)
4. [運行ルートをGeoJSONに変換](#運行ルートをgeojsonに変換)
5. [複数のデータを一括変換](#複数のデータを一括変換)
6. [完全なスクリプト例](#完全なスクリプト例)

---

## 基本的な流れ

1. gtfsライブラリでSQLiteデータベースからデータを取得
2. 取得したデータをGeoJSON形式に変換
3. ファイルに書き出す

### 必要なパッケージ

```bash
npm install gtfs better-sqlite3
```

---

## バス停をGeoJSONに変換

### 基本的な変換

```javascript
import { getStops } from 'gtfs';
import fs from 'fs/promises';
import path from 'path';

async function exportStopsToGeoJSON() {
  // SQLiteからバス停データを取得
  const stops = await getStops();

  // GeoJSON FeatureCollectionを作成
  const geojson = {
    type: 'FeatureCollection',
    features: stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(stop.stop_lon),
          parseFloat(stop.stop_lat)
        ]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_code: stop.stop_code,
        stop_desc: stop.stop_desc,
        zone_id: stop.zone_id,
        stop_url: stop.stop_url,
        location_type: stop.location_type,
        parent_station: stop.parent_station,
        wheelchair_boarding: stop.wheelchair_boarding
      }
    }))
  };

  // ファイルに書き出し
  const outputPath = path.join(process.cwd(), 'output', 'stops.geojson');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));

  console.log(`✅ ${stops.length}件のバス停をGeoJSONに変換しました`);
  console.log(`出力先: ${outputPath}`);
}
```

### 特定の条件でフィルタリング

```javascript
async function exportFilteredStops() {
  // 特定の路線のバス停のみ取得
  const stops = await getStops({
    route_id: '205' // 205系統のバス停のみ
  });

  const geojson = {
    type: 'FeatureCollection',
    features: stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name
      }
    }))
  };

  await fs.writeFile('output/route_205_stops.geojson', JSON.stringify(geojson, null, 2));
}
```

---

## 路線をGeoJSONに変換

### 路線の基本情報

```javascript
import { getRoutes } from 'gtfs';

async function exportRoutesToGeoJSON() {
  const routes = await getRoutes();

  // 路線は線や面ではなく、属性情報として扱う
  // 実際の路線形状はshapes.txtから取得する必要があります
  const geojson = {
    type: 'FeatureCollection',
    features: routes.map(route => ({
      type: 'Feature',
      geometry: null, // 路線自体は幾何情報を持たない
      properties: {
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_type: route.route_type,
        route_color: route.route_color,
        route_text_color: route.route_text_color,
        agency_id: route.agency_id
      }
    }))
  };

  await fs.writeFile('output/routes.geojson', JSON.stringify(geojson, null, 2));
}
```

---

## 運行ルートをGeoJSONに変換

### Shapesテーブルから路線形状を取得

```javascript
import { getShapes } from 'gtfs';

async function exportShapesToGeoJSON() {
  const shapes = await getShapes();

  // shape_idごとにグループ化
  const shapeGroups = {};
  shapes.forEach(point => {
    if (!shapeGroups[point.shape_id]) {
      shapeGroups[point.shape_id] = [];
    }
    shapeGroups[point.shape_id].push(point);
  });

  // 各shape_idをLineStringに変換
  const features = Object.entries(shapeGroups).map(([shapeId, points]) => {
    // shape_pt_sequenceでソート
    const sortedPoints = points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedPoints.map(point => [
          parseFloat(point.shape_pt_lon),
          parseFloat(point.shape_pt_lat)
        ])
      },
      properties: {
        shape_id: shapeId,
        point_count: sortedPoints.length
      }
    };
  });

  const geojson = {
    type: 'FeatureCollection',
    features: features
  };

  await fs.writeFile('output/shapes.geojson', JSON.stringify(geojson, null, 2));
  console.log(`✅ ${features.length}件の路線形状をGeoJSONに変換しました`);
}
```

### 特定の路線の形状を取得

```javascript
import { getShapes, getTrips } from 'gtfs';

async function exportRouteShapeGeoJSON(routeId) {
  // 指定された路線のトリップを取得
  const trips = await getTrips({ route_id: routeId });
  
  if (trips.length === 0) {
    console.log(`路線 ${routeId} のトリップが見つかりません`);
    return;
  }

  // 最初のトリップのshape_idを使用
  const shapeId = trips[0].shape_id;
  
  if (!shapeId) {
    console.log(`路線 ${routeId} にshape_idが設定されていません`);
    return;
  }

  // shape_idに基づいて形状を取得
  const shapePoints = await getShapes({ shape_id: shapeId });
  
  // shape_pt_sequenceでソート
  const sortedPoints = shapePoints.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedPoints.map(point => [
          parseFloat(point.shape_pt_lon),
          parseFloat(point.shape_pt_lat)
        ])
      },
      properties: {
        route_id: routeId,
        shape_id: shapeId,
        trip_id: trips[0].trip_id,
        trip_headsign: trips[0].trip_headsign
      }
    }]
  };

  await fs.writeFile(`output/route_${routeId}_shape.geojson`, JSON.stringify(geojson, null, 2));
  console.log(`✅ 路線 ${routeId} の形状をGeoJSONに変換しました`);
}
```

---

## 複数のデータを一括変換

### すべてのGTFSデータをGeoJSONに変換

```javascript
import { getStops, getRoutes, getShapes, getTrips } from 'gtfs';
import fs from 'fs/promises';
import path from 'path';

async function exportAllToGeoJSON(outputDir = 'output') {
  // 出力ディレクトリを作成
  await fs.mkdir(outputDir, { recursive: true });

  console.log('📦 GTFSデータをGeoJSONに変換中...\n');

  // 1. バス停を変換
  console.log('1️⃣ バス停を変換中...');
  const stops = await getStops();
  const stopsGeoJSON = {
    type: 'FeatureCollection',
    features: stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_code: stop.stop_code
      }
    }))
  };
  await fs.writeFile(
    path.join(outputDir, 'stops.geojson'),
    JSON.stringify(stopsGeoJSON, null, 2)
  );
  console.log(`   ✅ ${stops.length}件のバス停を変換`);

  // 2. 路線形状を変換
  console.log('2️⃣ 路線形状を変換中...');
  const shapes = await getShapes();
  const shapeGroups = {};
  shapes.forEach(point => {
    if (!shapeGroups[point.shape_id]) {
      shapeGroups[point.shape_id] = [];
    }
    shapeGroups[point.shape_id].push(point);
  });

  const shapesGeoJSON = {
    type: 'FeatureCollection',
    features: Object.entries(shapeGroups).map(([shapeId, points]) => {
      const sortedPoints = points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: sortedPoints.map(p => [
            parseFloat(p.shape_pt_lon),
            parseFloat(p.shape_pt_lat)
          ])
        },
        properties: { shape_id: shapeId }
      };
    })
  };
  await fs.writeFile(
    path.join(outputDir, 'shapes.geojson'),
    JSON.stringify(shapesGeoJSON, null, 2)
  );
  console.log(`   ✅ ${Object.keys(shapeGroups).length}件の路線形状を変換`);

  // 3. 路線情報を変換
  console.log('3️⃣ 路線情報を変換中...');
  const routes = await getRoutes();
  const routesGeoJSON = {
    type: 'FeatureCollection',
    features: routes.map(route => ({
      type: 'Feature',
      geometry: null,
      properties: {
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_type: route.route_type,
        route_color: route.route_color
      }
    }))
  };
  await fs.writeFile(
    path.join(outputDir, 'routes.geojson'),
    JSON.stringify(routesGeoJSON, null, 2)
  );
  console.log(`   ✅ ${routes.length}件の路線情報を変換`);

  console.log('\n🎉 すべてのデータの変換が完了しました！');
  console.log(`出力先: ${path.resolve(outputDir)}`);
}
```

---

## 完全なスクリプト例

### export-geojson.js

```javascript
import { getStops, getRoutes, getShapes, getTrips, openDb } from 'gtfs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データベース設定
const config = {
  sqlitePath: path.join(__dirname, '../gtfs.db'),
  verbose: false
};

/**
 * バス停をGeoJSONに変換
 */
async function exportStops(outputDir) {
  const stops = await getStops();
  
  const geojson = {
    type: 'FeatureCollection',
    features: stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_code: stop.stop_code,
        stop_desc: stop.stop_desc,
        location_type: stop.location_type,
        parent_station: stop.parent_station
      }
    }))
  };

  const outputPath = path.join(outputDir, 'stops.geojson');
  await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));
  
  return { count: stops.length, path: outputPath };
}

/**
 * 路線形状をGeoJSONに変換
 */
async function exportShapes(outputDir) {
  const shapes = await getShapes();
  
  // shape_idでグループ化
  const shapeGroups = {};
  shapes.forEach(point => {
    if (!shapeGroups[point.shape_id]) {
      shapeGroups[point.shape_id] = [];
    }
    shapeGroups[point.shape_id].push(point);
  });

  const features = Object.entries(shapeGroups).map(([shapeId, points]) => {
    const sortedPoints = points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedPoints.map(point => [
          parseFloat(point.shape_pt_lon),
          parseFloat(point.shape_pt_lat)
        ])
      },
      properties: {
        shape_id: shapeId,
        point_count: sortedPoints.length,
        distance_traveled: sortedPoints[sortedPoints.length - 1]?.shape_dist_traveled || null
      }
    };
  });

  const geojson = {
    type: 'FeatureCollection',
    features: features
  };

  const outputPath = path.join(outputDir, 'shapes.geojson');
  await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));
  
  return { count: features.length, path: outputPath };
}

/**
 * 路線情報をGeoJSONに変換（形状付き）
 */
async function exportRoutesWithShapes(outputDir) {
  const routes = await getRoutes();
  const features = [];

  for (const route of routes) {
    // この路線の最初のトリップを取得
    const trips = await getTrips({ route_id: route.route_id }, [], [['trip_id', 'ASC']], 1);
    
    if (trips.length === 0 || !trips[0].shape_id) {
      // 形状がない場合はスキップ
      continue;
    }

    const shapeId = trips[0].shape_id;
    const shapePoints = await getShapes({ shape_id: shapeId });
    
    if (shapePoints.length === 0) {
      continue;
    }

    const sortedPoints = shapePoints.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedPoints.map(point => [
          parseFloat(point.shape_pt_lon),
          parseFloat(point.shape_pt_lat)
        ])
      },
      properties: {
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_type: route.route_type,
        route_color: route.route_color ? `#${route.route_color}` : null,
        route_text_color: route.route_text_color ? `#${route.route_text_color}` : null,
        shape_id: shapeId
      }
    });
  }

  const geojson = {
    type: 'FeatureCollection',
    features: features
  };

  const outputPath = path.join(outputDir, 'routes_with_shapes.geojson');
  await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));
  
  return { count: features.length, path: outputPath };
}

/**
 * メイン処理
 */
async function main() {
  try {
    // データベースを開く
    openDb(config);

    // 出力ディレクトリを作成
    const outputDir = path.join(__dirname, '../geojson_output');
    await fs.mkdir(outputDir, { recursive: true });

    console.log('🚀 GTFSデータをGeoJSONに変換中...\n');

    // バス停を変換
    console.log('📍 バス停を変換中...');
    const stopsResult = await exportStops(outputDir);
    console.log(`   ✅ ${stopsResult.count}件のバス停を変換`);
    console.log(`   📁 ${stopsResult.path}\n`);

    // 路線形状を変換
    console.log('🛣️  路線形状を変換中...');
    const shapesResult = await exportShapes(outputDir);
    console.log(`   ✅ ${shapesResult.count}件の路線形状を変換`);
    console.log(`   📁 ${shapesResult.path}\n`);

    // 路線情報（形状付き）を変換
    console.log('🚌 路線情報（形状付き）を変換中...');
    const routesResult = await exportRoutesWithShapes(outputDir);
    console.log(`   ✅ ${routesResult.count}件の路線を変換`);
    console.log(`   📁 ${routesResult.path}\n`);

    console.log('🎉 すべてのデータの変換が完了しました！');
    console.log(`📂 出力先: ${path.resolve(outputDir)}`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();
```

### package.jsonにスクリプトを追加

```json
{
  "scripts": {
    "export-geojson": "node scripts/export-geojson.js"
  }
}
```

### 実行方法

```bash
npm run export-geojson
```

---

## 出力されるGeoJSONの例

### stops.geojson

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [135.7581, 34.9857]
      },
      "properties": {
        "stop_id": "1001",
        "stop_name": "京都駅前",
        "stop_code": "KY001"
      }
    }
  ]
}
```

### shapes.geojson

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [135.7581, 34.9857],
          [135.7600, 34.9870],
          [135.7620, 34.9885]
        ]
      },
      "properties": {
        "shape_id": "shape_205_1",
        "point_count": 3
      }
    }
  ]
}
```

---

## よく使うgtfs関数

| 関数 | 説明 |
|------|------|
| `getStops(query)` | バス停データを取得 |
| `getRoutes(query)` | 路線データを取得 |
| `getShapes(query)` | 路線形状データを取得 |
| `getTrips(query)` | トリップ（運行）データを取得 |
| `getStopTimes(query)` | 停車時刻データを取得 |
| `getAgencies(query)` | 事業者データを取得 |
| `getCalendars(query)` | 運行カレンダーを取得 |

### クエリの例

```javascript
// 特定の路線のバス停
const stops = await getStops({ route_id: '205' });

// 特定のshape_idの形状
const shapes = await getShapes({ shape_id: 'shape_205_1' });

// 複数条件
const trips = await getTrips({
  route_id: '205',
  direction_id: 0
});
```

---

## 参考リンク

- [gtfs ライブラリ GitHub](https://github.com/BlinkTagInc/node-gtfs)
- [GTFS 仕様](https://gtfs.org/schedule/reference/)
- [GeoJSON 仕様](https://geojson.org/)
