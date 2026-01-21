import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../gtfs.db');
const outputPath = path.join(__dirname, '../public/stops.geojson');

function stopsToGeoJSON() {
    const db = new Database(dbPath, { readonly: true });

    console.log('📍 GTFSのstopsテーブルをGeoJSONに変換中...\n');

    // stopsテーブルから全データを取得
    const stops = db.prepare(`
        SELECT 
            stop_id,
            stop_name,
            stop_lat,
            stop_lon,
            stop_code,
            stop_desc,
            zone_id,
            stop_url,
            location_type,
            parent_station,
            stop_timezone,
            wheelchair_boarding,
            platform_code
        FROM stops
        WHERE stop_lat IS NOT NULL AND stop_lon IS NOT NULL
    `).all();

    console.log(`✅ ${stops.length} 件のバス停を取得しました`);

    // GeoJSON形式に変換
    const geojson = {
        type: 'FeatureCollection',
        features: stops.map(stop => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [stop.stop_lon, stop.stop_lat]
            },
            properties: {
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                stop_code: stop.stop_code || null,
                stop_desc: stop.stop_desc || null,
                zone_id: stop.zone_id || null,
                stop_url: stop.stop_url || null,
                location_type: stop.location_type || 0,
                parent_station: stop.parent_station || null,
                wheelchair_boarding: stop.wheelchair_boarding || null,
                platform_code: stop.platform_code || null
            }
        }))
    };

    // ファイルに書き出し
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), 'utf-8');

    console.log(`📁 GeoJSONを出力しました: ${outputPath}`);
    console.log(`📊 Features数: ${geojson.features.length}`);

    db.close();

    return geojson;
}

stopsToGeoJSON();
