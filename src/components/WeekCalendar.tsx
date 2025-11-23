import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface WeekCalendarProps {
  isAdmin: boolean;
}

export const WeekCalendar = ({ isAdmin }: WeekCalendarProps) => {
  const { toast } = useToast();
  const [dayStatuses, setDayStatuses] = useState<Record<string, boolean>>({});
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  // Get 7 days starting from yesterday
  const dates = Array.from({ length: 7 }, (_, i) => addDays(yesterday, i));
  
  // Get month and year for display
  const monthYear = format(dates[3], 'MMMM yyyy'); // Use middle date

  useEffect(() => {
    fetchDayStatuses();
  }, []);

  const fetchDayStatuses = async () => {
    const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));
    
    const { data } = await supabase
      .from('day_status')
      .select('*')
      .in('date', dateStrings);

    if (data) {
      const statusMap: Record<string, boolean> = {};
      data.forEach(item => {
        statusMap[item.date] = item.is_holiday;
      });
      setDayStatuses(statusMap);
    }
  };

  const toggleDayStatus = async (date: Date) => {
    if (!isAdmin) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const currentStatus = dayStatuses[dateString] || false;
    const newStatus = !currentStatus;

    // Optimistically update UI
    setDayStatuses(prev => ({
      ...prev,
      [dateString]: newStatus
    }));

    // Upsert to database
    const { error } = await supabase
      .from('day_status')
      .upsert({
        date: dateString,
        is_holiday: newStatus,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date'
      });

    if (error) {
      // Revert on error
      setDayStatuses(prev => ({
        ...prev,
        [dateString]: currentStatus
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to update day status.',
        variant: 'destructive',
      });
    }
  };

  const getDayClassName = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isHoliday = dayStatuses[dateString] || false;
    
    const baseClasses = `flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
      isAdmin ? 'cursor-pointer hover:scale-105' : ''
    }`;
    
    if (isHoliday) {
      return `${baseClasses} bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30`;
    } else {
      return `${baseClasses} bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg">{monthYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date) => (
            <div
              key={date.toISOString()}
              onClick={() => toggleDayStatus(date)}
              className={getDayClassName(date)}
            >
              <span className="text-xs font-medium mb-1">
                {format(date, 'EEE')}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
            </div>
          ))}
        </div>
        {isAdmin && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Click to toggle: Green = Holiday, Red = Working Day
          </p>
        )}
      </CardContent>
    </Card>
  );
};
