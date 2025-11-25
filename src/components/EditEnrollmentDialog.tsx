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

interface EditEnrollmentDialogProps {
  enrollment: {
    id: string;
    course_id: string;
    selected_slot_id?: string | null;
    selected_lab_days?: string[] | null;
    course: {
      title: string;
      course_type?: string | null;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const EditEnrollmentDialog = ({ enrollment, open, onOpenChange, onSuccess }: EditEnrollmentDialogProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedLabDays, setSelectedLabDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && enrollment) {
      fetchSlots();
      setSelectedSlotId(enrollment.selected_slot_id || '');
    }
  }, [open, enrollment]);

  const fetchSlots = async () => {
    if (!enrollment?.course_id) return;

    const { data } = await supabase
      .from('course_slots')
      .select('*')
      .eq('course_id', enrollment.course_id)
      .order('created_at');

    if (data) setSlots(data);
  };

  const handleSave = async () => {
    if (!enrollment) return;

    if (!selectedSlotId) {
      toast({
        title: 'Error',
        description: 'Please select a slot',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('enrollments')
      .update({
        selected_slot_id: selectedSlotId,
        selected_lab_days: null,
      })
      .eq('id', enrollment.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update enrollment',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Enrollment updated successfully',
      });
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Enrollment - {enrollment?.course.title}</DialogTitle>
          <DialogDescription>
            Update your slot selection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No slots available
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
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={loading || !selectedSlotId}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
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

export default EditEnrollmentDialog;
