export default function Spinner({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.7s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
