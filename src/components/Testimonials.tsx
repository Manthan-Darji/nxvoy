import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Adventure Traveler",
    avatar: "SC",
    rating: 5,
    text: "Shasa planned my entire 3-week Southeast Asia trip in minutes. The route optimization saved me so much time and money!",
  },
  {
    name: "Marcus Johnson",
    role: "Business Traveler",
    avatar: "MJ",
    rating: 5,
    text: "The flight tracking feature is a game-changer. I'm always informed about delays before the airline even notifies me.",
  },
  {
    name: "Elena Rodriguez",
    role: "Family Vacationer",
    avatar: "ER",
    rating: 5,
    text: "Planning trips with kids used to be stressful. Now Shasa handles everything – from kid-friendly restaurants to activity timings.",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-nxvoy-blue-light text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by <span className="gradient-text">Travelers Worldwide</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            See what our community says about their experiences with Shasa.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-3xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
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
