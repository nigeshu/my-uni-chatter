import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BookOpen, 
  LogOut, 
  GraduationCap,
  Users,
  BarChart,
  Home,
  Settings,
  Shield,
  Edit2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
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

    if (data) {
      if (data.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }
      setProfile(data);
    }
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
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/courses', icon: BookOpen, label: 'Manage Courses' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/analytics', icon: BarChart, label: 'Analytics' },
    { path: '/admin/control-center', icon: Shield, label: 'Control Center' },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-gradient-to-b from-card via-card to-accent/5">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-accent rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground">EduHub LMS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Avatar className="h-10 w-10 border-2 border-accent/20">
              <AvatarFallback className="bg-gradient-accent text-white font-semibold">
                {profile?.full_name?.[0] || profile?.email?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate text-sm">{profile?.full_name || 'Admin'}</p>
                <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-accent/10"
                      onClick={handleEditName}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
              <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/5 hover:text-accent transition-all duration-200"
                activeClassName="bg-gradient-accent text-white hover:text-white shadow-md"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
          
          <div className="pt-4 border-t border-border mt-4">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200"
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Student View</span>
            </NavLink>
          </div>
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

export default AdminDashboard;
