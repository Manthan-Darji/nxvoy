import { useState } from "react";
import { Sparkles, ArrowRight, MapPin, Plane, Globe, Compass } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Hero = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF] via-[#3B82F6] to-[#14B8A6] animate-gradient-shift" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Floating icons */}
        <div className="absolute top-1/4 left-[10%] animate-float hidden lg:block" style={{ animationDelay: "0.5s" }}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <MapPin className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="absolute top-1/3 right-[15%] animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Plane className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-[20%] animate-float hidden lg:block" style={{ animationDelay: "1.5s" }}>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute top-1/2 right-[10%] animate-float hidden lg:block" style={{ animationDelay: "2s" }}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Compass className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-8 animate-fade-up">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Travel Planning</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-200">Shasa</span> – Your
                <br />
                <span className="relative inline-block">
                  AI Travel Assistant
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 150 2 298 6" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-white/85 max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                Plan perfect trips in seconds with AI-powered itineraries
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-primary bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <span>Start Planning Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/40 rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/60 transition-all duration-300">
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 md:gap-12 mt-12 animate-fade-up" style={{ animationDelay: "0.4s" }}>
                <div className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white">50K+</div>
                  <div className="text-white/70 text-sm">Happy Travelers</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white">120+</div>
                  <div className="text-white/70 text-sm">Countries</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-bold text-white">4.9★</div>
                  <div className="text-white/70 text-sm">User Rating</div>
                </div>
              </div>
            </div>

            {/* Right Content - Travel Illustration */}
            <div className="hidden lg:flex items-center justify-center animate-fade-up" style={{ animationDelay: "0.5s" }}>
              <div className="relative">
                {/* Main Card */}
                <div className="w-80 h-96 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
                  <div className="w-full h-48 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-2xl mb-4 flex items-center justify-center">
                    <Globe className="w-20 h-20 text-white/80" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded-full w-3/4" />
                    <div className="h-4 bg-white/15 rounded-full w-1/2" />
                    <div className="h-4 bg-white/10 rounded-full w-2/3" />
                  </div>
                  <div className="mt-6 flex gap-2">
                    <div className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">Paris</div>
                    <div className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">Tokyo</div>
                    <div className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">Bali</div>
                  </div>
                </div>
                
                {/* Floating mini cards */}
                <div className="absolute -top-8 -right-8 w-32 h-24 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 p-3 shadow-xl animate-float">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Flight</span>
                  </div>
                  <div className="text-white text-lg font-bold">$299</div>
                </div>
                
                <div className="absolute -bottom-6 -left-8 w-36 h-20 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 p-3 shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    <span className="text-white text-xs font-medium">AI Generated</span>
                  </div>
                  <div className="text-white/80 text-xs mt-1">3-day itinerary ready!</div>
                </div>
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

      {/* Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Chat with Shasa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                👋 Hi! I'm Shasa, your AI travel assistant. Tell me about your dream trip and I'll help you plan it!
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Where would you like to go?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button className="gradient-primary text-white">
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Hero;
