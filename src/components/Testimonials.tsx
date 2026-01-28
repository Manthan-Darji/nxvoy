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

        {/* Testimonials Grid - 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative glass-card p-5 sm:p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-black/50 hover:border-white/20"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary/30" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold shadow-lg font-mono text-sm sm:text-base">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
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
