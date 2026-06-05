export default function RiverBackground() {
  return (
    <svg 
      viewBox="0 0 1200 600" 
      className="absolute inset-0 w-full h-full opacity-20"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Mountains */}
      <defs>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B7355" />
          <stop offset="100%" stopColor="#A0826D" />
        </linearGradient>
      </defs>

      {/* Far mountains (lighter) */}
      <path
        d="M 0 400 L 200 200 L 400 300 L 600 150 L 800 280 L 1000 200 L 1200 350 L 1200 600 L 0 600 Z"
        fill="url(#mountainGradient)"
        opacity="0.6"
      />

      {/* Close mountains (darker) */}
      <path
        d="M 0 420 L 150 180 L 350 320 L 550 140 L 750 300 L 950 220 L 1200 400 L 1200 600 L 0 600 Z"
        fill="#6B5344"
        opacity="0.8"
      />

      {/* River flowing through */}
      <path
        d="M 600 550 Q 580 450, 600 350 Q 620 250, 600 150"
        stroke="#4A90E2"
        strokeWidth="12"
        fill="none"
        opacity="0.4"
      />

      {/* River highlights */}
      <path
        d="M 600 550 Q 580 450, 600 350 Q 620 250, 600 150"
        stroke="#6BA3E5"
        strokeWidth="4"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}