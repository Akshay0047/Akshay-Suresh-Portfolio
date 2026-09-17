import '@google/model-viewer';

const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Critical assets only — everything else loads on demand. */
export const CORE_IMAGE_PATHS = ['portrait.webp'] as const;
export const CORE_AUDIO_PATHS = ['sekiro_kanji.mp3'] as const;

const imageCache = new Map<string, HTMLImageElement>();

export function getPreloadedImage(url: string) {
  return imageCache.get(url);
}

function resolveAsset(path: string) {
  return `${assetBase}/${path.replace(/^\//, '')}`;
}

function isAudioSrc(src: string) {
  return /\.(mp3|wav|ogg|m4a)$/i.test(src);
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let image = imageCache.get(url);
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      imageCache.set(url, image);
    }

    if (image.complete && image.naturalWidth > 0) {
      resolve();
      return;
    }

    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to preload image ${url}`));
    image.src = url;
  });
}

function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    const finish = () => {
      cleanup();
      resolve();
    };

    const fail = () => {
      cleanup();
      reject(new Error(`Failed to preload audio ${url}`));
    };

    const cleanup = () => {
      audio.removeEventListener('canplaythrough', finish);
      audio.removeEventListener('loadeddata', finish);
      audio.removeEventListener('error', fail);
    };

    audio.addEventListener('canplaythrough', finish, { once: true });
    audio.addEventListener('loadeddata', finish, { once: true });
    audio.addEventListener('error', fail, { once: true });
    audio.src = url;
    audio.load();
  });
}

type ModelViewerElement = HTMLElement & {
  loaded?: boolean;
};

export async function preloadKunaiModel(url: string): Promise<void> {
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
    }, 20000);

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

export async function preloadCoreAssets(onProgress: (percent: number) => void): Promise<void> {
  const imageUrls = CORE_IMAGE_PATHS.map(resolveAsset);
  const audioUrls = CORE_AUDIO_PATHS.map(resolveAsset);

  const tasks: Array<{ label: string; run: () => Promise<void> }> = [
    ...imageUrls.map((url, index) => ({
      label: `image:${CORE_IMAGE_PATHS[index]}`,
      run: () => preloadImage(url),
    })),
    ...audioUrls.map((url, index) => ({
      label: `audio:${CORE_AUDIO_PATHS[index]}`,
      run: () => preloadAudio(url),
    })),
    {
      label: 'fonts',
      run: async () => {
        await (document.fonts?.ready ?? Promise.resolve());
      },
    },
  ];

  const totalAssets = tasks.length;
  let loadedAssets = 0;

  const report = () => {
    const percent = totalAssets === 0 ? 100 : Math.round((loadedAssets / totalAssets) * 100);
    onProgress(percent);
  };

  report();

  await Promise.all(
    tasks.map(async (task) => {
      try {
        await task.run();
      } catch {
        // Skip failed assets so loading can continue.
      } finally {
        loadedAssets += 1;
        report();
      }
    }),
  );

  onProgress(100);
}

export { isAudioSrc, preloadImage, preloadAudio };
