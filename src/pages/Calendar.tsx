import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isBefore, isAfter, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Calendar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dateRangeSet, setDateRangeSet] = useState(false);
  const [dayStatuses, setDayStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (dateRangeSet) {
      fetchDayStatuses();
    }
  }, [currentMonth, dateRangeSet]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    setIsAdmin(data?.role === 'admin');
  };

  const setDateRange = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (isAfter(startDate, endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setCurrentMonth(startDate);
    setDateRangeSet(true);
    toast.success('Date range set successfully');
  };

  const fetchDayStatuses = async () => {
    if (!startDate || !endDate) return;
    
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
    const newMonth = subMonths(currentMonth, 1);
    if (startDate && isBefore(endOfMonth(newMonth), startDate)) {
      toast.error('Cannot go before start date');
      return;
    }
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    if (endDate && isAfter(startOfMonth(newMonth), endDate)) {
      toast.error('Cannot go after end date');
      return;
    }
    setCurrentMonth(newMonth);
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return !isBefore(date, startDate) && !isAfter(date, endDate);
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
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const inRange = isDateInRange(date);
    
    return cn(
      'aspect-square p-2 rounded-xl transition-all duration-300 border-2 flex flex-col items-center justify-center relative overflow-hidden',
      inRange && isHoliday 
        ? 'bg-gradient-to-br from-emerald-500/30 to-green-600/30 border-emerald-400/60 shadow-md' 
        : inRange && !isHoliday
        ? 'bg-gradient-to-br from-rose-500/30 to-red-600/30 border-rose-400/60 shadow-md'
        : 'bg-muted/20 border-border/30',
      !isCurrentMonth && 'opacity-30',
      !inRange && 'cursor-not-allowed',
      isAdmin && inRange && 'cursor-pointer hover:scale-110 hover:shadow-xl hover:z-10',
      inRange && 'font-semibold'
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

      {isAdmin && (
        <Card className="p-6 border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-primary rounded-xl">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Set Academic Year Range</h2>
            </div>
            
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
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

              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
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
                onClick={setDateRange}
                className="bg-gradient-primary hover:opacity-90 shadow-lg"
                size="lg"
              >
                Set Range
              </Button>
            </div>
          </div>
        </Card>
      )}

      {dateRangeSet ? (
        <Card className="p-8 border-0 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="hover:bg-primary/20 hover:scale-110 transition-all shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-3xl font-bold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Academic Year: {format(startDate!, 'MMMM yyyy')} - {format(endDate!, 'MMMM yyyy')}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="hover:bg-primary/20 hover:scale-110 transition-all shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-gradient-to-br from-emerald-500/30 to-green-600/30 border-2 border-emerald-400/60"></div>
                <span className="text-muted-foreground">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-gradient-to-br from-rose-500/30 to-red-600/30 border-2 border-rose-400/60"></div>
                <span className="text-muted-foreground">Working Day</span>
              </div>
              {isAdmin && (
                <span className="text-xs text-primary font-medium">Click dates to toggle</span>
              )}
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="text-center font-bold text-sm text-primary p-3 bg-primary/5 rounded-lg">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-3">
            {getCalendarDays().map((date) => {
              const inRange = isDateInRange(date);
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => inRange && toggleDayStatus(date)}
                  className={getDayClassName(date)}
                >
                  <span className="text-lg font-bold relative z-10">
                    {format(date, 'd')}
                  </span>
                  {inRange && (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 rounded-xl"></div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-16 border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <div className="text-center text-muted-foreground space-y-4">
            <div className="p-6 bg-primary/10 rounded-full inline-block">
              <CalendarIcon className="h-20 w-20 text-primary/50" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Calendar Set</h3>
              <p>
                {isAdmin 
                  ? 'Select start and end dates above to generate the academic calendar' 
                  : 'Admin has not set up the calendar yet'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
