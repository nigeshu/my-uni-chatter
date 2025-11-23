import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const Calendar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dayStatuses, setDayStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    fetchDayStatuses();
  }, [currentMonth]);

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
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
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

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
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
    const isCurrentMonth = format(date, 'M') === format(currentMonth, 'M');
    
    return cn(
      'aspect-square p-3 rounded-lg transition-all duration-300 border flex items-center justify-center',
      isHoliday 
        ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50' 
        : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50',
      !isCurrentMonth && 'opacity-40',
      isAdmin && 'cursor-pointer hover:scale-105 hover:shadow-lg'
    );
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Academic Calendar
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Select date range and manage working days' : 'View working days and holidays'}
        </p>
      </div>

      <Card className="p-6 border-0 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <h2 className="text-2xl font-bold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            {isAdmin ? 'Click to toggle: Green = Holiday, Red = Working Day' : 'Green = Holiday, Red = Working Day'}
          </p>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {getCalendarDays().map((date) => (
            <div
              key={date.toISOString()}
              onClick={() => toggleDayStatus(date)}
              className={getDayClassName(date)}
            >
              <span className="text-lg font-semibold">
                {format(date, 'd')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Calendar;
