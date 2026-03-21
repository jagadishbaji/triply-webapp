"use client"

import React, { useState } from "react"

interface Props {
  slug: string
  name: string
  className?: string
}

// ── Card background gradients per category ─────────────────────────────────
const BG: Record<string, string> = {
  "mini":            "from-[#FFF8E7] to-[#FEF0C7]",
  "sedan":           "from-[#EFF6FF] to-[#DBEAFE]",
  "ertiga":          "from-[#F0FDF4] to-[#DCFCE7]",
  "innova":          "from-[#F8FAFC] to-[#F1F5F9]",
  "suv":             "from-[#F0FDF4] to-[#D1FAE5]",
  "innova-crysta":   "from-[#FAF5FF] to-[#EDE9FE]",
  "tempo-traveller": "from-[#EFF6FF] to-[#BFDBFE]",
  "mini-bus":        "from-[#EFF6FF] to-[#BFDBFE]",
  "bus":             "from-[#EFF6FF] to-[#BFDBFE]",
}

// ── Accent colours per category ─────────────────────────────────────────────
const ACCENT: Record<string, string> = {
  "mini":            "#F59E0B",
  "sedan":           "#3B82F6",
  "ertiga":          "#22C55E",
  "innova":          "#64748B",
  "suv":             "#16A34A",
  "innova-crysta":   "#7C3AED",
  "tempo-traveller": "#2563EB",
  "mini-bus":        "#1D4ED8",
  "bus":             "#1E40AF",
}

// ── Clean SVG vehicle illustrations ────────────────────────────────────────
// Proper side-profile cutout style — flat fills, no stroke sketchy look
// Inspired by Ola / Rapido flat illustration style

const MINI = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 280 140" fill="none" className="w-full h-full drop-shadow-md">
    {/* Shadow */}
    <ellipse cx="140" cy="128" rx="100" ry="8" fill="black" fillOpacity="0.12"/>
    {/* Body */}
    <path d="M25 95 C25 95 20 82 22 70 C24 58 32 46 48 36 L80 24 C92 19 108 16 130 16 L168 16 C188 16 202 20 214 30 L238 52 C248 60 252 70 252 80 L252 95 Z"
      fill="white" filter="url(#shadow)"/>
    <path d="M25 95 C25 95 20 82 22 70 C24 58 32 46 48 36 L80 24 C92 19 108 16 130 16 L168 16 C188 16 202 20 214 30 L238 52 C248 60 252 70 252 80 L252 95 Z"
      fill={`${accent}15`}/>
    {/* Body outline */}
    <path d="M25 95 C25 95 20 82 22 70 C24 58 32 46 48 36 L80 24 C92 19 108 16 130 16 L168 16 C188 16 202 20 214 30 L238 52 C248 60 252 70 252 80 L252 95 Z"
      stroke={accent} strokeWidth="2" fill="none"/>
    {/* Roof */}
    <path d="M55 34 L82 20 C94 15 110 12 130 12 L168 12 C186 12 200 18 212 28 L234 48"
      stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Windscreen */}
    <path d="M56 36 L84 20 C96 14 112 12 130 12 L168 12 C184 12 198 18 210 28 L232 48 L220 56 L196 38 C184 30 172 26 155 26 L120 26 C104 26 94 30 84 38 L66 48 Z"
      fill={`${accent}20`} stroke={accent} strokeWidth="1.5"/>
    {/* Rear window */}
    <path d="M34 36 L26 52 L26 72 L65 72 L68 42 Z"
      fill={`${accent}20`} stroke={accent} strokeWidth="1.5"/>
    {/* Door line */}
    <line x1="118" y1="24" x2="112" y2="95" stroke={accent} strokeWidth="1.5" strokeDasharray="none" opacity="0.4"/>
    <line x1="168" y1="16" x2="163" y2="95" stroke={accent} strokeWidth="1.5" opacity="0.4"/>
    {/* Door handles */}
    <rect x="128" y="66" width="18" height="5" rx="2.5" fill={accent} opacity="0.7"/>
    <rect x="172" y="66" width="18" height="5" rx="2.5" fill={accent} opacity="0.7"/>
    {/* Wheel arches */}
    <path d="M44 96 Q44 76 68 76 Q92 76 92 96" fill="white" stroke={accent} strokeWidth="2"/>
    <path d="M184 96 Q184 76 208 76 Q232 76 232 96" fill="white" stroke={accent} strokeWidth="2"/>
    {/* Wheels */}
    <circle cx="68"  cy="100" r="22" fill="#1E293B"/>
    <circle cx="68"  cy="100" r="14" fill="#334155"/>
    <circle cx="68"  cy="100" r="6"  fill="#94A3B8"/>
    <circle cx="208" cy="100" r="22" fill="#1E293B"/>
    <circle cx="208" cy="100" r="14" fill="#334155"/>
    <circle cx="208" cy="100" r="6"  fill="#94A3B8"/>
    {/* Headlight */}
    <path d="M246 62 L254 66 L254 80 L247 82 C241 80 242 72 244 68 Z" fill="#FEF9C3" stroke={accent} strokeWidth="1.5"/>
    {/* Tail light */}
    <rect x="22" y="64" width="5" height="18" rx="2" fill="#F87171"/>
    {/* Underside */}
    <rect x="25" y="93" width="227" height="5" rx="2" fill={accent} opacity="0.25"/>
  </svg>
)

