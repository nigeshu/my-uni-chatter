import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Slot {
  id: string;
  slot_name: string;
  days: string[];
}

interface SlotManagementDialogProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SlotManagementDialog = ({ courseId, open, onOpenChange }: SlotManagementDialogProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotName, setSlotName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      fetchSlots();
    }
  }, [open, courseId]);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('course_slots')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at');

    if (data) setSlots(data);
  };

  const handleAddSlot = async () => {
    if (!slotName.trim() || selectedDays.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter slot name and select at least one day',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('course_slots').insert({
      course_id: courseId,
      slot_name: slotName.trim(),
      days: selectedDays,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add slot',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Slot added successfully',
      });
      setSlotName('');
      setSelectedDays([]);
      fetchSlots();
    }
    setLoading(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from('course_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete slot',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Slot deleted successfully',
      });
      fetchSlots();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Course Slots</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Slot */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold">Add New Slot</h3>
            
            <div className="space-y-2">
              <Label htmlFor="slot_name">Slot Name</Label>
              <Input
                id="slot_name"
                placeholder="e.g., Slot A, Morning Batch, etc."
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <Checkbox
                      id={day}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <label htmlFor={day} className="text-sm cursor-pointer">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddSlot}
              disabled={loading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>

          {/* Existing Slots */}
          <div className="space-y-3">
            <h3 className="font-semibold">Existing Slots</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No slots added yet
              </p>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <p className="font-semibold">{slot.slot_name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {slot.days.map((day, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlotManagementDialog;
