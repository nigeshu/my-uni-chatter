import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, Search, Upload, Filter, Edit } from 'lucide-react';
import CourseDetailDialog from '@/components/CourseDetailDialog';
import ShareDocumentDialog from '@/components/ShareDocumentDialog';
import EnrollmentDialog from '@/components/EnrollmentDialog';
import EditEnrollmentDialog from '@/components/EditEnrollmentDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  enrollmentId?: string;
  enrollmentDays?: string[];
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
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [courseToEnroll, setCourseToEnroll] = useState<Course | null>(null);
  const [showEditEnrollDialog, setShowEditEnrollDialog] = useState(false);
  const [enrollmentToEdit, setEnrollmentToEdit] = useState<any>(null);

  // Get unique class days from enrollments
  const allClassDays = Array.from(
    new Set(
      courses.flatMap(course => course.enrollmentDays || [])
    )
  ).sort();

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
        .select(`
          id,
          course_id,
          completed_at,
          selected_slot_id,
          selected_lab_days,
          course_slots!enrollments_selected_slot_id_fkey (
            days
          )
        `)
        .eq('student_id', user?.id);

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
      const completedIds = new Set(
        enrollments?.filter(e => e.completed_at).map(e => e.course_id) || []
      );
      
      const coursesWithEnrollment = publishedCourses.map(course => {
        const enrollment = enrollments?.find(e => e.course_id === course.id);
        let enrollmentDays: string[] = [];
        
        if (enrollment && enrollment.course_slots) {
          enrollmentDays = (enrollment.course_slots as any).days || [];
        }
        
        return {
          ...course,
          isEnrolled: enrolledIds.has(course.id),
          isCompleted: completedIds.has(course.id),
          enrollmentId: enrollment?.id,
          enrollmentDays,
        };
      });

      setCourses(coursesWithEnrollment);
    }
  };

  const handleEnrollClick = (course: Course) => {
    setCourseToEnroll(course);
    setShowEnrollDialog(true);
  };

  const handleEditEnrollment = async (course: Course) => {
    if (!course.enrollmentId) return;

    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        selected_slot_id,
        selected_lab_days,
        course:courses (
          title,
          course_type
        )
      `)
      .eq('id', course.enrollmentId)
      .single();

    if (data) {
      setEnrollmentToEdit(data);
      setShowEditEnrollDialog(true);
    }
  };

  const filteredCourses = courses.filter(course => {
    // Search filter
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Day filter
    const matchesDay = filterDay === 'all' || 
      (course.enrollmentDays && course.enrollmentDays.includes(filterDay));
    
    // Type filter
    const matchesType = filterType === 'all' || 
      course.course_type?.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesDay && matchesType;
  });

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
      return 'from-[#60a5fa] via-[#3b82f6] to-[#4338ca]';
    } else if (courseType?.toLowerCase() === 'lab') {
      return 'from-[#4ade80] via-[#10b981] to-[#14b8a6]';
    }
    return 'from-primary via-[#a855f7] to-accent';
  };

  const getCourseTypeBadgeStyle = (courseType: string | null | undefined) => {
    if (courseType?.toLowerCase() === 'theory') {
      return 'border-[#60a5fa]/50 shadow-[#3b82f6]/20';
    } else if (courseType?.toLowerCase() === 'lab') {
      return 'border-[#4ade80]/50 shadow-[#10b981]/20';
    }
    return 'border-primary/30';
  };

  const getCourseTypeTextGradient = (courseType: string | null | undefined) => {
    if (courseType?.toLowerCase() === 'theory') {
      return 'from-[#2563eb] to-[#4338ca]';
    } else if (courseType?.toLowerCase() === 'lab') {
      return 'from-[#059669] to-[#0d9488]';
    }
    return 'from-primary to-accent';
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 sm:h-12"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-[150px] h-11 sm:h-12 bg-background z-50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Day" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-[100]">
              <SelectItem value="all">All Days</SelectItem>
              {allClassDays.map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] h-11 sm:h-12 bg-background z-50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-[100]">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="theory">Theory</SelectItem>
              <SelectItem value="lab">Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCourses.map((course) => (
          <Card 
            key={course.id}
            className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden cursor-pointer"
            onClick={() => {
              if (course.isEnrolled) {
                if (course.course_type?.toLowerCase() === 'lab') {
                  toast({
                    title: 'No Materials Available',
                    description: 'No Materials Available For Labs',
                    variant: 'destructive',
                  });
                } else {
                  navigate(`/dashboard/courses/${course.id}/materials`);
                }
              } else {
                setSelectedCourse(course);
                setShowDetailDialog(true);
              }
            }}
          >
            <div className={`h-48 bg-gradient-to-br ${getCourseTypeGradient(course.course_type)} relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 group-hover:from-black/30 transition-colors" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {course.course_type && (
                  <div className={`px-4 py-2 bg-background/95 backdrop-blur-md rounded-lg border-2 ${getCourseTypeBadgeStyle(course.course_type)} shadow-lg`}>
                    <span className={`text-lg font-bold uppercase tracking-wide bg-gradient-to-r ${getCourseTypeTextGradient(course.course_type)} bg-clip-text text-transparent`}>
                      {course.course_type}
                    </span>
                  </div>
                )}
                {/* Credits Circle Badge */}
                {course.credits && (
                  <div className="w-12 h-12 rounded-full bg-background/95 backdrop-blur-md border-2 border-primary/30 shadow-lg flex items-center justify-center">
                    <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {course.credits}C
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4">
                <Badge className={getDifficultyColor(course.difficulty || 'beginner')}>
                  {course.difficulty || 'Beginner'}
                </Badge>
              </div>
              
              {/* Class Days - Bottom Right */}
              {course.enrollmentDays && course.enrollmentDays.length > 0 && (
                <div className="absolute bottom-4 right-4 flex gap-1.5">
                  {course.enrollmentDays.map((day, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-background/95 backdrop-blur-md rounded-full border border-primary/20 shadow-md"
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.isCompleted ? 'Completed' : 'Click to view materials'}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEnrollment(course);
                    }}
                    title="Edit slot/days"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnrollClick(course);
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

      {/* Enrollment Dialog */}
      <EnrollmentDialog
        course={courseToEnroll}
        open={showEnrollDialog}
        onOpenChange={setShowEnrollDialog}
        onSuccess={fetchCourses}
        userId={user?.id || ''}
      />

      {/* Edit Enrollment Dialog */}
      <EditEnrollmentDialog
        enrollment={enrollmentToEdit}
        open={showEditEnrollDialog}
        onOpenChange={setShowEditEnrollDialog}
        onSuccess={fetchCourses}
      />
    </div>
  );
};

export default Courses;