const SEDAN = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 300 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="150" cy="128" rx="110" ry="8" fill="black" fillOpacity="0.1"/>
    {/* Body */}
    <path d="M18 96 L18 68 C18 52 28 38 44 28 L70 16 C84 10 104 8 128 8 L182 8 C204 8 220 14 234 24 L258 44 C268 52 272 64 272 76 L272 96 Z"
      fill="white"/>
    <path d="M18 96 L18 68 C18 52 28 38 44 28 L70 16 C84 10 104 8 128 8 L182 8 C204 8 220 14 234 24 L258 44 C268 52 272 64 272 76 L272 96 Z"
      fill={`${accent}12`}/>
    <path d="M18 96 L18 68 C18 52 28 38 44 28 L70 16 C84 10 104 8 128 8 L182 8 C204 8 220 14 234 24 L258 44 C268 52 272 64 272 76 L272 96 Z"
      stroke={accent} strokeWidth="2" fill="none"/>
    {/* Roof arch — sedan specific */}
    <path d="M60 28 L80 14 C94 8 112 6 130 6 L182 6 C200 6 216 12 228 22 L252 40"
      stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Windscreen */}
    <path d="M58 30 L80 14 C94 8 112 6 130 6 L182 6 C198 6 214 12 226 22 L248 40 L238 48 L216 28 C204 20 192 16 178 16 L128 16 C112 16 100 20 90 28 L70 42 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Rear window - notchback */}
    <path d="M26 28 L20 42 L20 64 L62 64 L64 32 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Trunk */}
    <path d="M240 42 L258 56 L264 70 L264 92 L240 92 L238 46 Z"
      fill={`${accent}10`} stroke={accent} strokeWidth="1.5"/>
    {/* Door lines */}
    <line x1="118" y1="16" x2="112" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    <line x1="180" y1="8"  x2="175" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    {/* Handles */}
    <rect x="130" y="62" width="20" height="5" rx="2.5" fill={accent} opacity="0.7"/>
    <rect x="186" y="62" width="20" height="5" rx="2.5" fill={accent} opacity="0.7"/>
    {/* Chrome body line */}
    <path d="M20 70 Q90 66 150 68 Q220 70 270 66" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
    {/* Wheel arches */}
    <path d="M42 97 Q42 76 68 76 Q94 76 94 97"  fill="white" stroke={accent} strokeWidth="2"/>
    <path d="M198 97 Q198 76 224 76 Q250 76 250 97" fill="white" stroke={accent} strokeWidth="2"/>
    {/* Wheels */}
    <circle cx="68"  cy="101" r="23" fill="#1E293B"/>
    <circle cx="68"  cy="101" r="14" fill="#334155"/>
    <circle cx="68"  cy="101" r="6"  fill="#94A3B8"/>
    <circle cx="224" cy="101" r="23" fill="#1E293B"/>
    <circle cx="224" cy="101" r="14" fill="#334155"/>
    <circle cx="224" cy="101" r="6"  fill="#94A3B8"/>
    {/* Headlight */}
    <path d="M260 58 L272 62 L272 78 L263 80 C256 78 258 68 260 64 Z" fill="#FEF9C3" stroke={accent} strokeWidth="1.5"/>
    <rect x="18" y="60" width="5" height="20" rx="2" fill="#F87171"/>
    <rect x="22" y="92" width="250" height="5" rx="2" fill={accent} opacity="0.2"/>
  </svg>
)

