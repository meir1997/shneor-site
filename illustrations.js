// Inline SVG illustrations for selected blog posts
// Colors: #1a4480 (navy), #d4842a (amber), #2d5fa0 (mid-blue), #eef3f9 (bg)
const blogIllustrations = {

  // Post 89: זהירות: מוסדות חינוך ללא רישיון
  89: `<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="400" height="160" fill="#eef3f9"/>
  <!-- Background subtle shapes -->
  <circle cx="50" cy="80" r="55" fill="#1a4480" fill-opacity="0.05"/>
  <circle cx="350" cy="80" r="55" fill="#d4842a" fill-opacity="0.05"/>
  <!-- Certificate paper -->
  <rect x="105" y="22" width="190" height="125" rx="6" fill="white" stroke="#d0dcea" stroke-width="1.5"/>
  <!-- Certificate header bar -->
  <rect x="105" y="22" width="190" height="24" rx="6" fill="#1a4480"/>
  <rect x="105" y="34" width="190" height="12" fill="#1a4480"/>
  <!-- Decorative header lines -->
  <rect x="130" y="28" width="140" height="3" rx="1.5" fill="white" fill-opacity="0.2"/>
  <!-- Content lines -->
  <rect x="128" y="62" width="144" height="7" rx="3.5" fill="#d0dcea"/>
  <rect x="133" y="77" width="134" height="6" rx="3" fill="#e0e8f0"/>
  <rect x="133" y="91" width="124" height="6" rx="3" fill="#e0e8f0"/>
  <rect x="133" y="105" width="114" height="6" rx="3" fill="#e8edf4"/>
  <!-- Seal circle -->
  <circle cx="200" cy="130" r="18" fill="#fff3e4" stroke="#d4842a" stroke-width="2.5"/>
  <!-- X in seal -->
  <line x1="189" y1="119" x2="211" y2="141" stroke="#d4842a" stroke-width="4" stroke-linecap="round"/>
  <line x1="211" y1="119" x2="189" y2="141" stroke="#d4842a" stroke-width="4" stroke-linecap="round"/>
</svg>`,

  // Post 90: לחזור לבחירה בתורה
  90: `<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="400" height="160" fill="#eef3f9"/>
  <!-- Soft glow behind book -->
  <ellipse cx="185" cy="90" rx="85" ry="55" fill="#1a4480" fill-opacity="0.07"/>
  <!-- Book left page -->
  <path d="M95 55 L180 47 L180 128 L95 128 Z" fill="#2d5fa0"/>
  <!-- Book right page -->
  <path d="M220 47 L305 55 L305 128 L220 128 Z" fill="#1a4480"/>
  <!-- Spine -->
  <rect x="178" y="47" width="14" height="81" rx="3" fill="#143a6e"/>
  <!-- Lines on left page -->
  <line x1="113" y1="72" x2="168" y2="68" stroke="white" stroke-width="2" stroke-opacity="0.35"/>
  <line x1="113" y1="84" x2="168" y2="81" stroke="white" stroke-width="1.5" stroke-opacity="0.25"/>
  <line x1="113" y1="95" x2="168" y2="92" stroke="white" stroke-width="1.5" stroke-opacity="0.25"/>
  <line x1="113" y1="106" x2="168" y2="103" stroke="white" stroke-width="1.5" stroke-opacity="0.2"/>
  <!-- Lines on right page -->
  <line x1="232" y1="68" x2="287" y2="72" stroke="white" stroke-width="2" stroke-opacity="0.35"/>
  <line x1="232" y1="81" x2="287" y2="84" stroke="white" stroke-width="1.5" stroke-opacity="0.25"/>
  <line x1="232" y1="92" x2="287" y2="95" stroke="white" stroke-width="1.5" stroke-opacity="0.25"/>
  <line x1="232" y1="103" x2="287" y2="106" stroke="white" stroke-width="1.5" stroke-opacity="0.2"/>
  <!-- Curved return arrow -->
  <path d="M335 30 Q370 80 335 130" stroke="#d4842a" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <!-- Arrow head pointing back toward book -->
  <polygon points="322,123 338,140 347,116" fill="#d4842a"/>
  <!-- Small amber dot accent -->
  <circle cx="335" cy="30" r="5" fill="#d4842a"/>
</svg>`,

  // Post 91: שני עולמות, שתי תפיסות חינוך
  91: `<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="400" height="160" fill="#eef3f9"/>
  <!-- Left panel: Structured / rigid approach (navy) -->
  <rect x="45" y="25" width="135" height="120" rx="8" fill="#1a4480"/>
  <!-- Ordered horizontal lines = structure/rules -->
  <rect x="65" y="48" width="95" height="7" rx="3.5" fill="white" fill-opacity="0.45"/>
  <rect x="65" y="64" width="95" height="7" rx="3.5" fill="white" fill-opacity="0.35"/>
  <rect x="65" y="80" width="95" height="7" rx="3.5" fill="white" fill-opacity="0.35"/>
  <rect x="65" y="96" width="95" height="7" rx="3.5" fill="white" fill-opacity="0.35"/>
  <rect x="65" y="112" width="75" height="7" rx="3.5" fill="white" fill-opacity="0.25"/>
  <!-- Small person icon (rigid, upright) -->
  <circle cx="112" cy="38" r="7" fill="white" fill-opacity="0.6"/>
  <!-- Right panel: Creative / humanistic approach (amber) -->
  <rect x="220" y="25" width="135" height="120" rx="8" fill="#d4842a"/>
  <!-- Organic flowing shapes = creativity/humanity -->
  <path d="M240 65 Q287 45 320 70 Q287 95 240 75 Z" fill="white" fill-opacity="0.3"/>
  <path d="M240 95 Q275 78 320 98" stroke="white" stroke-width="3" stroke-linecap="round" fill-opacity="0.35"/>
  <path d="M248 112 Q275 100 312 115" stroke="white" stroke-width="2" stroke-linecap="round" fill-opacity="0.25"/>
  <!-- Person icon (dynamic, leaning) -->
  <circle cx="275" cy="45" r="8" fill="white" fill-opacity="0.55"/>
  <path d="M260 68 Q268 58 278 55 Q285 58 290 68" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" stroke-opacity="0.55"/>
  <!-- Divider label -->
  <rect x="186" y="68" width="28" height="28" rx="14" fill="#2d5fa0"/>
  <text x="200" y="86" font-size="13" font-weight="700" fill="white" text-anchor="middle" font-family="Arial, sans-serif">VS</text>
</svg>`,

  // Post 92: בעיית ספר התורה הסגור
  92: `<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="400" height="160" fill="#eef3f9"/>
  <!-- Subtle background glow -->
  <ellipse cx="200" cy="90" rx="100" ry="55" fill="#1a4480" fill-opacity="0.06"/>
  <!-- Torah scroll - two handles (atzei chaim) -->
  <!-- Left roller -->
  <rect x="90" y="28" width="16" height="115" rx="8" fill="#143a6e"/>
  <ellipse cx="98" cy="28" rx="10" ry="6" fill="#1a4480"/>
  <ellipse cx="98" cy="143" rx="10" ry="6" fill="#1a4480"/>
  <!-- Right roller -->
  <rect x="294" y="28" width="16" height="115" rx="8" fill="#143a6e"/>
  <ellipse cx="302" cy="28" rx="10" ry="6" fill="#1a4480"/>
  <ellipse cx="302" cy="143" rx="10" ry="6" fill="#1a4480"/>
  <!-- Scroll body -->
  <rect x="106" y="35" width="188" height="102" rx="4" fill="#f5f0e8" stroke="#c8bfa0" stroke-width="1.5"/>
  <!-- Scroll lines (closed, unread) -->
  <rect x="125" y="55" width="150" height="5" rx="2.5" fill="#d4c9a8" fill-opacity="0.8"/>
  <rect x="125" y="68" width="150" height="5" rx="2.5" fill="#d4c9a8" fill-opacity="0.6"/>
  <rect x="125" y="81" width="150" height="5" rx="2.5" fill="#d4c9a8" fill-opacity="0.6"/>
  <rect x="125" y="94" width="130" height="5" rx="2.5" fill="#d4c9a8" fill-opacity="0.5"/>
  <rect x="125" y="107" width="110" height="5" rx="2.5" fill="#d4c9a8" fill-opacity="0.4"/>
  <!-- Padlock (closed, overlaid center) -->
  <rect x="176" y="75" width="48" height="40" rx="6" fill="#d4842a"/>
  <path d="M187 75 Q187 57 200 57 Q213 57 213 75" stroke="#d4842a" stroke-width="7" stroke-linecap="round" fill="none"/>
  <!-- Lock shackle inner (keyhole) -->
  <circle cx="200" cy="92" r="7" fill="#fff3e4"/>
  <rect x="197" y="92" width="6" height="10" rx="3" fill="#fff3e4"/>
</svg>`,

  // Post 93: שלושה ארגזי כלים
  93: `<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="400" height="160" fill="#eef3f9"/>
  <!-- Three boxes side by side -->

  <!-- Box 1: Heart (love / connection) - navy -->
  <rect x="35" y="38" width="95" height="95" rx="10" fill="#1a4480"/>
  <!-- Heart icon -->
  <path d="M82 106 Q58 88 58 74 Q58 62 70 62 Q76 62 82 70 Q88 62 94 62 Q106 62 106 74 Q106 88 82 106 Z" fill="white" fill-opacity="0.85"/>
  <!-- Box label -->
  <rect x="55" y="118" width="55" height="8" rx="4" fill="white" fill-opacity="0.2"/>

  <!-- Box 2: Open book (wisdom / Torah) - amber -->
  <rect x="153" y="38" width="95" height="95" rx="10" fill="#d4842a"/>
  <!-- Mini book icon -->
  <path d="M168 72 L198 65 L198 110 L168 110 Z" fill="white" fill-opacity="0.8"/>
  <path d="M202 65 L232 72 L232 110 L202 110 Z" fill="white" fill-opacity="0.65"/>
  <rect x="197" y="65" width="6" height="45" rx="3" fill="#b36a22"/>
  <line x1="173" y1="80" x2="193" y2="77" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.6"/>
  <line x1="173" y1="89" x2="193" y2="86" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.5"/>
  <line x1="173" y1="97" x2="193" y2="95" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.5"/>
  <line x1="207" y1="77" x2="227" y2="80" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.6"/>
  <line x1="207" y1="86" x2="227" y2="89" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.5"/>
  <line x1="207" y1="95" x2="227" y2="97" stroke="#d4842a" stroke-width="1.5" stroke-opacity="0.5"/>
  <!-- Box label -->
  <rect x="173" y="118" width="55" height="8" rx="4" fill="white" fill-opacity="0.2"/>

  <!-- Box 3: People / community - mid-blue -->
  <rect x="271" y="38" width="95" height="95" rx="10" fill="#2d5fa0"/>
  <!-- Three people icons (community) -->
  <circle cx="296" cy="72" r="10" fill="white" fill-opacity="0.8"/>
  <path d="M278 104 Q278 88 296 85 Q314 88 314 104" fill="white" fill-opacity="0.7"/>
  <circle cx="341" cy="72" r="10" fill="white" fill-opacity="0.65"/>
  <path d="M325 104 Q325 90 341 87 Q357 90 357 104" fill="white" fill-opacity="0.55"/>
  <!-- Box label -->
  <rect x="291" y="118" width="55" height="8" rx="4" fill="white" fill-opacity="0.2"/>

  <!-- Connecting dots between boxes -->
  <circle cx="133" cy="87" r="4" fill="#2d5fa0" fill-opacity="0.4"/>
  <circle cx="251" cy="87" r="4" fill="#2d5fa0" fill-opacity="0.4"/>
</svg>`

};
