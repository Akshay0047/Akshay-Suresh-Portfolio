import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check } from 'lucide-react';

const SOUND_ENABLED_KEY = 'portfolio-sound-enabled';
const MUSIC_ENABLED_KEY = 'portfolio-music-enabled';
const BRIGHTNESS_KEY = 'portfolio-brightness';
const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');

function resolveSound(path: string) {
  return `${assetBase}/${path.replace(/^\//, '')}`;
}

async function safePlay(audio: HTMLAudioElement) {
  try {
    await audio.play();
  } catch {
    // Browser autoplay policy or playback failure — fail silently.
  }
}

type SoundContextValue = {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isMusicEnabled: boolean;
  toggleMusic: () => void;
  brightness: number;
  setBrightness: (value: number) => void;
  startMusic: () => void;
  playKanji: () => void;
  playSlice: () => void;
  playDeath: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [isMusicEnabled, setIsMusicEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(MUSIC_ENABLED_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [brightness, setBrightnessState] = useState(() => {
    try {
      const stored = localStorage.getItem(BRIGHTNESS_KEY);
      if (stored === null) return 100;
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? Math.min(150, Math.max(50, parsed)) : 100;
    } catch {
      return 100;
    }
  });

  const kanjiAudioRef = useRef<HTMLAudioElement | null>(null);
  const sliceAudioRef = useRef<HTMLAudioElement | null>(null);
  const deathAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicUnlockedRef = useRef(false);

  useEffect(() => {
    const kanji = new Audio(resolveSound('sekiro_kanji.mp3'));
    const slice = new Audio(resolveSound('swordslice.mp3'));
    const death = new Audio(resolveSound('death.mp3'));
    kanji.preload = 'auto';
    slice.preload = 'auto';
    death.preload = 'auto';
    kanjiAudioRef.current = kanji;
    sliceAudioRef.current = slice;
    deathAudioRef.current = death;
  }, []);

  useEffect(() => {
    const music = new Audio(resolveSound('main-menu-theme.mp3'));
    music.loop = true;
    music.volume = 0.3;
    music.preload = 'auto';
    musicAudioRef.current = music;

    return () => {
      music.pause();
      musicAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const music = musicAudioRef.current;
    if (!music || !musicUnlockedRef.current) return;

    if (isMusicEnabled) {
      void safePlay(music);
      return;
    }

    music.pause();
  }, [isMusicEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem(SOUND_ENABLED_KEY, String(next));
      } catch {
        // Storage unavailable — keep in-memory toggle only.
      }
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem(MUSIC_ENABLED_KEY, String(next));
      } catch {
        // Storage unavailable — keep in-memory toggle only.
      }
      return next;
    });
  }, []);

  const setBrightness = useCallback((value: number) => {
    const next = Math.min(150, Math.max(50, value));
    setBrightnessState(next);
    try {
      localStorage.setItem(BRIGHTNESS_KEY, String(next));
    } catch {
      // Storage unavailable — keep in-memory value only.
    }
  }, []);

  const startMusic = useCallback(() => {
    musicUnlockedRef.current = true;
    const music = musicAudioRef.current;
    if (!music || !isMusicEnabled) return;
    void safePlay(music);
  }, [isMusicEnabled]);

  const playKanji = useCallback(() => {
    if (!isSoundEnabled) return;
    const source = kanjiAudioRef.current;
    if (!source) return;
    try {
      source.currentTime = 0;
      void safePlay(source);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled]);

  const playSlice = useCallback(() => {
    if (!isSoundEnabled) return;
    const source = sliceAudioRef.current;
    if (!source) return;
    try {
      const clone = source.cloneNode(true) as HTMLAudioElement;
      void safePlay(clone);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled]);

  const playDeath = useCallback(() => {
    if (!isSoundEnabled) return;
    const source = deathAudioRef.current;
    if (!source) return;
    try {
      source.currentTime = 0;
      void safePlay(source);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled]);

  const value = useMemo(
    () => ({
      isSoundEnabled,
      toggleSound,
      isMusicEnabled,
      toggleMusic,
      brightness,
      setBrightness,
      startMusic,
      playKanji,
      playSlice,
      playDeath,
    }),
    [
      isSoundEnabled,
      toggleSound,
      isMusicEnabled,
      toggleMusic,
      brightness,
      setBrightness,
      startMusic,
      playKanji,
      playSlice,
      playDeath,
    ],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
}

export function BrightnessShell({ children }: { children: ReactNode }) {
  const { brightness } = useSound();

  return (
    <div
      className="h-full min-h-0 transition-[filter] duration-300"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {children}
    </div>
  );
}

export function SoundEffectsOption() {
  const { isSoundEnabled, toggleSound } = useSound();

  return (
    <button type="button" className="option-row option-row-button" onClick={toggleSound}>
      <span>SOUND EFFECTS</span>
      <b>SFX: {isSoundEnabled ? 'ON' : 'OFF'}</b>
      {isSoundEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
    </button>
  );
}

export function BackgroundMusicOption() {
  const { isMusicEnabled, toggleMusic } = useSound();

  return (
    <button type="button" className="option-row option-row-button" onClick={toggleMusic}>
      <span>BACKGROUND MUSIC</span>
      <b>BGM: {isMusicEnabled ? 'ON' : 'OFF'}</b>
      {isMusicEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
    </button>
  );
}

export function BrightnessSlider() {
  const { brightness, setBrightness } = useSound();

  return (
    <div className="flex flex-col gap-2 mt-4">
      <label className="text-sm text-[#a3907c] tracking-widest uppercase" htmlFor="brightness-slider">
        Brightness
      </label>
      <div className="flex items-center gap-4">
        <input
          id="brightness-slider"
          type="range"
          min="50"
          max="150"
          value={brightness}
          onChange={(event) => setBrightness(Number(event.target.value))}
          className="w-64 appearance-none h-1.5 bg-[#141210] border border-[#2a241d] outline-none
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-[#b8976a] [&::-webkit-slider-thumb]:rotate-45
                     [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#e8d4b4]
                     [&::-webkit-slider-thumb]:transition-colors"
        />
        <span className="text-xs font-mono text-[#8c7a6b]">{brightness}%</span>
      </div>
    </div>
  );
}

export function SettingsOptionsPanel() {
  return (
    <>
      <SoundEffectsOption />
      <BackgroundMusicOption />
      <BrightnessSlider />
    </>
  );
}