const INNOVA = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 300 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="150" cy="128" rx="115" ry="8" fill="black" fillOpacity="0.12"/>
    {/* Body — tall MUV */}
    <path d="M14 96 L14 44 C14 28 24 16 38 8 L62 2 C76 0 96 0 118 0 L194 0 C218 0 236 6 250 18 L270 36 C280 46 284 58 284 70 L284 96 Z"
      fill="white"/>
    <path d="M14 96 L14 44 C14 28 24 16 38 8 L62 2 C76 0 96 0 118 0 L194 0 C218 0 236 6 250 18 L270 36 C280 46 284 58 284 70 L284 96 Z"
      fill={`${accent}10`}/>
    <path d="M14 96 L14 44 C14 28 24 16 38 8 L62 2 C76 0 96 0 118 0 L194 0 C218 0 236 6 250 18 L270 36 C280 46 284 58 284 70 L284 96 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    {/* Roof rail */}
    <rect x="58" y="1" width="208" height="8" rx="4" fill={accent} opacity="0.35"/>
    {/* Windscreen */}
    <path d="M54 18 L68 4 C80 0 98 0 118 0 L194 0 C214 0 232 6 246 16 L266 32 L258 40 L232 22 C218 12 204 6 186 6 L118 6 C98 6 86 10 76 20 L58 36 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Rear window */}
    <path d="M20 16 L14 32 L14 60 L54 60 L56 8 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* 3 door lines */}
    <line x1="114" y1="6"  x2="108" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    <line x1="170" y1="0"  x2="165" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    <line x1="222" y1="2"  x2="218" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    {/* Handles */}
    <rect x="126" y="60" width="20" height="6" rx="3" fill={accent} opacity="0.65"/>
    <rect x="178" y="60" width="20" height="6" rx="3" fill={accent} opacity="0.65"/>
    {/* Side step */}
    <rect x="52" y="88" width="218" height="10" rx="4" fill={accent} opacity="0.2"/>
    {/* Wheel arches */}
    <path d="M32 97 Q32 74 60 74 Q88 74 88 97"  fill="white" stroke={accent} strokeWidth="2"/>
    <path d="M204 97 Q204 74 232 74 Q260 74 260 97" fill="white" stroke={accent} strokeWidth="2"/>
    {/* Wheels */}
    <circle cx="60"  cy="101" r="24" fill="#1E293B"/>
    <circle cx="60"  cy="101" r="15" fill="#334155"/>
    <circle cx="60"  cy="101" r="6"  fill="#94A3B8"/>
    <circle cx="232" cy="101" r="24" fill="#1E293B"/>
    <circle cx="232" cy="101" r="15" fill="#334155"/>
    <circle cx="232" cy="101" r="6"  fill="#94A3B8"/>
    {/* Headlight */}
    <path d="M274 46 L284 52 L284 70 L275 72 C268 70 270 58 272 54 Z" fill="#FEF9C3" stroke={accent} strokeWidth="2"/>
    <rect x="14" y="44" width="6" height="26" rx="3" fill="#F87171"/>
    <rect x="14" y="93" width="270" height="5" rx="2" fill={accent} opacity="0.18"/>
  </svg>
)

