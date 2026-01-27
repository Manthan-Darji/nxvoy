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
    <section className="py-24 relative overflow-hidden">
      {/* Light Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/10 via-[#3B82F6]/5 to-[#14B8A6]/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-[#1E40AF]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#14B8A6] mb-6 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Shasa's Travel Newsletter
          </h2>
          <p className="text-primary font-semibold text-lg mb-2">
            Stay in the Loop!
          </p>
          <p className="text-muted-foreground text-lg mb-8">
            Get the best deals, smart travel hacks, and insider tips
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 px-5 rounded-xl border-2 border-border bg-background focus:border-primary transition-colors"
              required
            />
            <Button 
              type="submit"
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#14B8A6] text-white hover:opacity-90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span>Subscribe</span>
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-muted-foreground text-sm mt-4 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            No spam, just pure wanderlust!
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
