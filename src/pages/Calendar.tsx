import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/supabase';
import { format, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Calendar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dates, setDates] = useState<Date[]>([]);
  const [dayStatuses, setDayStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (dates.length > 0) {
      fetchDayStatuses();
    }
  }, [dates]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    setIsAdmin(data?.role === 'admin');
  };

  const fetchDayStatuses = async () => {
    const dateStrings = dates.map(date => format(date, 'yyyy-MM-dd'));
    const { data } = await supabase
      .from('day_status')
      .select('date, is_holiday')
      .in('date', dateStrings);

    const statusMap: Record<string, boolean> = {};
    data?.forEach(({ date, is_holiday }) => {
      statusMap[date] = is_holiday;
    });
    setDayStatuses(statusMap);
  };

  const generateCalendar = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    setDates(interval);
    toast.success('Calendar generated successfully');
  };

  const toggleDayStatus = async (date: Date) => {
    if (!isAdmin) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentStatus = dayStatuses[dateStr] || false;
    const newStatus = !currentStatus;

    // Optimistic update
    setDayStatuses(prev => ({ ...prev, [dateStr]: newStatus }));

    const { error } = await supabase
      .from('day_status')
      .upsert({
        date: dateStr,
        is_holiday: newStatus,
      }, {
        onConflict: 'date'
      });

    if (error) {
      toast.error('Failed to update day status');
      setDayStatuses(prev => ({ ...prev, [dateStr]: currentStatus }));
    }
  };

  const getDayClassName = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isHoliday = dayStatuses[dateStr] || false;
    
    return cn(
      'p-6 rounded-xl transition-all duration-300 border-2',
      isHoliday 
        ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50' 
        : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50',
      isAdmin && 'cursor-pointer hover:scale-105 hover:shadow-xl'
    );
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Calendar Management
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Select date range and manage working days' : 'View working days and holidays'}
        </p>
      </div>

      {isAdmin && (
        <Card className="p-6 border-0 shadow-xl">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generate Calendar</h2>
            
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
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
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                onClick={generateCalendar}
                className="bg-gradient-primary hover:opacity-90"
              >
                Generate Calendar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {dates.length > 0 ? (
        <Card className="p-6 border-0 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {format(dates[0], 'MMMM yyyy')} - {format(dates[dates.length - 1], 'MMMM yyyy')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Click to toggle: Green = Holiday, Red = Working Day' : 'Green = Holiday, Red = Working Day'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {dates.map((date) => (
              <div
                key={date.toISOString()}
                onClick={() => toggleDayStatus(date)}
                className={getDayClassName(date)}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div className="text-3xl font-bold">
                    {format(date, 'd')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(date, 'MMM yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-12 border-0 shadow-xl">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>{isAdmin ? 'Select dates and click Generate Calendar to get started' : 'No calendar data available'}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
