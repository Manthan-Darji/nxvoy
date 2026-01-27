import { Calendar, Landmark, Heart, Car, Mountain, Users } from "lucide-react";

const tripTypes = [
  {
    icon: Calendar,
    title: "Weekend Getaway",
    description: "Quick escapes for busy schedules",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Landmark,
    title: "Historical Tours",
    description: "Explore ancient wonders and heritage sites",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Wellness Retreats",
    description: "Rejuvenate mind, body, and soul",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Car,
    title: "Road Trips",
    description: "Epic journeys on the open road",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Mountain,
    title: "Adventure Trips",
    description: "Thrilling experiences for the bold",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Family Travel",
    description: "Create lasting memories together",
    color: "from-cyan-500 to-blue-500",
  },
];

const TripTypeGrid = () => {
  return (
    <section id="trips" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-nxvoy-blue-light text-primary text-sm font-semibold mb-4">
            Trip Types
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Every Journey, <span className="gradient-text">Perfectly Planned</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you're seeking adventure or relaxation, Shasa tailors every trip to your style.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripTypes.map((trip, index) => (
            <div
              key={trip.title}
              className="group card-trip cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${trip.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <trip.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {trip.title}
              </h3>
              <p className="text-muted-foreground">
                {trip.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TripTypeGrid;
