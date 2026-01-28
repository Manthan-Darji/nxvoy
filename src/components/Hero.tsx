import { Sparkles, ArrowRight, MapPin, Plane, Globe, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-background">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Decorative Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Floating icons */}
        <div className="absolute top-1/4 left-[10%] animate-float hidden lg:block" style={{ animationDelay: "0.5s" }}>
          <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center shadow-lg">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="absolute top-1/3 right-[15%] animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center shadow-lg">
            <Plane className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-[20%] animate-float hidden lg:block" style={{ animationDelay: "1.5s" }}>
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-lg">
            <Globe className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="absolute top-1/2 right-[10%] animate-float hidden lg:block" style={{ animationDelay: "2s" }}>
          <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center shadow-lg">
            <Compass className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Content - Centered */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary text-sm font-medium mb-8 animate-fade-up">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Travel Planning</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Shasa</span> – Your
              <br />
              <span className="relative inline-block">
                AI Travel Assistant
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 150 2 298 6" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.6" />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Plan perfect trips in seconds with AI-powered itineraries
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up px-4" style={{ animationDelay: "0.3s" }}>
              <button 
                onClick={() => navigate('/signup')}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[48px] text-base sm:text-lg font-bold text-primary-foreground bg-primary rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-glow-pulse"
              >
                <span>Start Planning Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[48px] text-base sm:text-lg font-semibold text-foreground border border-white/20 rounded-xl backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white font-mono">120+</div>
                <div className="text-muted-foreground text-sm">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white font-mono">4.9★</div>
                <div className="text-muted-foreground text-sm">User Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>
    </>
  );
};

export default Hero;
