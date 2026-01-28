import { useState } from "react";
import { Menu, X, Plane, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white">NxVoy</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="nav-link">Features</a>
            <a href="#trips" className="nav-link">Trip Types</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-10 w-20 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Hi, {profile?.name || user.email?.split('@')[0]}
                </span>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="font-medium text-foreground hover:text-white hover:bg-white/10">
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2 border-white/20 text-foreground hover:bg-white/10 hover:text-white">
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="font-medium text-foreground hover:text-white hover:bg-white/10">
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-up">
            <div className="flex flex-col gap-4">
              <a href="#features" className="nav-link py-2">Features</a>
              <a href="#trips" className="nav-link py-2">Trip Types</a>
              <a href="#testimonials" className="nav-link py-2">Testimonials</a>
              <a href="#pricing" className="nav-link py-2">Pricing</a>
              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                {isLoading ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                ) : user ? (
                  <>
                    <p className="text-sm text-muted-foreground px-2">
                      Hi, {profile?.name || user.email?.split('@')[0]}
                    </p>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="w-full justify-start font-medium text-foreground hover:text-white hover:bg-white/10">
                      Dashboard
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="w-full gap-2 border-white/20 text-foreground hover:bg-white/10 hover:text-white">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => navigate('/login')} className="w-full justify-start font-medium text-foreground hover:text-white hover:bg-white/10">
                      Login
                    </Button>
                    <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-full">
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
