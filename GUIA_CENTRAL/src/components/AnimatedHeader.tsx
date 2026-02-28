import { memo } from "react";

const HeaderText = memo(() => (
  <div className="flex flex-col justify-center items-center text-center px-4 py-8 sm:py-12 md:py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
      Certidão no Email
    </h1>
    <p className="mt-3 text-base md:text-lg text-muted-foreground">
      Receba em poucos minutos
    </p>
  </div>
));
HeaderText.displayName = "HeaderText";

const AnimatedHeader = () => {
  return (
    <div className="relative w-full z-10">
      <HeaderText />
    </div>
  );
};

export default AnimatedHeader;
