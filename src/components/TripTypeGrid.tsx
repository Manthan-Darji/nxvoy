import { useState } from "react";
import { Calendar, Landmark, Heart, Car, Mountain, Users, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tripTypes = [
  {
    icon: Calendar,
    title: "Weekend Getaway",
    description: "A short and sweet trip to recharge your soul",
    color: "from-primary to-primary/70",
    prompt: "Plan a weekend getaway trip for me",
  },
  {
    icon: Landmark,
    title: "Historical Tours",
    description: "Explore history like never before",
    color: "from-amber-500 to-orange-500",
    prompt: "Plan a historical tour trip for me",
  },
  {
    icon: Heart,
    title: "Wellness Retreats",
    description: "Serene spots to pamper yourself in pure bliss",
    color: "from-pink-500 to-rose-500",
    prompt: "Plan a wellness retreat trip for me",
  },
  {
    icon: Car,
    title: "Road Trips",
    description: "Scenic drives and open roads to fuel your wanderlust",
    color: "from-accent to-accent/70",
    prompt: "Plan a road trip for me",
  },
  {
    icon: Mountain,
    title: "Adventure Trips",
    description: "Thrilling experiences that will leave you saying WOW",
    color: "from-violet-500 to-purple-600",
    prompt: "Plan an adventure trip for me",
  },
  {
    icon: Users,
    title: "Family Travel",
    description: "Kid-friendly attractions and stress-free family plans",
    color: "from-primary to-accent",
    prompt: "Plan a family-friendly trip for me",
  },
];

const TripTypeGrid = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [message, setMessage] = useState("");

  const handleTripClick = (tripPrompt: string) => {
    setSelectedTrip(tripPrompt);
    setMessage(tripPrompt);
    setChatOpen(true);
  };

  return (
    <>
      <section id="trips" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass text-primary text-sm font-semibold mb-4">
              Trip Types
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What's Your <span className="gradient-text">Travel Vibe?</span>
            </h2>
            <p className="text-foreground text-lg">
              Whether you're seeking adventure or relaxation, Shasa tailors every trip to your style.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripTypes.map((trip, index) => (
              <div
                key={trip.title}
                onClick={() => handleTripClick(trip.prompt)}
                className="group glass-card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:bg-black/50 hover:border-white/20 overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${trip.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <trip.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                  {trip.title}
                </h3>
                <p className="text-foreground">
                  {trip.description}
                </p>
                
                {/* Hover indicator */}
                <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Start planning</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-lg glass border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-primary" />
              Chat with Shasa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <p className="text-sm text-foreground">
                👋 Great choice! Tell me more about your ideal trip and I'll create a personalized itinerary for you!
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add more details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripTypeGrid;
