import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { MessageSquare, Users, Shield, BookOpen, Award, TrendingUp } from 'lucide-react';
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

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Courses',
      description: 'Learn with engaging video lessons and hands-on exercises',
      gradient: 'from-primary to-purple-600',
    },
    {
      icon: Award,
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed analytics',
      gradient: 'from-success to-emerald-600',
    },
    {
      icon: MessageSquare,
      title: "Let's Talk",
      description: 'Connect with classmates through real-time messaging',
      gradient: 'from-accent to-rose-600',
    },
    {
      icon: TrendingUp,
      title: 'Assignments & Quizzes',
      description: 'Test your knowledge with interactive assessments',
      gradient: 'from-warning to-orange-600',
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Study together with friends and build your network',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security',
      gradient: 'from-indigo-500 to-violet-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-block p-4 bg-gradient-primary rounded-2xl shadow-2xl mb-6 animate-scale-in">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                EduHub
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-foreground/80">
                Learning Management System
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Transform your learning experience with our comprehensive platform featuring
              interactive courses, real-time collaboration, and powerful progress tracking.
            </p>

            <div className="flex justify-center pt-8">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="min-w-[200px] text-lg h-14 bg-gradient-primary hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for an exceptional learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-card border border-border rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 bg-gradient-to-br from-primary/10 via-purple-500/10 to-accent/10 rounded-3xl border border-primary/20 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering students to achieve their academic goals
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="min-w-[250px] text-lg h-14 bg-gradient-primary hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
