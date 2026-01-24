import * as turf from '@turf/turf';

// GeoJSON型定義
export interface StopProperties {
    stop_id: string;
    stop_name: string;
    stop_desc: string;
    stop_url: string;
    platform_code: string | null;
}

export interface StopFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: StopProperties;
}

export interface StopsGeoJSON {
    type: 'FeatureCollection';
    features: StopFeature[];
}

export interface NearestStop {
    name: string;
    desc: string;
    distance: number; // メートル
    url: string;
    coordinates: [number, number];
}

export interface UserLocation {
    latitude: number;
    longitude: number;
}

/**
 * 現在地から最寄りのバス停を検索する
 * @param userLocation ユーザーの位置情報
 * @param stopsData バス停のGeoJSONデータ
 * @param count 取得する最寄りバス停の数（デフォルト: 5）
 * @returns 最寄りのバス停リスト（距離順）
 */
export function findNearestStops(
    userLocation: UserLocation,
    stopsData: StopsGeoJSON,
    count: number = 5
): NearestStop[] {
    if (!stopsData || !stopsData.features || stopsData.features.length === 0) {
        return [];
    }

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

    // 距離でソートして上位N件を取得
    return stopsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, count);
}
