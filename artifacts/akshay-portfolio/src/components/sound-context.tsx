import {
  createContext,
  type KeyboardEvent,
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
const MOTION_ENABLED_KEY = 'portfolio-motion-enabled';
const INPUT_ENABLED_KEY = 'portfolio-input-enabled';
const SFX_VOLUME_KEY = 'portfolio-sfx-volume';
const MUSIC_VOLUME_KEY = 'portfolio-music-volume';
const BRIGHTNESS_KEY = 'portfolio-brightness';
const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');

const COMPACT_SLIDER_CLASS =
  'w-48 appearance-none h-1 bg-[#141210] border border-[#2a241d] outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#b8976a] [&::-webkit-slider-thumb]:rotate-45 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#e8d4b4]';

function resolveSound(path: string) {
  return `${assetBase}/${path.replace(/^\//, '')}`;
}

function readVolume(key: string, fallback: number) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : fallback;
  } catch {
    return fallback;
  }
}

async function safePlay(audio: HTMLAudioElement) {
  try {
    await audio.play();
  } catch {
    // Browser autoplay policy or playback failure — fail silently.
  }
}

function readBoolean(key: string, fallback: boolean) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

function persistBoolean(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable — keep in-memory value only.
  }
}

type SoundContextValue = {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isMusicEnabled: boolean;
  toggleMusic: () => void;
  isMotionEnabled: boolean;
  toggleMotion: () => void;
  isInputEnabled: boolean;
  toggleInput: () => void;
  sfxVolume: number;
  setSfxVolume: (value: number) => void;
  musicVolume: number;
  setMusicVolume: (value: number) => void;
  brightness: number;
  setBrightness: (value: number) => void;
  startMusic: () => void;
  playKanji: () => void;
  playSlice: () => void;
  playDeath: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => readBoolean(SOUND_ENABLED_KEY, true));
  const [isMusicEnabled, setIsMusicEnabled] = useState(() => readBoolean(MUSIC_ENABLED_KEY, true));
  const [isMotionEnabled, setIsMotionEnabled] = useState(() => readBoolean(MOTION_ENABLED_KEY, true));
  const [isInputEnabled, setIsInputEnabled] = useState(() => readBoolean(INPUT_ENABLED_KEY, true));
  const [sfxVolume, setSfxVolumeState] = useState(() => readVolume(SFX_VOLUME_KEY, 50));
  const [musicVolume, setMusicVolumeState] = useState(() => readVolume(MUSIC_VOLUME_KEY, 30));
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
    music.preload = 'auto';
    musicAudioRef.current = music;

    return () => {
      music.pause();
      musicAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const music = musicAudioRef.current;
    if (!music) return;

    music.volume = musicVolume / 100;
    if (!musicUnlockedRef.current) return;

    if (isMusicEnabled && musicVolume > 0) {
      void safePlay(music);
      return;
    }

    music.pause();
  }, [isMusicEnabled, musicVolume]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((current) => {
      const next = !current;
      persistBoolean(SOUND_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled((current) => {
      const next = !current;
      persistBoolean(MUSIC_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const toggleMotion = useCallback(() => {
    setIsMotionEnabled((current) => {
      const next = !current;
      persistBoolean(MOTION_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const toggleInput = useCallback(() => {
    setIsInputEnabled((current) => {
      const next = !current;
      persistBoolean(INPUT_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const setSfxVolume = useCallback((value: number) => {
    const next = Math.min(100, Math.max(0, value));
    setSfxVolumeState(next);
    try {
      localStorage.setItem(SFX_VOLUME_KEY, String(next));
    } catch {
      // Storage unavailable — keep in-memory value only.
    }
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    const next = Math.min(100, Math.max(0, value));
    setMusicVolumeState(next);
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(next));
    } catch {
      // Storage unavailable — keep in-memory value only.
    }
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
    if (!music || !isMusicEnabled || musicVolume <= 0) return;
    music.volume = musicVolume / 100;
    void safePlay(music);
  }, [isMusicEnabled, musicVolume]);

  const playKanji = useCallback(() => {
    if (!isSoundEnabled || sfxVolume <= 0) return;
    const source = kanjiAudioRef.current;
    if (!source) return;
    try {
      const clone = source.cloneNode(true) as HTMLAudioElement;
      clone.volume = sfxVolume / 100;
      clone.currentTime = 0.1;
      void safePlay(clone);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled, sfxVolume]);

  const playSlice = useCallback(() => {
    if (!isSoundEnabled || sfxVolume <= 0) return;
    const source = sliceAudioRef.current;
    if (!source) return;
    try {
      const clone = source.cloneNode(true) as HTMLAudioElement;
      clone.volume = sfxVolume / 100;
      void safePlay(clone);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled, sfxVolume]);

  const playDeath = useCallback(() => {
    if (!isSoundEnabled || sfxVolume <= 0) return;
    const source = deathAudioRef.current;
    if (!source) return;
    try {
      source.volume = sfxVolume / 100;
      source.currentTime = 0;
      void safePlay(source);
    } catch {
      // Silent fallback for environments that block audio setup.
    }
  }, [isSoundEnabled, sfxVolume]);

  const value = useMemo(
    () => ({
      isSoundEnabled,
      toggleSound,
      isMusicEnabled,
      toggleMusic,
      isMotionEnabled,
      toggleMotion,
      isInputEnabled,
      toggleInput,
      sfxVolume,
      setSfxVolume,
      musicVolume,
      setMusicVolume,
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
      isMotionEnabled,
      toggleMotion,
      isInputEnabled,
      toggleInput,
      sfxVolume,
      setSfxVolume,
      musicVolume,
      setMusicVolume,
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

function handleToggleKeyDown(event: KeyboardEvent, toggle: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  }
}

export function InterfaceOption() {
  return (
    <div className="option-row">
      <span>INTERFACE</span>
      <div className="relative group col-span-2 flex cursor-default items-center justify-end gap-3">
        <b>GAME MENU</b>
        <Check size={15} />
        <span className="absolute -top-6 right-0 w-max text-[#b8976a] text-xs font-serif tracking-normal opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm group-hover:blur-none">
          heh, you can&apos;t change that lol :p
        </span>
      </div>
    </div>
  );
}

export function MotionOption() {
  const { isMotionEnabled, toggleMotion } = useSound();

  return (
    <div className="option-row">
      <span>MOTION</span>
      <div
        className="option-row-toggle flex items-center gap-3"
        onClick={toggleMotion}
        onKeyDown={(event) => handleToggleKeyDown(event, toggleMotion)}
        role="button"
        tabIndex={0}
      >
        <b>{isMotionEnabled ? 'ENABLED' : 'DISABLED'}</b>
        {isMotionEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
      </div>
      <span className="option-row-spacer" aria-hidden="true" />
    </div>
  );
}

export function InputOption() {
  const { isInputEnabled, toggleInput } = useSound();

  return (
    <div className="option-row">
      <span>INPUT</span>
      <div
        className="option-row-toggle flex items-center gap-3"
        onClick={toggleInput}
        onKeyDown={(event) => handleToggleKeyDown(event, toggleInput)}
        role="button"
        tabIndex={0}
      >
        <b>{isInputEnabled ? 'WASD / ARROWS' : 'DISABLED'}</b>
        {isInputEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
      </div>
      <span className="option-row-spacer" aria-hidden="true" />
    </div>
  );
}

export function SoundEffectsOption() {
  const { isSoundEnabled, toggleSound, sfxVolume, setSfxVolume } = useSound();

  return (
    <div className="option-row">
      <span>SOUND EFFECTS</span>
      <div className="flex flex-col items-end gap-2">
        <div
          className="option-row-toggle flex items-center gap-3"
          onClick={toggleSound}
          onKeyDown={(event) => handleToggleKeyDown(event, toggleSound)}
          role="button"
          tabIndex={0}
        >
          <b>SFX: {isSoundEnabled ? 'ON' : 'OFF'}</b>
          {isSoundEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
        </div>
        {isSoundEnabled && (
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(event) => setSfxVolume(Number(event.target.value))}
            className={COMPACT_SLIDER_CLASS}
            aria-label="SFX volume"
          />
        )}
      </div>
      <span className="option-row-spacer" aria-hidden="true" />
    </div>
  );
}

export function BackgroundMusicOption() {
  const { isMusicEnabled, toggleMusic, musicVolume, setMusicVolume } = useSound();

  return (
    <div className="option-row">
      <span>BACKGROUND MUSIC</span>
      <div className="flex flex-col items-end gap-2">
        <div
          className="option-row-toggle flex items-center gap-3"
          onClick={toggleMusic}
          onKeyDown={(event) => handleToggleKeyDown(event, toggleMusic)}
          role="button"
          tabIndex={0}
        >
          <b>BGM: {isMusicEnabled ? 'ON' : 'OFF'}</b>
          {isMusicEnabled ? <Check size={15} /> : <span className="option-row-spacer" aria-hidden="true" />}
        </div>
        {isMusicEnabled && (
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
            className={COMPACT_SLIDER_CLASS}
            aria-label="Music volume"
          />
        )}
      </div>
      <span className="option-row-spacer" aria-hidden="true" />
    </div>
  );
}

export function BrightnessOption() {
  const { brightness, setBrightness } = useSound();

  return (
    <div className="option-row">
      <span>BRIGHTNESS</span>
      <div className="flex flex-col items-end gap-2">
        <input
          type="range"
          min="50"
          max="150"
          value={brightness}
          onChange={(event) => setBrightness(Number(event.target.value))}
          className={COMPACT_SLIDER_CLASS}
          aria-label="Brightness"
        />
        <span className="text-xs font-mono text-[#8c7a6b]">{brightness}%</span>
      </div>
      <span className="option-row-spacer" aria-hidden="true" />
    </div>
  );
}

export function SettingsOptionsPanel() {
  return (
    <>
      <InterfaceOption />
      <MotionOption />
      <InputOption />
      <SoundEffectsOption />
      <BackgroundMusicOption />
      <BrightnessOption />
    </>
  );
}
