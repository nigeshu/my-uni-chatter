import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  enrolledCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  averageProgress: number;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    enrolledCourses: 0,
    completedCourses: 0,
    pendingAssignments: 0,
    averageProgress: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentCourses();
    }
  }, [user]);

  const fetchStats = async () => {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('progress, completed_at')
      .eq('student_id', user?.id);

    if (enrollments) {
      const completed = enrollments.filter(e => e.completed_at).length;
      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0;

      setStats({
        enrolledCourses: enrollments.length,
        completedCourses: completed,
        pendingAssignments: 0,
        averageProgress: Math.round(avgProgress),
      });
    }
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
      title: 'Completed',
      value: stats.completedCourses,
      icon: Award,
      gradient: 'from-success to-emerald-600',
    },
    {
      title: 'Average Progress',
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      gradient: 'from-accent to-rose-600',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingAssignments,
      icon: Clock,
      gradient: 'from-warning to-orange-600',
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
          Welcome Back! 👋
        </h1>
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
                onClick={() => navigate(`/dashboard/courses/${enrollment.course.id}`)}
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-primary">{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
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
