import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, MapPin, Calendar, Star, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">NxVoy</span>
          </a>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, <span className="gradient-text">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground">Ready to plan your next adventure?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">New Trip</h3>
                <p className="text-sm text-muted-foreground">Plan a new adventure</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">My Trips</h3>
                <p className="text-sm text-muted-foreground">View saved itineraries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <Star className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Favorites</h3>
                <p className="text-sm text-muted-foreground">Your saved places</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Plane className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Flight Status</h3>
                <p className="text-sm text-muted-foreground">Track your flights</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Start Planning with Shasa</CardTitle>
            <CardDescription>
              Tell Shasa where you want to go, and she'll create the perfect itinerary for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-primary-gradient border-0">
              Start a New Trip
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
