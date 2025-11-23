import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BookOpen, Users, FileText, TrendingUp, GraduationCap, Construction } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminHome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    activeEnrollments: 0,
  });
  const [semesterCompletionEnabled, setSemesterCompletionEnabled] = useState(false);
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(false);
  const [settingsId, setSettingsId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchSemesterSettings();
    }
  }, [user]);

  const fetchSemesterSettings = async () => {
    const { data } = await supabase
      .from('semester_settings')
      .select('*')
      .maybeSingle();
    
    if (data) {
      setSemesterCompletionEnabled(data.semester_completion_enabled);
      setMaintenanceModeEnabled(data.maintenance_mode_enabled);
      setSettingsId(data.id);
    }
  };

  const handleToggleSemesterCompletion = async (enabled: boolean) => {
    const { error } = await supabase
      .from('semester_settings')
      .update({ semester_completion_enabled: enabled })
      .eq('id', settingsId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } else {
      setSemesterCompletionEnabled(enabled);
      toast({
        title: 'Success',
        description: `Semester completion ${enabled ? 'enabled' : 'disabled'} for all students`,
      });
    }
  };

  const handleToggleMaintenanceMode = async (enabled: boolean) => {
    const { error } = await supabase
      .from('semester_settings')
      .update({ maintenance_mode_enabled: enabled })
      .eq('id', settingsId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update maintenance mode',
        variant: 'destructive',
      });
    } else {
      setMaintenanceModeEnabled(enabled);
      toast({
        title: 'Success',
        description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}. Students will ${enabled ? 'see maintenance page' : 'have normal access'}.`,
      });
    }
  };

  const fetchStats = async () => {
    const [courses, students, assignments, enrollments] = await Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('assignments').select('id', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalCourses: courses.count || 0,
      totalStudents: students.count || 0,
      totalAssignments: assignments.count || 0,
      activeEnrollments: enrollments.count || 0,
    });
  };

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: 'from-primary to-purple-600',
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: Users,
      gradient: 'from-accent to-rose-600',
    },
    {
      title: 'Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      gradient: 'from-warning to-orange-600',
    },
    {
      title: 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: TrendingUp,
      gradient: 'from-success to-emerald-600',
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your learning platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Semester Completion Control */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <Label htmlFor="semester-completion" className="text-base font-semibold cursor-pointer">
                  Enable Semester Completion
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow students to complete their semester and mark courses as completed
              </p>
            </div>
            <Switch
              id="semester-completion"
              checked={semesterCompletionEnabled}
              onCheckedChange={handleToggleSemesterCompletion}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode Control */}
      <Card className="border-0 shadow-lg border-l-4 border-l-warning">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-warning" />
                <Label htmlFor="maintenance-mode" className="text-base font-semibold cursor-pointer">
                  Enable Maintenance Mode
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, students will be redirected to a maintenance page after login
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceModeEnabled}
              onCheckedChange={handleToggleMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
