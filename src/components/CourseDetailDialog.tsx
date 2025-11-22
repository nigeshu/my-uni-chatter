import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Calendar, Award } from 'lucide-react';

interface CourseDetailDialogProps {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration_hours: number;
    credits?: number;
    class_days?: string[];
    instructor?: {
      full_name: string;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CourseDetailDialog = ({ course, open, onOpenChange }: CourseDetailDialogProps) => {
  if (!course) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mb-2">
            <DialogTitle className="text-2xl flex-1">{course.title}</DialogTitle>
            <Badge className={getDifficultyColor(course.difficulty)}>
              {course.difficulty}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Description
            </h3>
            <p className="text-muted-foreground">
              {course.description || 'No description available'}
            </p>
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Duration</h4>
              </div>
              <p className="text-2xl font-bold">{course.duration_hours} hours</p>
            </div>

            {/* Credits */}
            {course.credits !== undefined && course.credits !== null && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Credits</h4>
                </div>
                <p className="text-2xl font-bold">{course.credits}</p>
              </div>
            )}
          </div>

          {/* Class Days */}
          {course.class_days && course.class_days.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Class Days
              </h3>
              <div className="flex flex-wrap gap-2">
                {course.class_days.map((day, index) => (
                  <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instructor */}
          {course.instructor?.full_name && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Instructor: <span className="font-semibold text-foreground">{course.instructor.full_name}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailDialog;
