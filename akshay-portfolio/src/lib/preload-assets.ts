import '@google/model-viewer';

const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');
const GPU_DECODE_BUFFER_MS = 420;

export const CORE_ASSET_PATHS = [
  'combat-art.png',
  'portrait.jpg',
  'portrait.png',
  'kunai.glb',
  'Akshay_Resume.pdf',
  'favicon.svg',
] as const;

const IMAGE_ASSET_PATHS = CORE_ASSET_PATHS.filter((path) => /\.(png|jpe?g|svg|webp|gif)$/i.test(path));
const KUNAI_ASSET_PATH = 'kunai.glb';

const imageCache = new Map<string, HTMLImageElement>();

export function getPreloadedImage(url: string) {
  return imageCache.get(url);
}

function resolveAsset(path: string) {
  return `${assetBase}/${path.replace(/^\//, '')}`;
}

async function fetchAsset(
  url: string,
  onBytes: (loaded: number, total: number | null) => void,
): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to preload ${url}: ${response.status}`);
  }

  const total = Number(response.headers.get('content-length')) || null;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onBytes(buffer.byteLength, buffer.byteLength);
    return new Blob([buffer]);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onBytes(loaded, total);
  }

  const blob = new Blob(chunks as BlobPart[]);
  onBytes(blob.size, blob.size);
  return blob;
}

async function cacheImageUrl(url: string): Promise<void> {
  let image = imageCache.get(url);
  if (!image) {
    image = new Image();
    image.decoding = 'async';
    imageCache.set(url, image);
  }

  image.src = url;

  if (image.complete && image.naturalWidth > 0) {
    if (image.decode) {
      await image.decode().catch(() => undefined);
    }
    return;
  }

  if (image.decode) {
    await image.decode();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    image!.onload = () => resolve();
    image!.onerror = () => reject(new Error(`Failed to cache image ${url}`));
  });
}

type ModelViewerElement = HTMLElement & {
  loaded?: boolean;
};

async function preloadKunaiModel(url: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const viewer = document.createElement('model-viewer') as ModelViewerElement;
    viewer.setAttribute('src', url);
    viewer.setAttribute('shadow-intensity', '1');
    viewer.setAttribute('camera-orbit', '-45deg 55deg auto');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('loading', 'eager');
    viewer.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:-9999px',
      'width:320px',
      'height:320px',
      'opacity:0',
      'pointer-events:none',
      'visibility:hidden',
    ].join(';');

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 12000);

    const finish = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cleanup();
          resolve();
        });
      });
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to compile model-viewer asset ${url}`));
    };

    function cleanup() {
      window.clearTimeout(timeout);
      viewer.removeEventListener('load', finish);
      viewer.removeEventListener('error', onError);
      viewer.remove();
    }

    viewer.addEventListener('load', finish, { once: true });
    viewer.addEventListener('error', onError, { once: true });
    document.body.appendChild(viewer);

    if (viewer.loaded) {
      finish();
    }
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function preloadCoreAssets(onProgress: (percent: number) => void): Promise<void> {
  const urls = CORE_ASSET_PATHS.map(resolveAsset);
  const imageUrls = IMAGE_ASSET_PATHS.map(resolveAsset);
  const kunaiUrl = resolveAsset(KUNAI_ASSET_PATH);

  const bytesLoaded = new Map<string, number>();
  const bytesTotal = new Map<string, number>();
  let fontsReady = false;

  const fetchWeight = 0.68;
  const imageWeight = 0.14;
  const modelWeight = 0.1;
  const fontWeight = 0.08;

  let imagesReady = false;
  let modelReady = false;

  const reportProgress = () => {
    let loaded = 0;
    let total = 0;

    for (const url of urls) {
      loaded += bytesLoaded.get(url) ?? 0;
      total += bytesTotal.get(url) ?? 0;
    }

    const fetchRatio = total > 0 ? loaded / total : 0;
    const imageRatio = imagesReady ? 1 : 0;
    const modelRatio = modelReady ? 1 : 0;
    const fontRatio = fontsReady ? 1 : 0;

    const percent = Math.min(
      99,
      Math.round(
        (fetchRatio * fetchWeight
          + imageRatio * imageWeight
          + modelRatio * modelWeight
          + fontRatio * fontWeight)
          * 100,
      ),
    );

    onProgress(percent);
  };

  const fontPromise = (document.fonts?.ready ?? Promise.resolve()).then(() => {
    fontsReady = true;
    reportProgress();
  });

  const assetPromises = urls.map(async (url) => {
    try {
      const blob = await fetchAsset(url, (loaded, total) => {
        bytesLoaded.set(url, loaded);
        if (total) bytesTotal.set(url, total);
        reportProgress();
      });

      const finalSize = bytesTotal.get(url) ?? blob.size;
      bytesLoaded.set(url, finalSize);
      bytesTotal.set(url, finalSize);
      reportProgress();
    } catch (error) {
      console.warn(`[preload] Skipping failed asset: ${url}`, error);
      bytesLoaded.set(url, 1);
      bytesTotal.set(url, 1);
      reportProgress();
    }
  });

  await Promise.all([fontPromise, ...assetPromises]);

  try {
    await Promise.all(imageUrls.map((url) => cacheImageUrl(url)));
  } catch (error) {
    console.warn('[preload] Image URL cache failed:', error);
  } finally {
    imagesReady = true;
    reportProgress();
  }

  try {
    await preloadKunaiModel(kunaiUrl);
  } catch (error) {
    console.warn('[preload] Kunai model-viewer warmup failed:', error);
  } finally {
    modelReady = true;
    reportProgress();
  }

  onProgress(99);
  await wait(GPU_DECODE_BUFFER_MS);
  onProgress(100);
}
