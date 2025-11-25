import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BookOpen, 
  MessageSquare, 
  LogOut, 
  GraduationCap,
  FileText,
  BarChart,
  Home,
  Shield,
  HelpCircle,
  Edit2,
  Sparkles,
  BookMarked,
  Menu,
  CalendarDays
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NavLink } from '@/components/NavLink';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

const nameSchema = z.object({
  full_name: z.string().trim().min(1, "Name cannot be empty").max(100, "Name must be less than 100 characters"),
});

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchProfile();
      fetchUnreadCount();
      subscribeToMessages();
      checkMaintenanceMode();
      subscribeToMaintenanceChanges();
    }
  }, [user, loading, navigate]);

  const checkMaintenanceMode = async () => {
    // Check if user is admin first
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();
    
    // Admins can bypass maintenance mode
    if (profileData?.role === 'admin') {
      return;
    }
    
    const { data } = await supabase
      .from('semester_settings')
      .select('maintenance_mode_enabled')
      .maybeSingle();
    
    if (data?.maintenance_mode_enabled) {
      navigate('/maintenance', { replace: true });
    }
  };

  const subscribeToMaintenanceChanges = () => {
    const channel = supabase
      .channel('maintenance-mode')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'semester_settings',
        },
        async (payload: any) => {
          if (payload.new.maintenance_mode_enabled) {
            // Check if user is admin
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user?.id)
              .single();
            
            // Only redirect students, not admins
            if (profileData?.role !== 'admin') {
              navigate('/maintenance', { replace: true });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleEditName = () => {
    setNewName(profile?.full_name || '');
    setNameError('');
    setEditNameOpen(true);
  };

  const handleSaveName = async () => {
    try {
      const validation = nameSchema.safeParse({ full_name: newName });
      
      if (!validation.success) {
        setNameError(validation.error.errors[0].message);
        return;
      }

      // Check if name already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', newName.trim())
        .neq('id', user?.id)
        .maybeSingle();

      if (existingProfile) {
        setNameError('This name is already taken. Please choose a different name.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: newName.trim() } : null);
      setEditNameOpen(false);
      toast({
        title: 'Success',
        description: 'Name updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update name.',
        variant: 'destructive',
      });
    }
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
    { path: '/dashboard/myspace', icon: Sparkles, label: 'My Space' },
    { path: '/dashboard/exams', icon: BookMarked, label: 'Exams' },
    { path: '/dashboard/query', icon: HelpCircle, label: 'Query' },
    { path: '/dashboard/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/dashboard/chat', icon: MessageSquare, label: "Let's Talk" },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Lernet
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
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate text-sm">{profile?.full_name || 'User'}</p>
              <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={handleEditName}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Name</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          setNameError('');
                        }}
                        placeholder="Enter your name"
                        maxLength={100}
                      />
                      {nameError && (
                        <p className="text-sm text-destructive">{nameError}</p>
                      )}
                    </div>
                    <Button onClick={handleSaveName} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Student'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLetsTalk = item.path === '/dashboard/chat';
          const showBadge = isLetsTalk && unreadCount > 0;
          
          return (
            <div key={item.path} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 ease-in-out transform group-hover:scale-110" />
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg z-10 backdrop-blur-sm"
                activeClassName="bg-gradient-primary text-white hover:text-white shadow-xl scale-105 border border-primary/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-500 group-hover:rotate-12" />
                <span className="font-medium transition-all duration-500">{item.label}</span>
                {showBadge && (
                  <Badge 
                    className="ml-auto bg-red-500 text-white hover:bg-red-600 animate-pulse"
                    variant="default"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </NavLink>
            </div>
          );
        })}
        
        {profile?.role === 'admin' && (
          <div className="pt-4 border-t border-border mt-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 ease-in-out transform group-hover:scale-110" />
              <NavLink
                to="/admin"
                className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg z-10 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <GraduationCap className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
                <span className="font-medium transition-all duration-500">Admin Panel</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/40 to-destructive/0 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 ease-in-out transform group-hover:scale-110" />
          <Button 
            variant="ghost" 
            className="relative w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-500 ease-in-out hover:scale-105 rounded-xl z-10 backdrop-blur-sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3 transition-transform duration-500 group-hover:rotate-12" />
            <span className="transition-all duration-500">Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 border-r border-border flex-col bg-gradient-to-b from-card via-card to-primary/5">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="h-full flex flex-col bg-gradient-to-b from-card via-card to-primary/5">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-primary rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">Lernet</h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default LMSDashboard;
