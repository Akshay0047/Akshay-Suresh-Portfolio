import '@google/model-viewer';

const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');
const portraitSrc = `${assetBase}/portrait.jpg`;
const kunaiSrc = `${assetBase}/kunai.glb`;

export function AssetWarmup() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-0"
      style={{ visibility: 'hidden' }}
    >
      <img src={portraitSrc} alt="" width={420} height={620} decoding="async" fetchPriority="high" />
      <model-viewer
        src={kunaiSrc}
        shadow-intensity="1"
        interaction-prompt="none"
        camera-orbit="-45deg 55deg auto"
        style={{ width: 320, height: 320, backgroundColor: 'transparent' }}
      />
    </div>
  );
}
