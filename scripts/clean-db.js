import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../gtfs.db');

async function cleanEmptyTables() {
    try {
        console.log('SQLiteデータベースを開いています...');
        const db = new Database(dbPath);

        // すべてのテーブルを取得
        const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    `).all();

        console.log(`\n📋 全テーブル数: ${tables.length}\n`);

        const emptyTables = [];
        const nonEmptyTables = [];

        // 各テーブルの行数をチェック
        for (const table of tables) {
            const result = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
            const count = result.count;

            if (count === 0) {
                emptyTables.push(table.name);
                console.log(`❌ ${table.name}: ${count} 行 (削除対象)`);
            } else {
                nonEmptyTables.push({ name: table.name, count });
                console.log(`✅ ${table.name}: ${count} 行`);
            }
        }

        // 空のテーブルを削除
        if (emptyTables.length > 0) {
            console.log(`\n🗑️  ${emptyTables.length}個の空のテーブルを削除します...`);

            for (const tableName of emptyTables) {
                db.prepare(`DROP TABLE ${tableName}`).run();
                console.log(`   削除: ${tableName}`);
            }

            // VACUUMでデータベースを最適化
            console.log('\n🔧 データベースを最適化しています...');
            db.prepare('VACUUM').run();

            console.log('\n✅ クリーンアップが完了しました！');
        } else {
            console.log('\n✅ 空のテーブルはありません。');
        }

        // 最終的な統計
        console.log('\n📊 最終的なテーブル統計:');
        console.log(`- 残存テーブル数: ${nonEmptyTables.length}`);
        console.log(`- 削除されたテーブル数: ${emptyTables.length}`);

        if (nonEmptyTables.length > 0) {
            console.log('\n残存テーブルの詳細:');
            nonEmptyTables
                .sort((a, b) => b.count - a.count)
                .forEach(table => {
                    console.log(`  - ${table.name}: ${table.count.toLocaleString()} 行`);
                });
        }

        db.close();

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        process.exit(1);
    }
}

cleanEmptyTables();