const SUV_VEC = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 300 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="150" cy="128" rx="115" ry="8" fill="black" fillOpacity="0.12"/>
    <path d="M12 96 L12 44 C12 26 22 12 38 4 L64 0 C80 0 98 0 120 0 L196 0 C220 0 240 6 256 18 L276 38 C284 48 288 62 288 74 L288 96 Z"
      fill="white"/>
    <path d="M12 96 L12 44 C12 26 22 12 38 4 L64 0 C80 0 98 0 120 0 L196 0 C220 0 240 6 256 18 L276 38 C284 48 288 62 288 74 L288 96 Z"
      fill={`${accent}10`}/>
    <path d="M12 96 L12 44 C12 26 22 12 38 4 L64 0 C80 0 98 0 120 0 L196 0 C220 0 240 6 256 18 L276 38 C284 48 288 62 288 74 L288 96 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    <rect x="60" y="1" width="210" height="8" rx="4" fill={accent} opacity="0.3"/>
    <path d="M56 18 L70 4 C84 0 102 0 120 0 L196 0 C218 0 238 6 252 18 L272 34 L263 42 L236 22 C220 12 206 6 188 6 L120 6 C100 6 88 12 76 22 L58 36 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <path d="M18 16 L12 32 L12 62 L56 62 L58 8 Z"
      fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <line x1="116" y1="6"  x2="110" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
    <line x1="172" y1="0"  x2="167" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
    <line x1="225" y1="2"  x2="221" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
    <rect x="128" y="60" width="20" height="6" rx="3" fill={accent} opacity="0.65"/>
    <rect x="180" y="60" width="20" height="6" rx="3" fill={accent} opacity="0.65"/>
    {/* Bold skid plate */}
    <rect x="10" y="88" width="278" height="10" rx="4" fill={accent} opacity="0.25"/>
    <path d="M30 98 Q30 74 60 74 Q90 74 90 98"  fill="white" stroke={accent} strokeWidth="2.5"/>
    <path d="M204 98 Q204 74 234 74 Q264 74 264 98" fill="white" stroke={accent} strokeWidth="2.5"/>
    {/* Big off-road tyres */}
    <circle cx="60"  cy="102" r="26" fill="#1E293B"/>
    <circle cx="60"  cy="102" r="16" fill="#334155"/>
    <circle cx="60"  cy="102" r="7"  fill="#94A3B8"/>
    <circle cx="234" cy="102" r="26" fill="#1E293B"/>
    <circle cx="234" cy="102" r="16" fill="#334155"/>
    <circle cx="234" cy="102" r="7"  fill="#94A3B8"/>
    <path d="M278 48 L288 54 L288 74 L278 76 C270 74 272 60 274 56 Z" fill="#FEF9C3" stroke={accent} strokeWidth="2"/>
    <ellipse cx="279" cy="80" rx="8" ry="5" fill="#FEF9C3" fillOpacity="0.9" stroke={accent} strokeWidth="1.5"/>
    <rect x="12" y="44" width="6" height="28" rx="3" fill="#F87171"/>
  </svg>
)

