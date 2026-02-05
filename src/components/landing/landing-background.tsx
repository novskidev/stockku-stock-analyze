export function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[#0B0E14]" />
      <div className="absolute inset-0 landing-grid opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0E14]/80 to-[#0B0E14]" />
      <div className="absolute top-[18%] right-[8%] h-[520px] w-[520px] rounded-full bg-[#13ec5b]/10 blur-[120px]" />
      <div className="absolute bottom-[8%] left-[12%] h-[620px] w-[620px] rounded-full bg-blue-500/10 blur-[120px]" />
    </div>
  );
}
