import { describe, it, expect, vi, afterEach } from 'vitest';
import { compressImage } from './imageCompressor';

describe('imageCompressor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads and scales down an image exceeding 1280px to JPEG at 0.8 quality', async () => {
    const fakeDataUrl = 'data:image/png;base64,mockpng';

    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: fakeDataUrl } });
          }
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    class MockImage {
      width = 2560;
      height = 1440;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    const mockDrawImage = vi.fn();
    const mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,compressedjpeg');

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
            drawImage: mockDrawImage,
          }),
          toDataURL: mockToDataURL,
        } as unknown as HTMLCanvasElement;
      }
      return origCreateElement(tagName);
    });

    const file = new File(['dummy content'], 'room.png', { type: 'image/png' });
    const result = await compressImage(file);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.dataUrl).toBe('data:image/jpeg;base64,compressedjpeg');
    // 2560x1440 scaled to max 1280 should be 1280x720
    expect(mockDrawImage).toHaveBeenCalledWith(expect.any(MockImage), 0, 0, 1280, 720);
    expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });
});
