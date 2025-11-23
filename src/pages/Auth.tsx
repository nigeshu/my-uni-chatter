import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'student' | 'admin'>('student');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check for existing session and redirect
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        // Check if maintenance mode is enabled for students
        if (profile?.role === 'student') {
          const { data: settings } = await supabase
            .from('semester_settings')
            .select('maintenance_mode_enabled')
            .maybeSingle();
          
          if (settings?.maintenance_mode_enabled) {
            navigate('/maintenance', { replace: true });
            return;
          }
        }
        
        // Use replace to avoid navigation issues
        navigate(profile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during Google sign in.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Admin login only
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        toast({
          title: 'Error',
          description: 'This account is not an admin account.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Welcome!',
        description: 'Successfully logged in.',
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during authentication.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Playful Bot */}
      <div className="absolute top-8 right-8 animate-bounce hidden md:block">
        <div className="relative group cursor-pointer">
          <div className="text-6xl transition-transform group-hover:scale-110">🤖</div>
          <div className="absolute -bottom-12 right-0 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <p className="text-sm font-medium">Hey there! Ready to learn? 🚀</p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="absolute top-8 left-8 max-w-md hidden lg:block animate-fade-in">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 shadow-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
            Lernet
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            A comprehensive Learning Management System designed to empower students and educators. Track your progress, manage courses, collaborate with friends, and excel in your academic journey.
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="font-semibold text-sm mb-1">Smart Progress Tracking</h3>
                <p className="text-xs text-muted-foreground">Monitor your CGPA, course completion, and academic milestones in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="font-semibold text-sm mb-1">Seamless Collaboration</h3>
                <p className="text-xs text-muted-foreground">Connect with friends, share materials, and collaborate on assignments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📚</span>
              <div>
                <h3 className="font-semibold text-sm mb-1">Rich Course Materials</h3>
                <p className="text-xs text-muted-foreground">Access videos, documents, and interactive learning resources anytime</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <h3 className="font-semibold text-sm mb-1">Personal Study Space</h3>
                <p className="text-xs text-muted-foreground">Organize your notes, plans, and study materials in your custom workspace</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-md border-border shadow-2xl backdrop-blur-sm bg-card/95 relative z-10 animate-fade-in">
        <CardHeader className="space-y-1 text-center relative">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-lg animate-scale-in hover:scale-110 transition-transform">
              <MessageSquare className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Start Learning
          </CardTitle>
          <CardDescription className="text-base">
            {userType === 'student' 
              ? '🎓 Sign in with your Google account' 
              : '⚡ Admin portal access'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={userType} onValueChange={(v) => setUserType(v as 'student' | 'admin')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="student" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80">
                Student
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-secondary/80">
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {userType === 'student' ? (
            // Students: Only Google sign-in
            <Button
              type="button"
              variant="outline"
              className="w-full hover:scale-105 transition-all hover:shadow-lg hover:border-primary group"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              {loading ? '✨ Connecting...' : 'Continue with Google'}
            </Button>
          ) : (
            // Admins: Only email/password
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  📧 Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  🔐 Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all hover:scale-105 hover:shadow-lg" 
                disabled={loading}
              >
                {loading ? '⚡ Please wait...' : '🚀 Sign In as Admin'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
