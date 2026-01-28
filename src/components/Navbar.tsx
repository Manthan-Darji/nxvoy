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
    setIsOpen(false);
    navigate('/');
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Always visible */}
          <a href="/" className="flex items-center gap-2 z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">NxVoy</span>
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

          {/* Mobile Menu Button - Hamburger */}
          <button
            className="md:hidden p-3 text-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation - Full screen overlay */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-black/95 backdrop-blur-lg animate-fade-in z-40">
            <div className="flex flex-col p-6 gap-2">
              <a 
                href="#features" 
                onClick={() => handleNavClick('#features')}
                className="nav-link py-4 text-lg border-b border-white/10"
              >
                Features
              </a>
              <a 
                href="#trips" 
                onClick={() => handleNavClick('#trips')}
                className="nav-link py-4 text-lg border-b border-white/10"
              >
                Trip Types
              </a>
              <a 
                href="#testimonials" 
                onClick={() => handleNavClick('#testimonials')}
                className="nav-link py-4 text-lg border-b border-white/10"
              >
                Testimonials
              </a>
              <a 
                href="#pricing" 
                onClick={() => handleNavClick('#pricing')}
                className="nav-link py-4 text-lg border-b border-white/10"
              >
                Pricing
              </a>
              
              {/* Auth buttons in mobile menu */}
              <div className="flex flex-col gap-3 pt-6 mt-4">
                {isLoading ? (
                  <div className="h-12 bg-muted animate-pulse rounded-md"></div>
                ) : user ? (
                  <>
                    <p className="text-sm text-muted-foreground px-1">
                      Logged in as {profile?.name || user.email?.split('@')[0]}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/dashboard');
                      }} 
                      className="w-full justify-center font-medium text-foreground border-white/20 hover:bg-white/10 hover:text-white min-h-[48px] text-base"
                    >
                      Go to Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout} 
                      className="w-full gap-2 justify-center text-foreground hover:bg-white/10 hover:text-white min-h-[48px] text-base"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/login');
                      }} 
                      className="w-full justify-center font-medium text-foreground border-white/20 hover:bg-white/10 hover:text-white min-h-[48px] text-base"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/signup');
                      }} 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-full min-h-[48px] text-base"
                    >
                      Sign Up Free
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
