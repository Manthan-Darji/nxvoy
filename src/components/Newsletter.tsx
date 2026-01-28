import { useState } from "react";
import { Send, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Welcome aboard! ✈️",
        description: "You've subscribed to Shasa's Travel Newsletter.",
      });
      setEmail("");
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary/30 mb-4 sm:mb-6 shadow-lg">
            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Shasa's Travel Newsletter
          </h2>
          <p className="text-primary font-semibold text-base sm:text-lg mb-2">
            Stay in the Loop!
          </p>
          <p className="text-foreground text-sm sm:text-lg mb-6 sm:mb-8 px-4 sm:px-0">
            Get the best deals, smart travel hacks, and insider tips
          </p>

          {/* Form with Pill-shaped Input */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto px-4 sm:px-0">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 input-pill min-h-[48px] sm:min-h-[56px]"
              required
            />
            <Button 
              type="submit"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px]"
            >
              <span>Subscribe</span>
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-muted-foreground text-xs sm:text-sm mt-4 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            No spam, just pure wanderlust!
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
