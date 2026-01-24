import { describe, it, expect } from 'vitest';
import type { findNearestStops, StopsGeoJSON, UserLocation } from './nearestStops';

// テスト用のサンプルデータ
const sampleStopsData: StopsGeoJSON = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.768, 35.007] },
            properties: {
                stop_id: '1',
                stop_name: '四条河原町',
                stop_desc: '四条通り北側',
                stop_url: 'https://example.com/stop1',
                platform_code: null,
            },
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.770, 35.010] },
            properties: {
                stop_id: '2',
                stop_name: '河原町三条',
                stop_desc: '三条通り南側',
                stop_url: 'https://example.com/stop2',
                platform_code: 'A',
            },
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.765, 35.005] },
            properties: {
                stop_id: '3',
                stop_name: '四条烏丸',
                stop_desc: '四条通り東側',
                stop_url: 'https://example.com/stop3',
                platform_code: null,
            },
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.775, 35.012] },
            properties: {
                stop_id: '4',
                stop_name: '京都市役所前',
                stop_desc: '御池通り',
                stop_url: 'https://example.com/stop4',
                platform_code: 'B',
            },
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.780, 35.015] },
            properties: {
                stop_id: '5',
                stop_name: '三条京阪',
                stop_desc: '三条通り東端',
                stop_url: 'https://example.com/stop5',
                platform_code: null,
            },
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135.790, 35.020] },
            properties: {
                stop_id: '6',
                stop_name: '東山三条',
                stop_desc: '東山通り',
                stop_url: 'https://example.com/stop6',
                platform_code: null,
            },
        },
    ],
};

const userLocation: UserLocation = {
    latitude: 35.007,
    longitude: 135.768,
};

describe('findNearestStops', () => {
    it('最寄りのバス停5件を距離順で返す', () => {
        const result = findNearestStops(userLocation, sampleStopsData, 5);

        expect(result).toHaveLength(5);
        // 最も近いバス停が最初に来ることを確認
        expect(result[0].name).toBe('四条河原町');
        expect(result[0].distance).toBe(0); // 同じ座標なので距離は0
    });

    it('指定した件数のバス停を返す', () => {
        const result = findNearestStops(userLocation, sampleStopsData, 3);

        expect(result).toHaveLength(3);
    });

    it('バス停の件数が指定より少ない場合は全件返す', () => {
        const result = findNearestStops(userLocation, sampleStopsData, 10);

        expect(result).toHaveLength(6);
    });

    it('距離が正しく計算される', () => {
        const result = findNearestStops(userLocation, sampleStopsData);

        // 距離が昇順でソートされていることを確認
        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].distance).toBeLessThanOrEqual(result[i + 1].distance);
        }
    });

    it('空のデータで空配列を返す', () => {
        const emptyData: StopsGeoJSON = {
            type: 'FeatureCollection',
            features: [],
        };

        const result = findNearestStops(userLocation, emptyData);

        expect(result).toHaveLength(0);
    });

    it('結果にバス停の情報が正しく含まれる', () => {
        const result = findNearestStops(userLocation, sampleStopsData, 1);

        expect(result[0]).toMatchObject({
            name: '四条河原町',
            desc: '四条通り北側',
            url: 'https://example.com/stop1',
            coordinates: [135.768, 35.007],
        });
    });
});
