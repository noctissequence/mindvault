// Custom minimal line icons — shared across pages. 1.5px stroke, round caps.
export function MoonIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M38 28.5C36.4 29.2 34.7 29.5 33 29.5C25.5 29.5 19.5 23.5 19.5 16C19.5 14 19.9 12.1 20.7 10.4C13.9 12 8.5 18.2 8.5 25.5C8.5 34 15.5 41 24 41C30.8 41 36.6 36.6 38.7 30.5C38.5 29.8 38.3 29.1 38 28.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M33 10.5L33.9 13.1L36.5 14L33.9 14.9L33 17.5L32.1 14.9L29.5 14L32.1 13.1L33 10.5Z" fill="currentColor" fillOpacity="0.85"/>
    </svg>
  );
}

export function MoodFace({ mood, size = 26, active = false }: { mood: string; size?: number; active?: boolean }) {
  const w = active ? 1.9 : 1.5;
  const common = { stroke: 'currentColor', strokeWidth: w, strokeLinecap: 'round' as const, fill: 'none' };
  const eyes = (cy = 17) => (
    <>
      <circle cx="17.5" cy={cy} r="1.5" fill="currentColor" stroke="none" />
      <circle cx="30.5" cy={cy} r="1.5" fill="currentColor" stroke="none" />
    </>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="18" {...common} />
      {mood === 'happy' && <>{eyes(17)}<path d="M15.5 28C17.7 31.8 20.7 33.8 24 33.8C27.3 33.8 30.3 31.8 32.5 28" {...common} /></>}
      {mood === 'okay' && <>{eyes(17)}<path d="M16.5 29.5H31.5" {...common} /></>}
      {mood === 'neutral' && <>{eyes(18)}<path d="M17.5 30H30.5" {...common} /></>}
      {mood === 'sad' && <>{eyes(18.5)}<path d="M15.5 32.5C17.7 28.7 20.7 26.7 24 26.7C27.3 26.7 30.3 28.7 32.5 32.5" {...common} /></>}
      {mood === 'anxiety' && (
        <>
          <path d="M13 15L18.5 19.5M18.5 15L13 19.5" {...common} />
          <path d="M29.5 15L35 19.5M35 15L29.5 19.5" {...common} />
          <path d="M15 31.5C16.7 28.5 20 27 24 27C28 27 31.3 28.5 33 31.5" {...common} strokeDasharray="2.5 3.2" />
        </>
      )}
      {mood === 'angry' && (
        <>
          <path d="M13.5 14L19 18M34.5 14L29 18" {...common} />
          <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="30.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
          <path d="M16 32.5C19 30.2 22 29.3 24 29.3C26 29.3 29 30.2 32 32.5" {...common} />
        </>
      )}
    </svg>
  );
}

export function NotebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4H16.5C17.9 4 19 5.1 19 6.5V20H7C5.9 20 5 19.1 5 18V4Z" />
      <path d="M5 4V18C5 19.1 5.9 20 7 20" />
      <path d="M9 8H15M9 12H15" />
    </svg>
  );
}

export function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5L14.7 9.1L20.5 9.9L16.2 14L17.3 20L12 17L6.7 20L7.8 14L3.5 9.9L9.3 9.1L12 3.5Z" />
    </svg>
  );
}

export function BrainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4C8.8 4 7 5.8 7 8C5.3 8 4 9.3 4 11C4 12.2 4.7 13.3 5.7 13.8C5.3 14.4 5 15.2 5 16C5 18.2 6.8 20 9 20C9 20 10 20 11 20V4Z" />
      <path d="M13 4C15.2 4 17 5.8 17 8C18.7 8 20 9.3 20 11C20 12.2 19.3 13.3 18.3 13.8C18.7 14.4 19 15.2 19 16C19 18.2 17.2 20 15 20C15 20 14 20 13 20V4Z" />
      <path d="M12 4V20" strokeDasharray="0.1 3" />
    </svg>
  );
}

export function GearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8L13 5.2C13.7 5.4 14.3 5.6 14.9 6L17.3 4.9L19.1 6.7L18 9.1C18.4 9.7 18.6 10.3 18.8 11L21.2 12L18.8 13C18.6 13.7 18.4 14.3 18 14.9L19.1 17.3L17.3 19.1L14.9 18C14.3 18.4 13.7 18.6 13 18.8L12 21.2L11 18.8C10.3 18.6 9.7 18.4 9.1 18L6.7 19.1L4.9 17.3L6 14.9C5.6 14.3 5.4 13.7 5.2 13L2.8 12L5.2 11C5.4 10.3 5.6 9.7 6 9.1L4.9 6.7L6.7 4.9L9.1 6C9.7 5.6 10.3 5.4 11 5.2L12 2.8Z" />
    </svg>
  );
}

export function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11L12 4L20 11" />
      <path d="M6.5 9.5V19C6.5 19.6 6.9 20 7.5 20H16.5C17.1 20 17.5 19.6 17.5 19V9.5" />
      <path d="M10 20V14.5C10 14.2 10.2 14 10.5 14H13.5C13.8 14 14 14.2 14 14.5V20" />
    </svg>
  );
}

export function FeatherIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4C16 4 8 6 6.5 12.5L5 19L11.5 17.5C18 16 20 8 20 4Z" />
      <path d="M5 19C8 14 12 10 16 8" strokeDasharray="0.1 2.8" />
    </svg>
  );
}

export function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12L20 4L14.5 20L11.5 13.5L4 12Z" />
    </svg>
  );
}

export function PlaneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3.5L3 10.5L9.5 13.5L12 20L15 14.5L21 3.5Z" />
      <path d="M9.5 13.5L21 3.5" />
    </svg>
  );
}
