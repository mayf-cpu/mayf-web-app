import React from 'react';

interface FormulaDiagramProps {
  type?: string;
  caption?: string;
  className?: string;
}

export const FormulaDiagram: React.FC<FormulaDiagramProps> = ({
  type,
  caption,
  className = '',
}) => {
  if (!type) return null;

  return (
    <div className={`bg-slate-50 border border-slate-200/80 rounded-xl p-5 my-4 text-center ${className}`}>
      <div className="flex justify-center items-center py-2">
        {renderDiagramSvg(type)}
      </div>
      {caption && (
        <p className="text-xs text-slate-500 mt-3 font-medium italic">
          {caption}
        </p>
      )}
    </div>
  );
};

function renderDiagramSvg(type: string): React.ReactNode {
  switch (type) {
    case 'pythagoras-triangle':
    case 'right-triangle':
      return (
        <svg viewBox="0 0 320 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Right angled triangle */}
          <polygon
            points="50,160 270,160 50,40"
            fill="#EFF6FF"
            stroke="#1D4ED8"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Right angle symbol */}
          <polyline
            points="50,140 70,140 70,160"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
          />
          {/* Perpendicular label */}
          <text x="32" y="105" fill="#1E3A8A" fontSize="13" fontWeight="bold" textAnchor="middle">
            p (altitude)
          </text>
          {/* Base label */}
          <text x="160" y="182" fill="#1E3A8A" fontSize="13" fontWeight="bold" textAnchor="middle">
            b (base)
          </text>
          {/* Hypotenuse label */}
          <text x="175" y="90" fill="#00687A" fontSize="13" fontWeight="bold" textAnchor="middle">
            h = √(p² + b²)
          </text>
          {/* Vertices */}
          <circle cx="50" cy="160" r="4" fill="#1D4ED8" />
          <circle cx="270" cy="160" r="4" fill="#1D4ED8" />
          <circle cx="50" cy="40" r="4" fill="#1D4ED8" />
          <text x="40" y="175" fill="#475569" fontSize="11" fontWeight="bold">B (90°)</text>
          <text x="275" y="175" fill="#475569" fontSize="11" fontWeight="bold">C</text>
          <text x="40" y="32" fill="#475569" fontSize="11" fontWeight="bold">A</text>
        </svg>
      );

    case 'trig-triangle':
      return (
        <svg viewBox="0 0 320 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          <polygon
            points="50,160 270,160 50,40"
            fill="#F0FDF4"
            stroke="#16A34A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polyline points="50,140 70,140 70,160" fill="none" stroke="#15803D" strokeWidth="2" />
          {/* Angle theta arc at C */}
          <path d="M 230 160 A 40 40 0 0 0 242 145" fill="none" stroke="#DC2626" strokeWidth="2" />
          <text x="220" y="152" fill="#DC2626" fontSize="14" fontWeight="bold">θ</text>
          <text x="30" y="105" fill="#15803D" fontSize="12" fontWeight="bold" textAnchor="middle">Opposite side</text>
          <text x="160" y="180" fill="#15803D" fontSize="12" fontWeight="bold" textAnchor="middle">Adjacent side</text>
          <text x="175" y="90" fill="#1D4ED8" fontSize="12" fontWeight="bold" textAnchor="middle">Hypotenuse</text>
        </svg>
      );

    case 'coordinate-distance':
      return (
        <svg viewBox="0 0 320 210" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Coordinate axes */}
          <line x1="30" y1="180" x2="290" y2="180" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="50" y1="20" x2="50" y2="195" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="295" y="184" fill="#64748B" fontSize="12" fontWeight="bold">X</text>
          <text x="46" y="15" fill="#64748B" fontSize="12" fontWeight="bold">Y</text>
          <text x="40" y="195" fill="#94A3B8" fontSize="10">O</text>

          {/* Points A and B */}
          {/* A(90, 130) and B(240, 60) */}
          <line x1="90" y1="130" x2="240" y2="60" stroke="#1D4ED8" strokeWidth="3" />
          <line x1="90" y1="130" x2="240" y2="130" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="240" y1="130" x2="240" y2="60" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Right angle at (240, 130) */}
          <polyline points="230,130 230,120 240,120" fill="none" stroke="#64748B" strokeWidth="1.5" />

          <circle cx="90" cy="130" r="5" fill="#1D4ED8" />
          <circle cx="240" cy="60" r="5" fill="#1D4ED8" />

          <text x="80" y="150" fill="#0F172A" fontSize="11" fontWeight="bold">A (x₁, y₁)</text>
          <text x="245" y="55" fill="#0F172A" fontSize="11" fontWeight="bold">B (x₂, y₂)</text>
          <text x="160" y="145" fill="#64748B" fontSize="11" textAnchor="middle">Δx = x₂ - x₁</text>
          <text x="268" y="100" fill="#64748B" fontSize="11">Δy = y₂ - y₁</text>
          <text x="150" y="85" fill="#1D4ED8" fontSize="12" fontWeight="bold">d</text>
        </svg>
      );

    case 'section-formula':
      return (
        <svg viewBox="0 0 320 140" className="w-full max-w-xs h-auto drop-shadow-xs">
          <line x1="40" y1="70" x2="280" y2="70" stroke="#1D4ED8" strokeWidth="3" />
          <circle cx="40" cy="70" r="5" fill="#1D4ED8" />
          <circle cx="140" cy="70" r="6" fill="#06B6D4" stroke="#0E7490" strokeWidth="2" />
          <circle cx="280" cy="70" r="5" fill="#1D4ED8" />

          <text x="40" y="95" fill="#0F172A" fontSize="11" fontWeight="bold" textAnchor="middle">A(x₁, y₁)</text>
          <text x="140" y="98" fill="#00687A" fontSize="12" fontWeight="bold" textAnchor="middle">P(x, y)</text>
          <text x="280" y="95" fill="#0F172A" fontSize="11" fontWeight="bold" textAnchor="middle">B(x₂, y₂)</text>

          {/* Ratio segments */}
          <path d="M 40 50 Q 90 35 140 50" fill="none" stroke="#0284C7" strokeWidth="2" />
          <text x="90" y="38" fill="#0284C7" fontSize="12" fontWeight="bold" textAnchor="middle">m₁</text>

          <path d="M 140 50 Q 210 35 280 50" fill="none" stroke="#0E7490" strokeWidth="2" />
          <text x="210" y="38" fill="#0E7490" fontSize="12" fontWeight="bold" textAnchor="middle">m₂</text>
        </svg>
      );

    case 'cylinder-3d':
      return (
        <svg viewBox="0 0 280 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Bottom ellipse */}
          <ellipse cx="140" cy="150" rx="70" ry="22" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          {/* Body */}
          <path d="M 70 50 L 70 150 A 70 22 0 0 0 210 150 L 210 50 Z" fill="#F0F9FF" fillOpacity="0.7" />
          <line x1="70" y1="50" x2="70" y2="150" stroke="#0284C7" strokeWidth="2" />
          <line x1="210" y1="50" x2="210" y2="150" stroke="#0284C7" strokeWidth="2" />
          {/* Top ellipse */}
          <ellipse cx="140" cy="50" rx="70" ry="22" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />

          {/* Radius line on top */}
          <line x1="140" y1="50" x2="210" y2="50" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="140" cy="50" r="3" fill="#1D4ED8" />
          <text x="175" y="44" fill="#1D4ED8" fontSize="11" fontWeight="bold">r</text>

          {/* Height marker */}
          <line x1="50" y1="50" x2="50" y2="150" stroke="#64748B" strokeWidth="1.5" />
          <polyline points="46,55 50,50 54,55" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <polyline points="46,145 50,150 54,145" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <text x="35" y="105" fill="#475569" fontSize="12" fontWeight="bold">h</text>
        </svg>
      );

    case 'cone-3d':
      return (
        <svg viewBox="0 0 280 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Base ellipse */}
          <ellipse cx="140" cy="155" rx="75" ry="25" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          {/* Slant sides */}
          <polygon points="140,35 65,155 215,155" fill="#FFFBEB" fillOpacity="0.8" />
          <line x1="140" y1="35" x2="65" y2="155" stroke="#D97706" strokeWidth="2" />
          <line x1="140" y1="35" x2="215" y2="155" stroke="#D97706" strokeWidth="2" />
          {/* Altitude inside */}
          <line x1="140" y1="35" x2="140" y2="155" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="140" y1="155" x2="215" y2="155" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="3 3" />
          {/* Right angle */}
          <polyline points="140,145 150,145 150,155" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="140" cy="155" r="3" fill="#D97706" />

          <text x="125" y="100" fill="#475569" fontSize="12" fontWeight="bold">h</text>
          <text x="175" y="150" fill="#1D4ED8" fontSize="11" fontWeight="bold">r</text>
          <text x="185" y="85" fill="#B45309" fontSize="12" fontWeight="bold">l (slant)</text>
        </svg>
      );

    case 'sphere-3d':
      return (
        <svg viewBox="0 0 280 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Gradient filled circle */}
          <defs>
            <radialGradient id="sphereGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="70%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </radialGradient>
          </defs>
          <circle cx="140" cy="100" r="70" fill="url(#sphereGrad)" stroke="#0369A1" strokeWidth="2" />
          {/* Equator ellipse */}
          <ellipse cx="140" cy="100" rx="70" ry="20" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          {/* Center and radius */}
          <circle cx="140" cy="100" r="3.5" fill="#FFFFFF" />
          <line x1="140" y1="100" x2="210" y2="100" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="175" y="93" fill="#FFFFFF" fontSize="12" fontWeight="bold">r</text>
        </svg>
      );

    case 'fraction-bars':
      return (
        <svg viewBox="0 0 320 170" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Fraction 1: 1/2 */}
          <text x="30" y="35" fill="#1E3A8A" fontSize="12" fontWeight="bold">1/2</text>
          <rect x="70" y="20" width="100" height="24" fill="#3B82F6" rx="3" stroke="#1D4ED8" strokeWidth="1.5" />
          <rect x="170" y="20" width="100" height="24" fill="#F1F5F9" rx="3" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Fraction 2: 1/3 */}
          <text x="30" y="80" fill="#065F46" fontSize="12" fontWeight="bold">1/3</text>
          <rect x="70" y="65" width="66.6" height="24" fill="#10B981" rx="3" stroke="#059669" strokeWidth="1.5" />
          <rect x="136.6" y="65" width="66.6" height="24" fill="#F1F5F9" rx="3" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="203.2" y="65" width="66.6" height="24" fill="#F1F5F9" rx="3" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Common denominator 6: 3/6 + 2/6 = 5/6 */}
          <text x="30" y="130" fill="#991B1B" fontSize="12" fontWeight="bold">5/6</text>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={70 + i * 33.3} y="115" width="33.3" height="24" fill="#60A5FA" stroke="#2563EB" strokeWidth="1" />
          ))}
          {[3, 4].map((i) => (
            <rect key={i} x={70 + i * 33.3} y="115" width="33.3" height="24" fill="#34D399" stroke="#059669" strokeWidth="1" />
          ))}
          <rect x={70 + 5 * 33.3} y="115" width="33.3" height="24" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
          <text x="170" y="157" fill="#64748B" fontSize="10" textAnchor="middle">LCM(2, 3) = 6 equal parts</text>
        </svg>
      );

    case 'simple-interest-timeline':
      return (
        <svg viewBox="0 0 320 150" className="w-full max-w-xs h-auto drop-shadow-xs">
          <line x1="40" y1="90" x2="280" y2="90" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="50" cy="90" r="6" fill="#1D4ED8" />
          <circle cx="150" cy="90" r="5" fill="#0284C7" />
          <circle cx="250" cy="90" r="6" fill="#059669" />

          <text x="50" y="115" fill="#1D4ED8" fontSize="11" fontWeight="bold" textAnchor="middle">Year 0 (P)</text>
          <text x="150" y="115" fill="#0284C7" fontSize="11" fontWeight="bold" textAnchor="middle">Time (T)</text>
          <text x="250" y="115" fill="#059669" fontSize="11" fontWeight="bold" textAnchor="middle">Amount (A)</text>

          {/* Interest accrued bracket */}
          <path d="M 50 70 Q 150 40 250 70" fill="none" stroke="#F59E0B" strokeWidth="2" />
          <text x="150" y="42" fill="#B45309" fontSize="12" fontWeight="bold" textAnchor="middle">
            Interest = (P × R × T) / 100
          </text>
          <text x="150" y="135" fill="#64748B" fontSize="10" textAnchor="middle">
            Total Amount A = Principal + Simple Interest
          </text>
        </svg>
      );

    case 'probability-sample-space':
      return (
        <svg viewBox="0 0 300 160" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Universal Sample Space rectangle S */}
          <rect x="30" y="20" width="240" height="120" rx="8" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
          <text x="45" y="42" fill="#475569" fontSize="12" fontWeight="bold">Sample Space S</text>

          {/* Event circle E */}
          <circle cx="130" cy="80" r="42" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
          <text x="130" y="76" fill="#1E3A8A" fontSize="12" fontWeight="bold" textAnchor="middle">Event E</text>
          <text x="130" y="94" fill="#3B82F6" fontSize="10" textAnchor="middle">n(E) outcomes</text>

          {/* Complement */}
          <text x="210" y="85" fill="#64748B" fontSize="11" textAnchor="middle">Not E (E')</text>
          <text x="150" y="152" fill="#0F172A" fontSize="10" fontWeight="bold" textAnchor="middle">
            P(E) = n(E) / n(S)  |  P(E) + P(E') = 1
          </text>
        </svg>
      );

    case 'statistics-mean':
    case 'statistics-histogram':
      return (
        <svg viewBox="0 0 300 160" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Histogram bars */}
          <line x1="30" y1="130" x2="270" y2="130" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="30" y1="20" x2="30" y2="130" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Bars */}
          <rect x="45" y="90" width="30" height="40" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />
          <rect x="85" y="60" width="30" height="70" fill="#7DD3FC" stroke="#0284C7" strokeWidth="1" />
          <rect x="125" y="40" width="30" height="90" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <rect x="165" y="70" width="30" height="60" fill="#7DD3FC" stroke="#0284C7" strokeWidth="1" />
          <rect x="205" y="100" width="30" height="30" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />

          {/* Mean vertical dashed line */}
          <line x1="140" y1="25" x2="140" y2="130" stroke="#DC2626" strokeWidth="2" strokeDasharray="3 3" />
          <text x="140" y="20" fill="#DC2626" fontSize="11" fontWeight="bold" textAnchor="middle">Mean (x̄)</text>
          <text x="150" y="148" fill="#64748B" fontSize="10" textAnchor="middle">x̄ = Σ(fᵢ · xᵢ) / Σfᵢ</text>
        </svg>
      );

    case 'algebra-parabola':
    case 'quadratic-roots':
      return (
        <svg viewBox="0 0 300 160" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Cartesian axes */}
          <line x1="30" y1="100" x2="270" y2="100" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="150" y1="20" x2="150" y2="140" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Parabola y = ax² + bx + c */}
          <path d="M 60 30 Q 150 150 240 30" fill="none" stroke="#1D4ED8" strokeWidth="2.5" />

          {/* Intersecting roots on X-axis */}
          {/* Roots where curve crosses y=100 around x=86 and x=214 */}
          <circle cx="88" cy="100" r="4.5" fill="#DC2626" />
          <circle cx="212" cy="100" r="4.5" fill="#DC2626" />

          <text x="75" y="116" fill="#DC2626" fontSize="11" fontWeight="bold">α</text>
          <text x="220" y="116" fill="#DC2626" fontSize="11" fontWeight="bold">β</text>
          <text x="150" y="132" fill="#1D4ED8" fontSize="10" fontWeight="bold" textAnchor="middle">
            Vertex: (-b/2a, -D/4a)
          </text>
        </svg>
      );

    case 'ap-numberline':
      return (
        <svg viewBox="0 0 320 120" className="w-full max-w-xs h-auto drop-shadow-xs">
          <line x1="30" y1="70" x2="290" y2="70" stroke="#94A3B8" strokeWidth="2" />
          {[
            { x: 50, label: 'a' },
            { x: 110, label: 'a+d' },
            { x: 170, label: 'a+2d' },
            { x: 230, label: 'a+3d' },
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy="70" r="5" fill="#1D4ED8" />
              <text x={pt.x} y="92" fill="#0F172A" fontSize="11" fontWeight="bold" textAnchor="middle">
                {pt.label}
              </text>
              {i < 3 && (
                <path
                  d={`M ${pt.x} 58 Q ${pt.x + 30} 42 ${pt.x + 60} 58`}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="1.8"
                />
              )}
              {i < 3 && (
                <text x={pt.x + 30} y="44" fill="#0E7490" fontSize="10" fontWeight="bold" textAnchor="middle">
                  +d
                </text>
              )}
            </g>
          ))}
          <text x="268" y="73" fill="#64748B" fontSize="14" fontWeight="bold">···</text>
        </svg>
      );

    case 'bpt-triangle':
      return (
        <svg viewBox="0 0 300 180" className="w-full max-w-xs h-auto drop-shadow-xs">
          {/* Main Triangle ABC */}
          <polygon points="150,25 50,155 250,155" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
          {/* Parallel line DE parallel to BC */}
          <line x1="90" y1="103" x2="210" y2="103" stroke="#2563EB" strokeWidth="2.5" />

          {/* Points */}
          <circle cx="150" cy="25" r="3.5" fill="#1E293B" />
          <circle cx="50" cy="155" r="3.5" fill="#1E293B" />
          <circle cx="250" cy="155" r="3.5" fill="#1E293B" />
          <circle cx="90" cy="103" r="4" fill="#2563EB" />
          <circle cx="210" cy="103" r="4" fill="#2563EB" />

          <text x="150" y="16" fill="#0F172A" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
          <text x="36" y="160" fill="#0F172A" fontSize="11" fontWeight="bold">B</text>
          <text x="256" y="160" fill="#0F172A" fontSize="11" fontWeight="bold">C</text>
          <text x="75" y="105" fill="#2563EB" fontSize="11" fontWeight="bold">D</text>
          <text x="220" y="105" fill="#2563EB" fontSize="11" fontWeight="bold">E</text>

          <text x="150" y="172" fill="#0284C7" fontSize="11" fontWeight="bold" textAnchor="middle">
            DE ∥ BC ⟹ AD / DB = AE / EC
          </text>
        </svg>
      );

    case 'circle-angles':
      return (
        <svg viewBox="0 0 280 200" className="w-full max-w-xs h-auto drop-shadow-xs">
          <circle cx="140" cy="105" r="75" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
          {/* Center O */}
          <circle cx="140" cy="105" r="4" fill="#0284C7" />
          <text x="148" y="105" fill="#0284C7" fontSize="11" fontWeight="bold">O</text>

          {/* Chord AB */}
          {/* A(85, 150) and B(195, 150) */}
          <circle cx="85" cy="150" r="3.5" fill="#0F172A" />
          <circle cx="195" cy="150" r="3.5" fill="#0F172A" />
          <text x="72" y="160" fill="#0F172A" fontSize="11" fontWeight="bold">A</text>
          <text x="202" y="160" fill="#0F172A" fontSize="11" fontWeight="bold">B</text>

          {/* Angle at centre */}
          <line x1="85" y1="150" x2="140" y2="105" stroke="#0284C7" strokeWidth="1.8" />
          <line x1="195" y1="150" x2="140" y2="105" stroke="#0284C7" strokeWidth="1.8" />
          <text x="140" y="125" fill="#0369A1" fontSize="11" fontWeight="bold" textAnchor="middle">2θ</text>

          {/* Point C on circle top */}
          {/* C(140, 30) */}
          <circle cx="140" cy="30" r="3.5" fill="#DC2626" />
          <text x="140" y="22" fill="#DC2626" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>
          <line x1="85" y1="150" x2="140" y2="30" stroke="#DC2626" strokeWidth="1.8" />
          <line x1="195" y1="150" x2="140" y2="30" stroke="#DC2626" strokeWidth="1.8" />
          <text x="140" y="48" fill="#DC2626" fontSize="11" fontWeight="bold" textAnchor="middle">θ</text>
        </svg>
      );

    default:
      return null;
  }
}
