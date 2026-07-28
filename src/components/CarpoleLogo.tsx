import React from 'react';

interface CarpoleLogoProps extends React.SVGProps<SVGSVGElement> {
  width?: string | number;
  height?: string | number;
  subtitleColor?: string;
  textColor?: string;
}

export const CarpoleLogo: React.FC<CarpoleLogoProps> = ({
  width = "100%",
  height = "100%",
  subtitleColor = "#94a3b8", // slate-400
  textColor = "#ffffff",
  className,
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 210 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 1. Yellow Accent Block above LE */}
      {/* Positioned precisely above the L (x=148) and E (x=171) */}
      <path
        d="M148,6 L184,6 C189.5,6 194,10.5 194,16 L194,16 L148,16 Z"
        fill="#f5be1a"
      />

      {/* 2. Custom Chevron Accent above O */}
      {/* Centered perfectly over O (center is x=129) */}
      <path
        d="M120,16 L129,7 L138,16"
        fill="none"
        stroke={textColor}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. High Fidelity Absolute SVG Typography for "CARPOLE" */}
      {/* Using separate text elements for pixel-perfect browser-independent kerning */}
      <g fill={textColor} fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif" fontWeight="800" fontSize="34" style={{ userSelect: 'none' }}>
        <text x="8" y="47">C</text>
        <text x="35" y="47">A</text>
        <text x="63" y="47">R</text>
        <text x="89" y="47">P</text>
        <text x="114" y="47">O</text>
        <text x="148" y="47">L</text>
        <text x="171" y="47">E</text>
      </g>

      {/* 4. Center-Aligned "INDUSTRIEL" Subtitle */}
      {/* Spans perfectly under the brand name with elegant designer tracking */}
      <text
        x="101"
        y="67"
        fill={subtitleColor}
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="0.44em"
        textAnchor="middle"
        style={{ userSelect: 'none' }}
      >
        INDUSTRIEL
      </text>
    </svg>
  );
};