const CRYSTA = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 300 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="150" cy="128" rx="115" ry="8" fill="black" fillOpacity="0.13"/>
    <path d="M14 96 L14 46 C14 28 24 14 40 6 L66 0 C82 0 102 0 124 0 L192 0 C216 0 236 8 252 20 L272 40 C282 50 286 62 286 74 L286 96 Z"
      fill="white"/>
    <path d="M14 96 L14 46 C14 28 24 14 40 6 L66 0 C82 0 102 0 124 0 L192 0 C216 0 236 8 252 20 L272 40 C282 50 286 62 286 74 L286 96 Z"
      fill={`${accent}12`}/>
    <path d="M14 96 L14 46 C14 28 24 14 40 6 L66 0 C82 0 102 0 124 0 L192 0 C216 0 236 8 252 20 L272 40 C282 50 286 62 286 74 L286 96 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    {/* Premium chrome roof rail */}
    <rect x="62" y="1" width="206" height="10" rx="5" fill={accent} opacity="0.5"/>
    <path d="M58 20 L72 4 C86 0 104 0 124 0 L192 0 C214 0 234 8 248 20 L268 36 L258 46 L232 24 C218 14 204 8 188 8 L124 8 C104 8 92 14 80 24 L62 38 Z"
      fill={`${accent}20`} stroke={accent} strokeWidth="1.5"/>
    <path d="M20 18 L14 34 L14 62 L58 62 L60 10 Z"
      fill={`${accent}20`} stroke={accent} strokeWidth="1.5"/>
    <line x1="120" y1="8"  x2="114" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    <line x1="174" y1="0"  x2="169" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    <line x1="226" y1="2"  x2="222" y2="96" stroke={accent} strokeWidth="1.5" opacity="0.35"/>
    {/* Chrome body line */}
    <path d="M16 68 Q90 64 150 66 Q220 68 284 64" stroke={accent} strokeWidth="2" fill="none" opacity="0.5"/>
    {/* Premium handles */}
    <rect x="130" y="58" width="22" height="7" rx="3.5" fill={accent} opacity="0.8"/>
    <rect x="182" y="58" width="22" height="7" rx="3.5" fill={accent} opacity="0.8"/>
    <rect x="52" y="88" width="222" height="10" rx="4" fill={accent} opacity="0.2"/>
    <path d="M34 97 Q34 74 62 74 Q90 74 90 97"  fill="white" stroke={accent} strokeWidth="2.5"/>
    <path d="M200 97 Q200 74 228 74 Q256 74 256 97" fill="white" stroke={accent} strokeWidth="2.5"/>
    {/* Alloy wheels */}
    <circle cx="62"  cy="101" r="25" fill="#1E293B"/>
    <circle cx="62"  cy="101" r="16" fill="#475569"/>
    {[0,60,120,180,240,300].map((a, i) => (
      <line key={i}
        x1={62  + 5  * Math.cos(a * Math.PI / 180)} y1={101 + 5  * Math.sin(a * Math.PI / 180)}
        x2={62  + 15 * Math.cos(a * Math.PI / 180)} y2={101 + 15 * Math.sin(a * Math.PI / 180)}
        stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    ))}
    <circle cx="62"  cy="101" r="5" fill="#CBD5E1"/>
    <circle cx="228" cy="101" r="25" fill="#1E293B"/>
    <circle cx="228" cy="101" r="16" fill="#475569"/>
    {[0,60,120,180,240,300].map((a, i) => (
      <line key={i}
        x1={228 + 5  * Math.cos(a * Math.PI / 180)} y1={101 + 5  * Math.sin(a * Math.PI / 180)}
        x2={228 + 15 * Math.cos(a * Math.PI / 180)} y2={101 + 15 * Math.sin(a * Math.PI / 180)}
        stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
    ))}
    <circle cx="228" cy="101" r="5" fill="#CBD5E1"/>
    {/* LED DRL + headlight */}
    <rect x="268" y="38" width="18" height="4" rx="2" fill="#FEF9C3" opacity="0.95"/>
    <path d="M274 44 L286 50 L286 68 L276 70 C268 68 270 56 272 52 Z" fill="#FEF9C3" stroke={accent} strokeWidth="2"/>
    <rect x="14" y="44" width="6" height="26" rx="3" fill="#F87171"/>
  </svg>
)

