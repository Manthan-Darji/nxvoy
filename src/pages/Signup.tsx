import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidEmail = (value: string) => {
    // Basic, pragmatic email validation (client-side only).
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();

    // STEP 4 - Debug logs
    console.log('SIGNUP STARTED with:', normalizedEmail, `*** (${password.length} chars)`);

    // STEP 4 - Client-side validation (fast fail)
    if (!isValidEmail(normalizedEmail)) {
      const message = 'Please enter a valid email address.';
      console.error('SIGNUP ERROR: invalid email format');
      toast({ title: 'Invalid email', description: message, variant: 'destructive' });
      alert('Error: ' + message);
      return;
    }

    if (password.length < 6) {
      const message = 'Password must be at least 6 characters.';
      console.error('SIGNUP ERROR: weak password');
      toast({ title: 'Password too weak', description: message, variant: 'destructive' });
      alert('Error: ' + message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      console.log('SIGNUP RESPONSE:', { data, error });

      if (error) {
        console.error('SIGNUP ERROR:', error);
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
        alert('Error: ' + error.message);
        return;
      }

      console.log('SIGNUP SUCCESS:', data);
      toast({ title: 'Account created!', description: 'Welcome to NxVoy!' });
      alert('Account created! Check your backend now.');
      navigate('/dashboard');
    } catch (err) {
      // Network errors / unexpected runtime errors
      console.error('SIGNUP ERROR (network/unexpected):', err);
      const message = err instanceof Error ? err.message : 'Network error. Please try again.';
      toast({ title: 'Network error', description: message, variant: 'destructive' });
      alert('Error: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Plane className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Create your NxVoy account to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full btn-primary-gradient border-0" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
