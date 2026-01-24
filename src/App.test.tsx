import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// MapLibreとreact-map-glをモック
vi.mock('react-map-gl/maplibre', () => ({
    default: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="map">{children}</div>
    ),
    Marker: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="marker">{children}</div>
    ),
    Popup: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="popup">{children}</div>
    ),
}));

vi.mock('maplibre-gl', () => ({
    default: {},
}));

// fetchをモック
const mockStopsData = {
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
    ],
};

// fetchモックを変数で保持
let mockFetch: ReturnType<typeof vi.fn>;

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // fetchのモック
        mockFetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve(mockStopsData),
        });
        vi.stubGlobal('fetch', mockFetch);

        // geolocationのモック
        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                success({
                    coords: {
                        latitude: 35.007,
                        longitude: 135.768,
                    },
                })
            ),
        };
        vi.stubGlobal('navigator', {
            geolocation: mockGeolocation,
        });
    });

    it('アプリがレンダリングされる', () => {
        render(<App />);

        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('地図が表示される', async () => {
        render(<App />);

        const map = screen.getByTestId('map');
        expect(map).toBeInTheDocument();
    });

    it('バス停データを取得してマーカーを表示する', async () => {
        render(<App />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/stops.geojson');
        });

        await waitFor(() => {
            const markers = screen.getAllByTestId('marker');
            // ユーザー位置マーカー + バス停マーカー
            expect(markers.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('最寄りバス停リストが表示される', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('🚌 最寄りのバス停')).toBeInTheDocument();
        });
    });

    it('リストをクリックすると展開/折りたたみできる', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('🚌 最寄りのバス停')).toBeInTheDocument();
        });

        const header = screen.getByText('🚌 最寄りのバス停');
        fireEvent.click(header);

        // 展開されたらバス停名が表示される
        await waitFor(() => {
            expect(screen.getByText('四条河原町')).toBeInTheDocument();
        });
    });
});