const TEMPO = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 320 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="160" cy="128" rx="130" ry="8" fill="black" fillOpacity="0.12"/>
    {/* Long van body */}
    <path d="M10 96 L10 28 C10 14 18 4 30 2 L50 0 L272 0 C288 0 304 8 314 22 L318 40 L320 58 L320 96 Z"
      fill="white"/>
    <path d="M10 96 L10 28 C10 14 18 4 30 2 L50 0 L272 0 C288 0 304 8 314 22 L318 40 L320 58 L320 96 Z"
      fill={`${accent}10`}/>
    <path d="M10 96 L10 28 C10 14 18 4 30 2 L50 0 L272 0 C288 0 304 8 314 22 L318 40 L320 58 L320 96 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    {/* Roof gutter */}
    <rect x="10" y="0" width="310" height="8" rx="4" fill={accent} opacity="0.3"/>
    {/* Cabin windscreen */}
    <path d="M18 20 L26 6 C34 2 46 0 58 0 L80 0 L78 20 C64 18 52 22 44 28 L28 36 Z"
      fill={`${accent}22`} stroke={accent} strokeWidth="1.5"/>
    {/* Cabin side window */}
    <rect x="18" y="18" width="56" height="40" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Passenger windows — 3 tall */}
    <rect x="90"  y="6" width="58" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <rect x="158" y="6" width="58" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <rect x="226" y="6" width="58" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Pillar lines */}
    <line x1="88"  y1="0"  x2="88"  y2="96" stroke={accent} strokeWidth="2.5"/>
    <line x1="156" y1="0"  x2="156" y2="96" stroke={accent} strokeWidth="2.5"/>
    <line x1="224" y1="0"  x2="224" y2="96" stroke={accent} strokeWidth="2.5"/>
    {/* Bold side step */}
    <rect x="82"  y="84" width="230" height="14" rx="5" fill={accent} opacity="0.25"/>
    <rect x="10"  y="92" width="310" height="5"  rx="2" fill={accent} opacity="0.15"/>
    {/* Wheel arches */}
    <path d="M30 97 Q30 74 58 74 Q86 74 86 97" fill="white" stroke={accent} strokeWidth="2.5"/>
    <path d="M238 97 Q238 74 266 74 Q294 74 294 97" fill="white" stroke={accent} strokeWidth="2.5"/>
    {/* Wheels */}
    <circle cx="58"  cy="101" r="24" fill="#1E293B"/>
    <circle cx="58"  cy="101" r="15" fill="#334155"/>
    <circle cx="58"  cy="101" r="6"  fill="#94A3B8"/>
    <circle cx="266" cy="101" r="24" fill="#1E293B"/>
    <circle cx="266" cy="101" r="15" fill="#334155"/>
    <circle cx="266" cy="101" r="6"  fill="#94A3B8"/>
    {/* Dual rear */}
    <circle cx="290" cy="103" r="19" fill="#263040"/>
    <circle cx="290" cy="103" r="11" fill="#334155"/>
    {/* Headlight */}
    <rect x="306" y="32" width="14" height="30" rx="5" fill="#FEF9C3" stroke={accent} strokeWidth="1.5"/>
    <rect x="10"  y="26" width="6"  height="36" rx="3" fill="#F87171"/>
  </svg>
)

