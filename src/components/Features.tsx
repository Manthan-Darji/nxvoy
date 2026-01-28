import { Sparkles, Route, Plane } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Smart Itinerary Generator",
    description: "AI creates personalized day-by-day plans in seconds",
  },
  {
    icon: Route,
    title: "Route Optimization",
    description: "Save hours with intelligent routing between locations",
  },
  {
    icon: Plane,
    title: "Flight Status Tracker",
    description: "Real-time aviation updates and delay alerts",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-primary text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="gradient-text">NxVoy?</span>
          </h2>
          <p className="text-foreground text-lg">
            Powerful AI tools that transform how you plan and experience travel.
          </p>
        </div>

        {/* Features Grid - 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="relative group"
            >
              <div className="glass-card p-6 sm:p-8 h-full transition-all duration-300 hover:-translate-y-2 hover:bg-black/50 hover:border-white/20">
                {/* Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
