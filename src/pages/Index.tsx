import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { MessageSquare, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-6 bg-primary rounded-full shadow-lg">
              <MessageSquare className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Let's Talk
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect and chat with your friends in a professional, secure environment. 
            Real-time messaging made simple and beautiful.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="min-w-[200px] text-lg"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Real-time Chat</h3>
            <p className="text-muted-foreground text-sm">
              Instant messaging with your friends. Messages delivered in real-time.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="p-3 bg-accent/10 rounded-full w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Friend Management</h3>
            <p className="text-muted-foreground text-sm">
              Send friend requests, accept invites, and build your network.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
            <p className="text-muted-foreground text-sm">
              Your conversations are secure with authentication and privacy controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
