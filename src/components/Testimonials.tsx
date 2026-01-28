import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Last-Minute Traveler",
    avatar: "SM",
    rating: 5,
    text: "Perfect for Last-Minute Travelers! NxVoy has been a lifesaver!",
  },
  {
    name: "Raj K.",
    role: "Adventure Enthusiast",
    avatar: "RK",
    rating: 5,
    text: "The AI route optimization saved us 3 hours in Paris!",
  },
  {
    name: "Emily T.",
    role: "Frequent Traveler",
    avatar: "ET",
    rating: 5,
    text: "Best travel planning app I've used. Shasa is amazing!",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full glass text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Travelers <span className="gradient-text">Love NxVoy</span>
          </h2>
          <p className="text-foreground text-lg">
            See what our community says about their experiences with Shasa.
          </p>
        </div>

        {/* Testimonials Grid - 3 columns (Kanban-style layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative glass-card p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-black/50 hover:border-white/20"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-primary/30" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white leading-relaxed mb-6 text-lg">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold shadow-lg font-mono">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
