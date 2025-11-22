import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Clock, GraduationCap, ArrowRight, Edit2, BookMarked } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Stats {
  enrolledCourses: number;
  cgpa: number;
  totalCreditsEarned: number;
  totalCreditsEnrolled: number;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    enrolledCourses: 0,
    cgpa: 0,
    totalCreditsEarned: 0,
    totalCreditsEnrolled: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [semesterText, setSemesterText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newSemesterText, setNewSemesterText] = useState('');

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentCourses();
      fetchSemesterInfo();
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchSemesterInfo = async () => {
    const { data } = await supabase
      .from('semester_info')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (data) {
      setSemesterText(data.semester_text);
    }
  };

  const handleUpdateSemester = async () => {
    if (!newSemesterText.trim()) return;

    const { error } = await supabase
      .from('semester_info')
      .update({ semester_text: newSemesterText })
      .eq('is_active', true);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update semester text.',
        variant: 'destructive',
      });
    } else {
      setSemesterText(newSemesterText);
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Semester text updated successfully.',
      });
    }
  };

  const fetchStats = async () => {
    // Fetch enrollments with course credits
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, course:courses(credits)')
      .eq('student_id', user?.id);

    // Fetch CGPA data
    const { data: semesters } = await supabase
      .from('cgpa_semesters')
      .select('credits, gpa')
      .eq('student_id', user?.id);

    let cgpa = 0;
    if (semesters && semesters.length > 0) {
      const totalCredits = semesters.reduce((sum, sem) => sum + sem.credits, 0);
      const weightedSum = semesters.reduce((sum, sem) => sum + sem.credits * sem.gpa, 0);
      cgpa = totalCredits > 0 ? weightedSum / totalCredits : 0;
    }

    // Calculate total credits
    let totalCreditsEnrolled = 0;
    let totalCreditsEarned = 0;
    
    if (enrollments) {
      totalCreditsEnrolled = enrollments.reduce((sum, e: any) => {
        return sum + (e.course?.credits || 0);
      }, 0);
      
      // For credits earned, count completed courses
      totalCreditsEarned = enrollments
        .filter((e: any) => e.completed_at)
        .reduce((sum, e: any) => sum + (e.course?.credits || 0), 0);
    }

    setStats({
      enrolledCourses: enrollments?.length || 0,
      cgpa: cgpa,
      totalCreditsEarned,
      totalCreditsEnrolled,
    });
  };

  const fetchRecentCourses = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('student_id', user?.id)
      .order('enrolled_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentCourses(data);
    }
  };

  const statCards = [
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      gradient: 'from-primary to-purple-600',
    },
    {
      title: 'Your CGPA',
      value: stats.cgpa.toFixed(2),
      icon: GraduationCap,
      gradient: 'from-success to-emerald-600',
    },
    {
      title: 'Credits Earned',
      value: stats.totalCreditsEarned,
      icon: Award,
      gradient: 'from-accent to-rose-600',
    },
    {
      title: 'Credits Enrolled',
      value: stats.totalCreditsEnrolled,
      icon: BookMarked,
      gradient: 'from-warning to-orange-600',
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Welcome Back! 👋
          </h1>
          {semesterText && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <span className="text-lg font-semibold bg-gradient-to-r from-primary via-accent to-purple-500 bg-clip-text text-transparent">
                {semesterText}
              </span>
              {isAdmin && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setNewSemesterText(semesterText)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Semester Text</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Semester Text</Label>
                        <Input
                          value={newSemesterText}
                          onChange={(e) => setNewSemesterText(e.target.value)}
                          placeholder="For Winter Semester 2025 - 2026"
                        />
                      </div>
                      <Button onClick={handleUpdateSemester} className="w-full">
                        Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Continue your learning journey
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Continue Learning</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/courses')}
            className="text-primary hover:text-primary"
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {recentCourses.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your learning journey by enrolling in a course
              </p>
              <Button 
                onClick={() => navigate('/dashboard/courses')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCourses.map((enrollment) => (
              <Card 
                key={enrollment.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg overflow-hidden"
                onClick={() => {
                  if (enrollment.course?.id) {
                    navigate(`/dashboard/course-materials/${enrollment.course.id}`);
                  }
                }}
              >
                <div className="h-48 bg-gradient-to-br from-primary via-purple-500 to-accent relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl line-clamp-2">
                      {enrollment.course.title}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {enrollment.course.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credits</span>
                    <span className="font-bold text-xl text-primary">{enrollment.course.credits || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
