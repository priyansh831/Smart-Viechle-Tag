import React from 'react';

interface HeroLandingProps {
  onGetStarted: () => void;
  onViewDemo: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onGetStarted,
  onViewDemo
}) => {
  return (
    <section className="bg-white py-12 sm:py-20 px-4 text-center select-none">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Giant Hero Typography matching Screenshot 446 */}
        <div className="space-y-1 sm:space-y-2 mb-6">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-black leading-none">
            DON&apos;T SHARE
          </h1>
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-black leading-none">
            YOUR
          </h2>
          <div className="pt-2">
            <div className="bg-black px-6 sm:px-12 py-2 sm:py-3 inline-block shadow-lg">
              <span className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tight text-yellow-400 leading-none">
                NUMBER
              </span>
            </div>
          </div>
        </div>

        {/* Subtitle with Indian Context */}
        <p className="text-sm sm:text-base md:text-lg font-medium text-neutral-700 max-w-xl mx-auto leading-relaxed mb-8">
          Never write your personal mobile number on a paper slip on your car dashboard in Delhi, Mumbai, Bengaluru, or Gurgaon. Protect yourself and your family with a FASTag-style SmartTag India QR.
        </p>

        {/* CTA Buttons matching Screenshot 446 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-black text-yellow-400 font-black uppercase tracking-wider text-sm px-8 py-3.5 border-2 border-black hover:bg-yellow-400 hover:text-black transition-all shadow-[4px_4px_0px_0px_#000] cursor-pointer"
          >
            GET STARTED FREE
          </button>

          <button
            onClick={onViewDemo}
            className="w-full sm:w-auto bg-white text-black font-black uppercase tracking-wider text-sm px-8 py-3.5 border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#000] cursor-pointer"
          >
            VIEW DEMO
          </button>
        </div>
      </div>
    </section>
  );
};
