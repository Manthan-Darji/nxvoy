import { Plane } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const Logo = ({ className = "", iconClassName = "w-5 h-5", textClassName = "text-xl" }: LogoProps) => {
  return (
    <a href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-lg rounded-xl group-hover:bg-primary/60 transition-colors duration-300" />
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
          <Plane className={`${iconClassName} text-white -rotate-45 group-hover:rotate-0 transition-transform duration-500`} />
        </div>
      </div>
      <span className={`font-bold text-white tracking-tight ${textClassName}`}>
        Nx<span className="text-primary">Voy</span>
      </span>
    </a>
  );
};

export default Logo;
