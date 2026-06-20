"use client";

export default function WaveAnimation() {
  return (
    <div className="relative w-full h-24 overflow-hidden bg-transparent z-10 pointer-events-none -mb-1">
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-full"
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "wave-scroll 12s linear infinite" }}
      >
        <path
          d="M0,96 C280,128 560,32 840,64 C1120,96 1400,128 1680,96 C1960,64 2240,32 2520,64 C2800,96 3080,128 3360,96 L3360,120 L0,120 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-full"
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "wave-scroll 6s linear infinite" }}
      >
        <path
          d="M0,64 C280,32 560,96 840,64 C1120,32 1400,96 1680,64 C1960,32 2240,96 2520,64 C2800,32 3080,96 3360,64 L3360,120 L0,120 Z"
          fill="#EF4444"
        />
      </svg>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
