import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BookOpen, 
  MessageSquare, 
  LogOut, 
  GraduationCap,
  FileText,
  BarChart,
  Home,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { NavLink } from '@/components/NavLink';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const LMSDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/dashboard/courses', icon: BookOpen, label: 'My Courses' },
    { path: '/dashboard/assignments', icon: FileText, label: 'Assignments' },
    { path: '/dashboard/progress', icon: BarChart, label: 'Progress' },
    { path: '/dashboard/chat', icon: MessageSquare, label: "Let's Talk" },
    { path: '/dashboard/query', icon: HelpCircle, label: 'Query' },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-gradient-to-b from-card via-card to-primary/5">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EduHub
              </h1>
              <p className="text-xs text-muted-foreground">Learning Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Student'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.path} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 ease-out" />
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-300 hover:scale-105 z-10"
                  activeClassName="bg-gradient-primary text-white hover:text-white shadow-md scale-105"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </div>
            );
          })}
          
          {profile?.role === 'admin' && (
            <div className="pt-4 border-t border-border mt-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 ease-out" />
                <NavLink
                  to="/admin"
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all duration-300 hover:scale-105 z-10"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-medium">Admin Panel</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default LMSDashboard;
