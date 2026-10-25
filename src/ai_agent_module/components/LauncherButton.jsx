export default function LauncherButton({ onClick }) {
  return (
    <button type="button" className="aiag-launcher" onClick={onClick} aria-label="AI সহকারী খুলুন">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        <path d="M9 11h.01M12 11h.01M15 11h.01" />
      </svg>
    </button>
  );
}
