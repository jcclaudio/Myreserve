import React from "react";

interface FixLogoProps {
  className?: string;
  variant?: "light" | "dark" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function FixLogo({
  className = "",
  variant = "dark",
  size = "md",
  showText = true,
}: FixLogoProps) {
  // Sizing definitions
  const heights = {
    sm: "h-7",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  };

  // Color palette
  // Gold: #d5b67a / #c5a363
  // Navy: #1c3658 / #162a45
  const goldFill = "#d5b67a";
  const navyFill = "#1c3658";
  const whiteFill = "#ffffff";

  const textColor =
    variant === "light"
      ? goldFill
      : variant === "gold"
      ? goldFill
      : navyFill;

  const subtextColor =
    variant === "light"
      ? goldFill
      : variant === "gold"
      ? goldFill
      : navyFill;

  const sphereColor = goldFill;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 420 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heights[size]} w-auto aspect-[420/180]`}
      >
        {/* Globe / Sphere with horizontal ribbons */}
        <g transform="translate(240, 10)">
          {/* Top cap ribbon */}
          <path
            d="M50 25 C75 18 100 20 115 32 C105 28 80 25 50 25 Z"
            fill={sphereColor}
          />
          {/* Ribbon 1 */}
          <path
            d="M32 45 C70 32 120 34 145 52 C125 43 75 38 32 45 Z"
            fill={sphereColor}
          />
          {/* Ribbon 2 */}
          <path
            d="M12 75 C60 55 130 55 158 82 C135 68 65 65 12 75 Z"
            fill={sphereColor}
          />
          {/* Ribbon 3 */}
          <path
            d="M0 110 C50 88 135 85 162 118 C135 100 55 100 0 110 Z"
            fill={sphereColor}
          />
          {/* Ribbon 4 */}
          <path
            d="M8 145 C50 130 125 128 150 152 C125 138 55 140 8 145 Z"
            fill={sphereColor}
          />
          {/* Bottom cap ribbon */}
          <path
            d="M30 170 C65 162 115 160 128 174 C110 166 65 167 30 170 Z"
            fill={sphereColor}
          />
        </g>

        {showText && (
          <g>
            {/* Word "FIX" */}
            <text
              x="10"
              y="115"
              fontFamily="system-ui, -apple-system, 'Cinzel', 'Playfair Display', serif, sans-serif"
              fontSize="120"
              fontWeight="300"
              letterSpacing="6"
              fill={textColor}
            >
              FIX
            </text>

            {/* Word "TURISMO" */}
            <text
              x="14"
              y="158"
              fontFamily="system-ui, -apple-system, 'Montserrat', sans-serif"
              fontSize="24"
              fontWeight="400"
              letterSpacing="18"
              fill={subtextColor}
            >
              TURISMO
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function FixIcon({
  className = "h-8 w-8",
  color = "#d5b67a",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(10, 0)">
        <path
          d="M50 25 C75 18 100 20 115 32 C105 28 80 25 50 25 Z"
          fill={color}
        />
        <path
          d="M32 45 C70 32 120 34 145 52 C125 43 75 38 32 45 Z"
          fill={color}
        />
        <path
          d="M12 75 C60 55 130 55 158 82 C135 68 65 65 12 75 Z"
          fill={color}
        />
        <path
          d="M0 110 C50 88 135 85 162 118 C135 100 55 100 0 110 Z"
          fill={color}
        />
        <path
          d="M8 145 C50 130 125 128 150 152 C125 138 55 140 8 145 Z"
          fill={color}
        />
        <path
          d="M30 170 C65 162 115 160 128 174 C110 166 65 167 30 170 Z"
          fill={color}
        />
      </g>
    </svg>
  );
}
