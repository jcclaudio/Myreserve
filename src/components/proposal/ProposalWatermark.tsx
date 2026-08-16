import React from "react";

export default function ProposalWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.035] select-none print:opacity-[0.03]"
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[480px] h-[480px] text-brand-900"
      >
        <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="8" />
        <ellipse cx="250" cy="250" rx="230" ry="90" stroke="currentColor" strokeWidth="6" />
        <ellipse cx="250" cy="250" rx="90" ry="230" stroke="currentColor" strokeWidth="6" />
        <line x1="20" y1="250" x2="480" y2="250" stroke="currentColor" strokeWidth="6" />
        <line x1="250" y1="20" x2="250" y2="480" stroke="currentColor" strokeWidth="6" />
      </svg>
    </div>
  );
}
