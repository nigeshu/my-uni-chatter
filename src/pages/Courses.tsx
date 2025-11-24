import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, Search, Upload } from 'lucide-react';
import CourseDetailDialog from '@/components/CourseDetailDialog';
import ShareDocumentDialog from '@/components/ShareDocumentDialog';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration_hours: number;
  credits?: number;
  class_days?: string[];
  thumbnail_url: string | null;
  course_type?: string | null;
  instructor: {
    full_name: string;
  };
  isEnrolled?: boolean;
  isCompleted?: boolean;
}

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    const { data: publishedCourses } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name)
      `)
      .eq('is_published', true);

    if (publishedCourses) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, completed_at')
        .eq('student_id', user?.id);

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
      const completedIds = new Set(
        enrollments?.filter(e => e.completed_at).map(e => e.course_id) || []
      );
      
      const coursesWithEnrollment = publishedCourses.map(course => ({
        ...course,
        isEnrolled: enrolledIds.has(course.id),
        isCompleted: completedIds.has(course.id),
      }));

      setCourses(coursesWithEnrollment);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: user?.id,
        course_id: courseId,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to enroll in course.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'You have been enrolled in the course.',
      });
      fetchCourses();
    }
    setLoading(false);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success/10 text-success border-success/20';
      case 'intermediate':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'advanced':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCourseTypeGradient = (courseType: string | null | undefined) => {
    if (courseType?.toLowerCase() === 'theory') {
      return 'from-blue-400 via-blue-600 to-indigo-700';
    } else if (courseType?.toLowerCase() === 'lab') {
      return 'from-green-400 via-emerald-600 to-teal-700';
    }
    return 'from-primary via-purple-500 to-accent';
  };

  const getCourseTypeBadgeStyle = (courseType: string | null | undefined) => {
    if (courseType?.toLowerCase() === 'theory') {
      return 'border-blue-400/50 shadow-blue-500/20';
    } else if (courseType?.toLowerCase() === 'lab') {
      return 'border-green-400/50 shadow-green-500/20';
    }
    return 'border-primary/30';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Explore Courses
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Discover and enroll in amazing courses
          </p>
        </div>
        <Button onClick={() => setShowShareDialog(true)} className="gap-2 w-full sm:w-auto">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Provide Course Material</span>
          <span className="sm:hidden">Share Material</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 sm:h-12"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCourses.map((course) => (
          <Card 
            key={course.id}
            className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden cursor-pointer"
            onClick={() => {
              if (course.isEnrolled) {
                navigate(`/dashboard/courses/${course.id}/materials`);
              } else {
                setSelectedCourse(course);
                setShowDetailDialog(true);
              }
            }}
          >
            <div className={`h-48 bg-gradient-to-br ${getCourseTypeGradient(course.course_type)} relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 group-hover:from-black/30 transition-colors" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute top-4 left-4">
                {course.course_type && (
                  <div className={`px-4 py-2 bg-background/95 backdrop-blur-md rounded-lg border-2 ${getCourseTypeBadgeStyle(course.course_type)} shadow-lg`}>
                    <span className={`text-lg font-bold uppercase tracking-wide ${
                      course.course_type.toLowerCase() === 'theory' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                        : course.course_type.toLowerCase() === 'lab'
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
                    }`}>
                      {course.course_type}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4">
                <Badge className={getDifficultyColor(course.difficulty || 'beginner')}>
                  {course.difficulty || 'Beginner'}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || 'No description available'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.credits || 0} Credits</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{course.instructor?.full_name || 'Instructor'}</span>
                </div>
              </div>

              {course.isEnrolled ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.isCompleted ? 'Completed' : 'Click to view materials'}</span>
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnroll(course.id);
                  }}
                  disabled={loading}
                >
                  Enroll Now
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Check back later for new courses'}
          </p>
        </div>
      )}

      {/* Course Detail Dialog */}
      <CourseDetailDialog 
        course={selectedCourse}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Share Document Dialog */}
      <ShareDocumentDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
};

export default Courses;
