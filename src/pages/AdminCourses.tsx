import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Settings } from 'lucide-react';
import SlotManagementDialog from '@/components/SlotManagementDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  is_published: boolean;
  instructor_id: string;
}

const AdminCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [selectedCourseForSlots, setSelectedCourseForSlots] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    duration_hours: 10,
    credits: 3,
    course_type: 'theory' as 'theory' | 'lab',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setCourses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);

        if (error) throw error;

        toast({
          title: 'Success!',
          description: 'Course updated successfully.',
        });
      } else {
        const { error } = await supabase.from('courses').insert({
          ...formData,
          instructor_id: user?.id,
        });

        if (error) throw error;

        toast({
          title: 'Success!',
          description: 'Course created successfully.',
        });
      }

      setShowDialog(false);
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        difficulty: 'beginner',
        duration_hours: 10,
        credits: 3,
        course_type: 'theory',
      });
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save course.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      difficulty: course.difficulty || 'beginner',
      duration_hours: course.duration_hours || 10,
      credits: course.credits || 3,
      course_type: (course as any).course_type || 'theory',
    });
    setShowDialog(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    const { error } = await supabase.from('courses').delete().eq('id', courseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Course deleted successfully.',
      });
      fetchCourses();
    }
  };

  const togglePublish = async (course: Course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !course.is_published })
      .eq('id', course.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update course status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Course ${!course.is_published ? 'published' : 'unpublished'} successfully.`,
      });
      fetchCourses();
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Manage Courses
          </h1>
          <p className="text-muted-foreground text-lg">Create and manage your courses</p>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-accent hover:opacity-90"
              onClick={() => {
                setEditingCourse(null);
                setFormData({
                  title: '',
                  description: '',
                  difficulty: 'beginner',
                  duration_hours: 10,
                  credits: 3,
                  course_type: 'theory',
                });
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse
                  ? 'Update the course information below.'
                  : 'Fill in the details to create a new course.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="Introduction to Programming"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_hours: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Course Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.credits}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      // Only allow whole numbers and .5 increments
                      if (!isNaN(value) && (value % 0.5 === 0)) {
                        setFormData({ ...formData, credits: value });
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      // Round to nearest 0.5 on blur if invalid
                      if (isNaN(value) || value < 0.5) {
                        setFormData({ ...formData, credits: 0.5 });
                      } else if (value % 0.5 !== 0) {
                        setFormData({ ...formData, credits: Math.round(value * 2) / 2 });
                      }
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_type">Course Type</Label>
                  <Select
                    value={formData.course_type}
                    onValueChange={(value: 'theory' | 'lab') => setFormData({ ...formData, course_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">Theory</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-accent hover:opacity-90">
                  {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card 
            key={course.id} 
            className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg cursor-pointer"
            onClick={() => navigate(`/admin/courses/${course.id}/materials`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                <Badge variant={course.is_published ? 'default' : 'secondary'}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-accent transition-colors">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {course.description || 'No description'}
              </p>
              <p className="text-sm text-muted-foreground">
                Duration: {course.duration_hours} hours
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePublish(course);
                  }}
                  className="flex-1"
                >
                  {course.is_published ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Publish
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourseForSlots(course.id);
                    setShowSlotDialog(true);
                  }}
                  title="Manage Slots"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(course);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(course.id);
                  }}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-16">
          <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4">
            <Plus className="h-20 w-20 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first course to get started
          </p>
        </div>
      )}

      {/* Slot Management Dialog */}
      {selectedCourseForSlots && (
        <SlotManagementDialog
          courseId={selectedCourseForSlots}
          open={showSlotDialog}
          onOpenChange={setShowSlotDialog}
        />
      )}
    </div>
  );
};

export default AdminCourses;
