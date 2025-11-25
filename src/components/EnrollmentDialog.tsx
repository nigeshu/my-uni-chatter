import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Slot {
  id: string;
  slot_name: string;
  days: string[];
}

interface EnrollmentDialogProps {
  course: {
    id: string;
    title: string;
    course_type?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const EnrollmentDialog = ({ course, open, onOpenChange, onSuccess, userId }: EnrollmentDialogProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedLabDays, setSelectedLabDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && course?.id && course.course_type?.toLowerCase() === 'theory') {
      fetchSlots();
    }
  }, [open, course]);

  const fetchSlots = async () => {
    if (!course?.id) return;

    const { data } = await supabase
      .from('course_slots')
      .select('*')
      .eq('course_id', course.id)
      .order('created_at');

    if (data) setSlots(data);
  };

  const handleEnroll = async () => {
    if (!course) return;

    const isTheory = course.course_type?.toLowerCase() === 'theory';
    const isLab = course.course_type?.toLowerCase() === 'lab';

    if (isTheory && !selectedSlotId) {
      toast({
        title: 'Error',
        description: 'Please select a slot',
        variant: 'destructive',
      });
      return;
    }

    if (isLab && selectedLabDays.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one lab day',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('enrollments').insert({
      student_id: userId,
      course_id: course.id,
      selected_slot_id: isTheory ? selectedSlotId : null,
      selected_lab_days: isLab ? selectedLabDays : null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to enroll in course',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'You have been enrolled in the course',
      });
      setSelectedSlotId('');
      setSelectedLabDays([]);
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  const toggleLabDay = (day: string) => {
    setSelectedLabDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const isTheory = course?.course_type?.toLowerCase() === 'theory';
  const isLab = course?.course_type?.toLowerCase() === 'lab';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll in {course?.title}</DialogTitle>
          <DialogDescription>
            {isTheory && 'Please select a slot for this theory course'}
            {isLab && 'Please select the days you have lab classes'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isTheory && (
            <>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No slots available. Please contact admin.
                </p>
              ) : (
                <RadioGroup value={selectedSlotId} onValueChange={setSelectedSlotId}>
                  <div className="space-y-3">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={slot.id} id={slot.id} />
                        <Label htmlFor={slot.id} className="flex-1 cursor-pointer">
                          <div className="space-y-1">
                            <p className="font-semibold">{slot.slot_name}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {slot.days.map((day, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </>
          )}

          {isLab && (
            <div className="space-y-3">
              <Label>Select Lab Days</Label>
              <div className="space-y-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`lab-${day}`}
                      checked={selectedLabDays.includes(day)}
                      onCheckedChange={() => toggleLabDay(day)}
                    />
                    <Label htmlFor={`lab-${day}`} className="cursor-pointer flex-1">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleEnroll}
            disabled={loading || (isTheory && !selectedSlotId) || (isLab && selectedLabDays.length === 0)}
            className="flex-1"
          >
            {loading ? 'Enrolling...' : 'Enroll'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentDialog;
