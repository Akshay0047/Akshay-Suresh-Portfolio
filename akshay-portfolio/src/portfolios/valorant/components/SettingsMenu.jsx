import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore.js';

const TABS = [
  { id: 'general', label: 'GENERAL' },
  { id: 'video', label: 'VIDEO' },
];

const QUALITY_OPTIONS = [
  { value: 'low', label: 'LOW' },
  { value: 'med', label: 'MEDIUM' },
  { value: 'high', label: 'HIGH' },
];

const SCALE_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
];

function OptionRow({ label, hint, children }) {
  return (
    <div className="vs-row">
      <div className="vs-row-copy">
        <span className="vs-row-label">{label}</span>
        {hint && <span className="vs-row-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, testId }) {
  return (
    <OptionRow label={label} hint={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`vs-switch ${checked ? 'is-on' : ''}`}
        data-testid={testId}
        onClick={() => onChange(!checked)}
      >
        <span className="vs-switch-knob" />
      </button>
    </OptionRow>
  );
}

function Select({ label, hint, value, options, onChange, testId }) {
  return (
    <OptionRow label={label} hint={hint}>
      <select
        className="vs-select"
        aria-label={label}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </OptionRow>
  );
}

export default function SettingsMenu() {
  const [tab, setTab] = useState('general');
  const closeSettings = useSettingsStore((state) => state.closeSettings);
  const graphicsQuality = useSettingsStore((state) => state.graphicsQuality);
  const shadowsEnabled = useSettingsStore((state) => state.shadowsEnabled);
  const bloomEnabled = useSettingsStore((state) => state.bloomEnabled);
  const resolutionScale = useSettingsStore((state) => state.resolutionScale);
  const setGraphicsQuality = useSettingsStore((state) => state.setGraphicsQuality);
  const setShadowsEnabled = useSettingsStore((state) => state.setShadowsEnabled);
  const setBloomEnabled = useSettingsStore((state) => state.setBloomEnabled);
  const setResolutionScale = useSettingsStore((state) => state.setResolutionScale);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSettings]);

  return (
    <div className="vs-overlay" role="dialog" aria-modal="true" aria-label="Settings" data-testid="settings-menu">
      <div className="vs-panel">
        <header className="vs-header">
          <span className="vs-kicker">ESC // CLIENT</span>
          <h2>SETTINGS</h2>
        </header>

        <div className="vs-body">
          <nav className="vs-tabs" aria-label="Settings categories">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`vs-tab ${tab === item.id ? 'is-active' : ''}`}
                aria-pressed={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="vs-options">
            {tab === 'general' && (
              <Select
                label="GRAPHICS QUALITY"
                hint="Reflection strength and shadow detail"
                value={graphicsQuality}
                options={QUALITY_OPTIONS}
                onChange={setGraphicsQuality}
                testId="settings-quality"
              />
            )}
            {tab === 'video' && (
              <>
                <Toggle
                  label="SHADOWS"
                  hint="Cast and receive shadows across the site"
                  checked={shadowsEnabled}
                  onChange={setShadowsEnabled}
                  testId="settings-shadows"
                />
                <Toggle
                  label="BLOOM"
                  hint="Glow on bright emissive surfaces"
                  checked={bloomEnabled}
                  onChange={setBloomEnabled}
                  testId="settings-bloom"
                />
                <Select
                  label="RESOLUTION SCALE"
                  hint="Render sharpness"
                  value={String(resolutionScale)}
                  options={SCALE_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
                  onChange={(value) => setResolutionScale(Number(value))}
                  testId="settings-resolution"
                />
              </>
            )}
          </div>
        </div>

        <button type="button" className="vs-close" data-testid="settings-close" onClick={closeSettings}>
          CLOSE SETTINGS
        </button>
      </div>
    </div>
  );
}
