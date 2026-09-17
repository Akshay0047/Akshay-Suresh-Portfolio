import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type CreditsContextValue = {
  openCredits: () => void;
  closeCredits: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditsProvider');
  }
  return context;
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md border border-[#2a241d] bg-[#0f0d0c] p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8c7a6b] transition-colors hover:text-[#e8d4b4]"
          aria-label="Close credits"
        >
          ✕
        </button>

        <h2 className="mb-6 font-serif text-2xl tracking-wider text-[#b8976a]">Acknowledgements</h2>

        <div className="flex flex-col gap-6 text-sm leading-relaxed tracking-wide text-[#a3907c]">
          <div>
            <p className="mb-1 text-xs uppercase text-[#e8d4b4]">Audio &amp; 3D Inspiration</p>
            <p>
              3D Kunai Model and Audio Assets inspired by{' '}
              <span className="text-[#b8976a]">Sekiro: Shadows Die Twice</span> © FromSoftware.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase text-[#e8d4b4]">Minigame Concept</p>
            <p>
              &apos;Draw the Blade&apos; mechanics inspired by{' '}
              <span className="text-[#b8976a]">Fruit Ninja</span> © Halfbrick Studios.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1a1614] pt-4 text-center text-[10px] uppercase tracking-widest text-[#5c5046]">
          Not affiliated with or endorsed by the original creators.
        </div>
      </div>
    </div>
  );
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [showCredits, setShowCredits] = useState(false);

  const openCredits = useCallback(() => setShowCredits(true), []);
  const closeCredits = useCallback(() => setShowCredits(false), []);

  const value = useMemo(
    () => ({ openCredits, closeCredits }),
    [openCredits, closeCredits],
  );

  return (
    <CreditsContext.Provider value={value}>
      {children}
      {showCredits && <CreditsModal onClose={closeCredits} />}
    </CreditsContext.Provider>
  );
}

export function CreditsButton() {
  const { openCredits } = useCredits();

  return (
    <button
      type="button"
      onClick={openCredits}
      className="credits-trigger"
    >
      [ Credits ]
    </button>
  );
}
