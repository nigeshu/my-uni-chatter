import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Award, Clock, GraduationCap, ArrowRight, Edit2, BookMarked, MessageSquare, AlertCircle, Plus, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Stats {
  enrolledCourses: number;
  cgpa: number;
  totalCreditsEarned: number;
  totalCreditsEnrolled: number;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    enrolledCourses: 0,
    cgpa: 0,
    totalCreditsEarned: 0,
    totalCreditsEnrolled: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [semesterText, setSemesterText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newSemesterText, setNewSemesterText] = useState('');
  const [alerts, setAlerts] = useState<{
    messages: Array<{ id: string; message: string }>;
    urgentAssignments: Array<{ id: string; title: string; course_title: string; due_date: string }>;
  }>({
    messages: [],
    urgentAssignments: [],
  });
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentCourses();
      fetchSemesterInfo();
      checkAdminRole();
      fetchAlerts();
      fetchNotifications();
      loadViewedNotifications();
    }
  }, [user]);

  const checkAdminRole = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchSemesterInfo = async () => {
    const { data } = await supabase
      .from('semester_info')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    
    if (data) {
      setSemesterText(data.semester_text);
    }
  };

  const handleUpdateSemester = async () => {
    if (!newSemesterText.trim()) return;

    const { error } = await supabase
      .from('semester_info')
      .update({ semester_text: newSemesterText })
      .eq('is_active', true);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update semester text.',
        variant: 'destructive',
      });
    } else {
      setSemesterText(newSemesterText);
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Semester text updated successfully.',
      });
    }
  };

  const fetchStats = async () => {
    // Fetch enrollments with course credits
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, course:courses(credits)')
      .eq('student_id', user?.id);

    // Fetch CGPA data
    const { data: semesters } = await supabase
      .from('cgpa_semesters')
      .select('credits, gpa')
      .eq('student_id', user?.id);

    let cgpa = 0;
    if (semesters && semesters.length > 0) {
      const totalCredits = semesters.reduce((sum, sem) => sum + sem.credits, 0);
      const weightedSum = semesters.reduce((sum, sem) => sum + sem.credits * sem.gpa, 0);
      cgpa = totalCredits > 0 ? weightedSum / totalCredits : 0;
    }

    // Calculate total credits
    let totalCreditsEnrolled = 0;
    let totalCreditsEarned = 0;
    
    if (enrollments) {
      // Count only courses that haven't been completed yet as enrolled
      totalCreditsEnrolled = enrollments
        .filter((e: any) => !e.completed_at)
        .reduce((sum, e: any) => sum + (e.course?.credits || 0), 0);
    }

    // Earned credits ONLY from manually added semesters
    if (semesters && semesters.length > 0) {
      totalCreditsEarned = semesters.reduce((sum, sem) => sum + sem.credits, 0);
    }

    setStats({
      enrolledCourses: enrollments?.length || 0,
      cgpa: cgpa,
      totalCreditsEarned,
      totalCreditsEnrolled,
    });
  };

  const fetchRecentCourses = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('student_id', user?.id)
      .order('enrolled_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentCourses(data);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;

    // Fetch admin messages from database
    const { data: messages } = await supabase
      .from('admin_messages')
      .select('id, message')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (messages) {
      setAlerts(prev => ({
        ...prev,
        messages: messages,
      }));
    }

    // Fetch urgent and overdue assignments
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    const courseIds = enrollments?.map(e => e.course_id) || [];

    if (courseIds.length > 0) {
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          course:courses!inner (title)
        `)
        .in('course_id', courseIds)
        .lte('due_date', twoDaysFromNow.toISOString())
        .order('due_date', { ascending: true });

      if (assignments) {
        setAlerts(prev => ({
          ...prev,
          urgentAssignments: assignments.map((a: any) => ({
            id: a.id,
            title: a.title,
            course_title: a.course.title,
            due_date: a.due_date,
          })),
        }));
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: assignmentResponses } = await supabase
      .from('assignment_requests')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false });

    const { data: materialResponses } = await supabase
      .from('material_contributions')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false });

    const { data: queryResponses } = await supabase
      .from('queries')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['resolved', 'rejected'])
      .order('updated_at', { ascending: false });

    const allNotifications = [
      ...(assignmentResponses || []).map(r => ({ ...r, type: 'assignment' })),
      ...(materialResponses || []).map(r => ({ ...r, type: 'material' })),
      ...(queryResponses || []).map(r => ({ ...r, type: 'query' })),
    ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    setNotifications(allNotifications);
  };

  const loadViewedNotifications = () => {
    const stored = localStorage.getItem(`viewed_notifications_${user?.id}`);
    if (stored) {
      setViewedNotifications(JSON.parse(stored));
    }
  };

  const markNotificationsAsViewed = () => {
    const notificationIds = notifications.map(n => n.id);
    const updatedViewed = [...new Set([...viewedNotifications, ...notificationIds])];
    setViewedNotifications(updatedViewed);
    localStorage.setItem(`viewed_notifications_${user?.id}`, JSON.stringify(updatedViewed));
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markNotificationsAsViewed();
    }
  };

  const unviewedCount = notifications.filter(n => !viewedNotifications.includes(n.id)).length;

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('admin_messages')
      .insert({ message: newMessage });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add message.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Message added successfully.',
      });
      setNewMessage('');
      setMessageDialogOpen(false);
      fetchAlerts();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Message deleted successfully.',
      });
      fetchAlerts();
    }
  };

  const statCards = [
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      gradient: 'from-primary to-purple-600',
    },
    {
      title: 'Your CGPA',
      value: stats.cgpa.toFixed(2),
      icon: GraduationCap,
      gradient: 'from-success to-emerald-600',
    },
    {
      title: 'Credits Earned',
      value: stats.totalCreditsEarned,
      icon: Award,
      gradient: 'from-accent to-rose-600',
    },
    {
      title: 'Credits Enrolled',
      value: stats.totalCreditsEnrolled,
      icon: BookMarked,
      gradient: 'from-warning to-orange-600',
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">
              Welcome Back! 👋
            </h1>
          {semesterText && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <span className="text-lg font-semibold">
                {semesterText}
              </span>
              {isAdmin && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setNewSemesterText(semesterText)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Semester Text</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Semester Text</Label>
                        <Input
                          value={newSemesterText}
                          onChange={(e) => setNewSemesterText(e.target.value)}
                          placeholder="For Winter Semester 2025 - 2026"
                        />
                      </div>
                      <Button onClick={handleUpdateSemester} className="w-full">
                        Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
          </div>
          {!isAdmin && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={handleNotificationClick}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unviewedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unviewedCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto z-50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No notifications yet
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg border ${
                            notif.status === 'approved' || notif.status === 'resolved'
                              ? 'bg-success/10 border-success/20'
                              : 'bg-destructive/10 border-destructive/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-sm">
                              {notif.type === 'assignment'
                                ? `Assignment Request: ${notif.assignment_title}`
                                : notif.type === 'query'
                                ? `Query: ${notif.subject}`
                                : `Material Contribution: ${notif.course_title}`}
                            </p>
                            <Badge variant={notif.status === 'approved' || notif.status === 'resolved' ? 'default' : 'destructive'}>
                              {notif.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notif.admin_response}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Continue your learning journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Alerts & Notifications</h2>
          <p className="text-muted-foreground">Stay updated with important announcements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Admin Messages Box */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="h-2 bg-gradient-accent" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-accent">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Admin Messages</div>
                    <p className="text-sm text-muted-foreground font-normal">
                      Important announcements
                    </p>
                  </div>
                </CardTitle>
                {isAdmin && (
                  <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Admin Message</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Enter your message..."
                          />
                        </div>
                        <Button onClick={handleAddMessage} className="w-full">
                          Add Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No new messages
                  </p>
                ) : (
                  alerts.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="group p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/10 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{msg.message}</p>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Assignments Box */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Urgent Assignments</div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Due within 2 days
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.urgentAssignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No urgent assignments
                  </p>
                ) : (
                  alerts.urgentAssignments.map((assignment) => {
                    const dueDate = new Date(assignment.due_date);
                    const isOverdue = dueDate < new Date();
                    
                    return (
                      <div 
                        key={assignment.id} 
                        className={`p-4 rounded-lg border hover:shadow-lg transition-all cursor-pointer ${
                          isOverdue 
                            ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/40 hover:border-red-500/60' 
                            : 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40'
                        }`}
                        onClick={() => navigate('/dashboard/assignments')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">
                              {assignment.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {assignment.course_title}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className={`h-3 w-3 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                              <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                {isOverdue ? 'OVERDUE: ' : 'Due: '}
                                {format(dueDate, 'MMM dd, HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