const MINIBUS = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 320 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="160" cy="128" rx="135" ry="8" fill="black" fillOpacity="0.12"/>
    {/* Tall bus body */}
    <path d="M8 98 L8 18 C8 6 16 0 28 0 L290 0 C304 0 316 8 320 22 L320 98 Z"
      fill="white"/>
    <path d="M8 98 L8 18 C8 6 16 0 28 0 L290 0 C304 0 316 8 320 22 L320 98 Z"
      fill={`${accent}10`}/>
    <path d="M8 98 L8 18 C8 6 16 0 28 0 L290 0 C304 0 316 8 320 22 L320 98 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    {/* Roof band */}
    <rect x="8" y="0" width="312" height="10" rx="5" fill={accent} opacity="0.45"/>
    {/* Destination board */}
    <rect x="12" y="2" width="88" height="18" rx="3" fill={accent} opacity="0.8"/>
    <text x="56" y="15" fontSize="8" fill="white" textAnchor="middle" fontWeight="600" fontFamily="system-ui">HUBLI – DHARWAD</text>
    {/* Windscreen */}
    <path d="M16 22 L22 8 C28 2 38 0 50 0 L66 0 L64 20 C52 18 42 22 36 28 L22 36 Z"
      fill={`${accent}22`} stroke={accent} strokeWidth="1.5"/>
    {/* Driver window */}
    <rect x="16" y="20" width="44" height="44" rx="4" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Passenger windows — 4 */}
    <rect x="74"  y="8" width="52" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <rect x="134" y="8" width="52" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <rect x="194" y="8" width="52" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    <rect x="254" y="8" width="46" height="52" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {/* Pillars */}
    <line x1="72"  y1="0"  x2="72"  y2="98" stroke={accent} strokeWidth="2.5"/>
    <line x1="132" y1="0"  x2="132" y2="98" stroke={accent} strokeWidth="2.5"/>
    <line x1="192" y1="0"  x2="192" y2="98" stroke={accent} strokeWidth="2.5"/>
    <line x1="252" y1="0"  x2="252" y2="98" stroke={accent} strokeWidth="2.5"/>
    {/* Entry door */}
    <rect x="74"  y="60" width="58" height="38" fill={`${accent}12`} stroke={accent} strokeWidth="1.5"/>
    <line x1="103" y1="60" x2="103" y2="98" stroke={accent} strokeWidth="1"/>
    {/* Side band */}
    <rect x="8"  y="68" width="312" height="8" rx="0" fill={accent} opacity="0.25"/>
    {/* Step board */}
    <rect x="8"  y="92" width="312" height="8" rx="3" fill={accent} opacity="0.35"/>
    {/* Wheel arches */}
    <path d="M26 98 Q26 76 54 76 Q82 76 82 98" fill="white" stroke={accent} strokeWidth="2.5"/>
    <path d="M238 98 Q238 76 266 76 Q294 76 294 98" fill="white" stroke={accent} strokeWidth="2.5"/>
    {/* Wheels */}
    <circle cx="54"  cy="102" r="24" fill="#1E293B"/>
    <circle cx="54"  cy="102" r="15" fill="#334155"/>
    <circle cx="54"  cy="102" r="6"  fill="#94A3B8"/>
    <circle cx="266" cy="102" r="24" fill="#1E293B"/>
    <circle cx="266" cy="102" r="15" fill="#334155"/>
    <circle cx="266" cy="102" r="6"  fill="#94A3B8"/>
    <circle cx="292" cy="104" r="18" fill="#263040"/>
    <circle cx="292" cy="104" r="10" fill="#334155"/>
    {/* Headlight */}
    <rect x="306" y="26" width="14" height="34" rx="4" fill="#FEF9C3" stroke={accent} strokeWidth="1.5"/>
    <rect x="8"   y="22" width="6"  height="42" rx="3" fill="#F87171"/>
  </svg>
)

