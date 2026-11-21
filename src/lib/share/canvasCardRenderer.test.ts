import { describe, it, expect, vi } from 'vitest';
import { renderWhatsAppCardCanvas } from './canvasCardRenderer';

describe('canvasCardRenderer', () => {
  it('renders card to canvas with 800x1050 dimensions and returns PNG data URL', () => {
    const mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mocksharecardpng'),
    } as unknown as HTMLCanvasElement;

    const dataUrl = renderWhatsAppCardCanvas(mockCanvas, {
      cityName: 'Delhi',
      aqi: 345,
      pm25: 185.5,
      category: 'Very Poor',
      categoryMeta: { chipBg: '#DC2626', textColor: '#FFFFFF' },
      bestRange: '1:00 PM – 3:00 PM',
      worstRange: '7:00 AM – 9:00 AM',
      dominantPollutant: 'PM2.5',
      dataSource: 'Open-Meteo Model Forecast',
      noSafeWindowAvailable: false,
    });

    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(1050);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 1050);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Delhi', 50, 125);
    expect(mockCtx.fillText).toHaveBeenCalledWith('345', 80, 230);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Very Poor', 385, 223);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    expect(dataUrl).toBe('data:image/png;base64,mocksharecardpng');
  });

  it('renders critical alert notice when no safe window is available', () => {
    const mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,alertpng'),
    } as unknown as HTMLCanvasElement;

    renderWhatsAppCardCanvas(mockCanvas, {
      cityName: 'Kanpur',
      aqi: 420,
      pm25: 280,
      category: 'Severe',
      categoryMeta: { chipBg: '#7F1D1D', textColor: '#FFFFFF' },
      bestRange: '2:00 PM – 4:00 PM',
      worstRange: '6:00 AM – 9:00 AM',
      dominantPollutant: 'PM2.5',
      noSafeWindowAvailable: true,
    });

    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'Least-polluted window: 2:00 PM – 4:00 PM',
      75,
      355
    );
  });
});
