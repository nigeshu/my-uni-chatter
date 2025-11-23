import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  serial_no: string;
  topic: string;
  order_index: number;
}

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
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    if (course?.id && open) {
      fetchModules();
    }
  }, [course?.id, open]);

  const fetchModules = async () => {
    if (!course?.id) return;
    
    const { data } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', course.id)
      .order('order_index');
    
    if (data) setModules(data);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {course.title} - Course Modules
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-gradient-accent flex items-center justify-center">
                          <span className="font-bold text-white text-lg">{module.serial_no}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground leading-relaxed">{module.topic}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <List className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">No modules added yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailDialog;
