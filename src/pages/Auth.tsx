import { useState } from 'react';
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (userType === 'admin') {
          toast({
            title: 'Error',
            description: 'Admin signup is not allowed. Please contact system administrator.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role: userType,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Success!',
          description: 'Account created successfully. Please log in.',
        });
        setAuthMode('login');
      } else {
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

        if (profile?.role !== userType) {
          await supabase.auth.signOut();
          toast({
            title: 'Error',
            description: `This account is not registered as a ${userType}.`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        toast({
          title: 'Welcome!',
          description: 'Successfully logged in.',
        });

        navigate(userType === 'admin' ? '/admin' : '/dashboard');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <MessageSquare className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Let's Talk</CardTitle>
          <CardDescription>Connect and chat with friends securely</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={userType} onValueChange={(v) => setUserType(v as 'student' | 'admin')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>

            {userType === 'student' && (
              <div className="text-center text-sm">
                {authMode === 'login' ? (
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
