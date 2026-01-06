import { importGtfs, getAgencies, getRoutes, getStops, getTrips } from 'gtfs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GTFSデータのパスとSQLiteデータベースの設定
const config = {
    agencies: [
        {
            // GTFSデータのパス
            path: path.join(__dirname, '../gtfs_data'),
        }
    ],
    // SQLiteデータベースの出力先
    sqlitePath: path.join(__dirname, '../gtfs.db'),
    // ログレベル
    verbose: true,
};

async function importGTFSData() {
    try {
        console.log('GTFSデータのインポートを開始します...');
        console.log(`データソース: ${config.agencies[0].path}`);
        console.log(`出力先: ${config.sqlitePath}`);

        // GTFSデータをSQLiteにインポート
        await importGtfs(config);

        console.log('✅ GTFSデータのインポートが完了しました！');

        // インポートされたデータの統計を表示
        const agencies = await getAgencies();
        const routes = await getRoutes();
        const stops = await getStops();
        const trips = await getTrips();

        console.log('\n📊 インポートされたデータの統計:');
        console.log(`- 事業者数: ${agencies.length}`);
        console.log(`- 路線数: ${routes.length}`);
        console.log(`- バス停数: ${stops.length}`);
        console.log(`- 運行数: ${trips.length}`);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        process.exit(1);
    }
}

// スクリプトを実行
importGTFSData();