const BUS_VEC = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 340 140" fill="none" className="w-full h-full drop-shadow-md">
    <ellipse cx="170" cy="128" rx="148" ry="8" fill="black" fillOpacity="0.12"/>
    <path d="M6 98 L6 16 C6 4 14 0 26 0 L308 0 C322 0 334 8 338 22 L338 98 Z"
      fill="white"/>
    <path d="M6 98 L6 16 C6 4 14 0 26 0 L308 0 C322 0 334 8 338 22 L338 98 Z"
      fill={`${accent}10`}/>
    <path d="M6 98 L6 16 C6 4 14 0 26 0 L308 0 C322 0 334 8 338 22 L338 98 Z"
      stroke={accent} strokeWidth="2.5" fill="none"/>
    <rect x="6"  y="0"  width="332" height="12" rx="6" fill={accent} opacity="0.5"/>
    <rect x="10" y="2"  width="96"  height="18" rx="3" fill={accent} opacity="0.85"/>
    <text x="58" y="15" fontSize="8" fill="white" textAnchor="middle" fontWeight="600" fontFamily="system-ui">HUBLI EXPRESS BUS</text>
    <path d="M14 24 L20 8 C28 0 40 0 52 0 L68 0 L66 22 C54 20 44 24 38 30 L22 40 Z"
      fill={`${accent}22`} stroke={accent} strokeWidth="1.5"/>
    <rect x="14"  y="22" width="46" height="48" rx="4" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    {[72, 130, 188, 246, 296].map((x, i) => (
      <rect key={i} x={x} y="8" width="50" height="56" rx="5" fill={`${accent}18`} stroke={accent} strokeWidth="1.5"/>
    ))}
    {[70, 128, 186, 244, 294, 330].map((x, i) => (
      <line key={i} x1={x} y1="0" x2={x} y2="98" stroke={accent} strokeWidth="2.5"/>
    ))}
    {/* Entry + emergency doors */}
    <rect x="72"  y="64" width="56" height="34" fill={`${accent}12`} stroke={accent} strokeWidth="1.5"/>
    <line x1="100" y1="64" x2="100" y2="98" stroke={accent} strokeWidth="1"/>
    <rect x="244" y="64" width="50" height="34" fill={`${accent}08`} stroke={accent} strokeWidth="1.5" strokeDasharray="4 2"/>
    {/* Body band */}
    <rect x="6"  y="72" width="332" height="8"  rx="0" fill={accent} opacity="0.2"/>
    <rect x="6"  y="90" width="332" height="10" rx="4" fill={accent} opacity="0.3"/>
    {/* Wheel arches */}
    <path d="M22 98 Q22 76 50 76 Q78 76 78 98" fill="white" stroke={accent} strokeWidth="2.5"/>
    <path d="M252 98 Q252 76 280 76 Q308 76 308 98" fill="white" stroke={accent} strokeWidth="2.5"/>
    {/* Wheels */}
    <circle cx="50"  cy="102" r="24" fill="#1E293B"/>
    <circle cx="50"  cy="102" r="15" fill="#334155"/>
    <circle cx="50"  cy="102" r="6"  fill="#94A3B8"/>
    <circle cx="280" cy="102" r="24" fill="#1E293B"/>
    <circle cx="280" cy="102" r="15" fill="#334155"/>
    <circle cx="280" cy="102" r="6"  fill="#94A3B8"/>
    <circle cx="308" cy="104" r="20" fill="#263040"/>
    <circle cx="308" cy="104" r="12" fill="#334155"/>
    <rect x="322" y="24" width="16" height="36" rx="5" fill="#FEF9C3" stroke={accent} strokeWidth="2"/>
    <rect x="6"   y="22" width="6"  height="48" rx="3" fill="#F87171"/>
  </svg>
)

const VEHICLE_SVG: Record<string, React.FC<{ accent: string }>> = {
  "mini":            MINI,
  "sedan":           SEDAN,
  "ertiga":          INNOVA,   // similar body
  "innova":          INNOVA,
  "suv":             SUV_VEC,
  "innova-crysta":   CRYSTA,
  "tempo-traveller": TEMPO,
  "mini-bus":        MINIBUS,
  "bus":             BUS_VEC,
}

export default function VehicleIllustration({ slug, name, className = "" }: Props) {
  const normalised = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const Component  = VEHICLE_SVG[normalised] || SEDAN
  const accent     = ACCENT[normalised]      || "#3B82F6"
  const bg         = BG[normalised]          || "from-slate-50 to-slate-100"

  return (
    <div className={`w-full h-full flex items-end justify-center bg-gradient-to-b ${bg} pb-1 ${className}`}>
      <Component accent={accent}/>
    </div>
  )
}
