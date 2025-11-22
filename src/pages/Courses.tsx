import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Search, TrendingUp } from 'lucide-react';
import CourseDetailDialog from '@/components/CourseDetailDialog';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration_hours: number;
  credits?: number;
  class_days?: string[];
  thumbnail_url: string | null;
  instructor: {
    full_name: string;
  };
  isEnrolled?: boolean;
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
        .select('course_id')
        .eq('student_id', user?.id);

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
      
      const coursesWithEnrollment = publishedCourses.map(course => ({
        ...course,
        isEnrolled: enrolledIds.has(course.id),
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

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Explore Courses
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover and enroll in amazing courses
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="h-48 bg-gradient-to-br from-primary via-purple-500 to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
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
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{course.instructor?.full_name || 'Instructor'}</span>
                </div>
              </div>

              {course.isEnrolled ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Click to view materials</span>
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
    </div>
  );
};

export default Courses;
