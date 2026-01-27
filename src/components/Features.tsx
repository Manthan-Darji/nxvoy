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
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose <span className="gradient-text">NxVoy?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful AI tools that transform how you plan and experience travel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="relative group"
            >
              <div className="bg-card rounded-3xl p-8 h-full shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 border border-border/50">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#14B8A6] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#1E40AF]/5 to-[#14B8A6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
