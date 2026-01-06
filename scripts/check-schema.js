import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../gtfs.db');

function checkSchema() {
    const db = new Database(dbPath);

    const tables = ['stops', 'stop_times', 'trips', 'routes'];

    console.log('📋 GTFSテーブルのスキーマ情報\n');

    tables.forEach(tableName => {
        console.log(`\n━━━ ${tableName.toUpperCase()} テーブル ━━━`);

        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();

        console.log('カラム:');
        schema.forEach(col => {
            const pk = col.pk ? ' [PRIMARY KEY]' : '';
            console.log(`  - ${col.name} (${col.type})${pk}`);
        });

        // サンプルデータを1件表示
        const sample = db.prepare(`SELECT * FROM ${tableName} LIMIT 1`).get();
        if (sample) {
            console.log('\nサンプルデータ:');
            Object.entries(sample).slice(0, 8).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        }
    });

    // 結合クエリの例を実行
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 STOPSとROUTESを結合するクエリ例');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const query = `
    SELECT DISTINCT
      s.stop_id,
      s.stop_name,
      s.stop_lat,
      s.stop_lon,
      r.route_id,
      r.route_short_name,
      r.route_long_name,
      r.route_type
    FROM stops s
    INNER JOIN stop_times st ON s.stop_id = st.stop_id
    INNER JOIN trips t ON st.trip_id = t.trip_id
    INNER JOIN routes r ON t.route_id = r.route_id
    LIMIT 5
  `;

    console.log('クエリ:');
    console.log(query);

    const results = db.prepare(query).all();

    console.log('\n結果 (最初の5件):');
    results.forEach((row, i) => {
        console.log(`\n${i + 1}. バス停: ${row.stop_name} (${row.stop_id})`);
        console.log(`   位置: ${row.stop_lat}, ${row.stop_lon}`);
        console.log(`   路線: ${row.route_short_name} - ${row.route_long_name}`);
    });

    // 特定のバス停を通る全路線を取得する例
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 特定のバス停を通る全路線を取得');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stopQuery = `
    SELECT DISTINCT
      r.route_short_name,
      r.route_long_name,
      COUNT(DISTINCT t.trip_id) as trip_count
    FROM stops s
    INNER JOIN stop_times st ON s.stop_id = st.stop_id
    INNER JOIN trips t ON st.trip_id = t.trip_id
    INNER JOIN routes r ON t.route_id = r.route_id
    WHERE s.stop_id = (SELECT stop_id FROM stops LIMIT 1)
    GROUP BY r.route_id, r.route_short_name, r.route_long_name
    ORDER BY r.route_short_name
  `;

    const stopResults = db.prepare(stopQuery).all();
    const firstStop = db.prepare('SELECT stop_id, stop_name FROM stops LIMIT 1').get();

    console.log(`バス停: ${firstStop.stop_name} (${firstStop.stop_id})`);
    console.log(`通過する路線数: ${stopResults.length}\n`);

    stopResults.slice(0, 10).forEach(row => {
        console.log(`  ${row.route_short_name}: ${row.route_long_name} (${row.trip_count}便)`);
    });

    if (stopResults.length > 10) {
        console.log(`  ... 他 ${stopResults.length - 10} 路線`);
    }

    db.close();
}

checkSchema();
