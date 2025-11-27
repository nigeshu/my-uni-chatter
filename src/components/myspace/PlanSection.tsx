import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface StudyPlan {
  id: string;
  subject: string;
  start_date: string;
  end_date: string;
}

export const PlanSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('student_id', user?.id)
      .order('start_date', { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
  };

  const createPlan = async () => {
    if (!subject.trim() || !startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: 'Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('study_plans').insert({
      student_id: user?.id,
      subject: subject.trim(),
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create plan',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Plan created successfully',
    });

    setNewPlanOpen(false);
    setSubject('');
    setStartDate(undefined);
    setEndDate(undefined);
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('study_plans').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Plan deleted successfully',
    });

    fetchPlans();
  };

  const calculateTotalDays = (startDate: string, endDate: string) => {
    return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  };

  const calculateRemainingDays = (endDate: string) => {
    const remaining = differenceInDays(new Date(endDate), new Date()) + 1;
    return remaining < 0 ? 0 : remaining;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Study Plans</h2>
        <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject name..."
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={createPlan} className="w-full">
                Create Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Total Days</TableHead>
              <TableHead>Remaining Days</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No plans yet. Create your first study plan!
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.subject}</TableCell>
                  <TableCell>{format(new Date(plan.start_date), 'PP')}</TableCell>
                  <TableCell>{format(new Date(plan.end_date), 'PP')}</TableCell>
                  <TableCell>
                    {calculateTotalDays(plan.start_date, plan.end_date)} days
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold',
                        calculateRemainingDays(plan.end_date) === 0 && 'text-destructive'
                      )}
                    >
                      {calculateRemainingDays(plan.end_date)} days
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-destructive"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
