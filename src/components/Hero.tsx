import { Sparkles, ArrowRight, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-95" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      
      {/* Floating icons */}
      <div className="absolute top-1/4 left-[15%] animate-float" style={{ animationDelay: "0.5s" }}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute top-1/3 right-[20%] animate-float" style={{ animationDelay: "1s" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Travel Planning</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Meet <span className="text-white/90">Shasa</span> – Your
            <br />
            <span className="relative">
              AI Travel Assistant
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10C50 4 150 2 298 6" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Plan perfect trips in seconds with AI-powered itineraries
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <button className="btn-primary-gradient bg-white text-primary hover:bg-white/90">
              <span className="gradient-text font-bold">Start Planning Free</span>
              <ArrowRight className="w-5 h-5 text-primary" />
            </button>
            <button className="btn-outline-hero">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">50K+</div>
              <div className="text-white/70 text-sm">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">120+</div>
              <div className="text-white/70 text-sm">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">4.9★</div>
              <div className="text-white/70 text-sm">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
