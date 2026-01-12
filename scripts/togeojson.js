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

    console.log(`${stops.length}件のバス停をGeoJSONに変換しました`);
    console.log(`出力先: ${outputPath}`);
}