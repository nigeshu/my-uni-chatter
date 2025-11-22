import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number | null;
  course: {
    title: string;
  };
}

interface AssignmentDetailDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignmentDetailDialog = ({ assignment, open, onOpenChange }: AssignmentDetailDialogProps) => {
  if (!assignment) return null;

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(assignment.due_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Course Info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="font-semibold">{assignment.course.title}</span>
          </div>

          {/* Due Date */}
          {assignment.due_date && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Due: {format(new Date(assignment.due_date), 'PPP')}
                </span>
              </div>
              {daysUntilDue !== null && (
                <Badge
                  variant={
                    daysUntilDue < 0
                      ? 'destructive'
                      : daysUntilDue <= 2
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {daysUntilDue < 0
                    ? `${Math.abs(daysUntilDue)} days overdue`
                    : daysUntilDue === 0
                    ? 'Due today'
                    : `${daysUntilDue} days left`}
                </Badge>
              )}
            </div>
          )}

          {/* Max Points */}
          {assignment.max_points && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Max Points: {assignment.max_points}</span>
            </div>
          )}

          {/* Description */}
          {assignment.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailDialog;
