import { useState, useEffect } from 'react';
import { BookOpen, Calendar, CheckCircle2, Clock, Plus, RotateCcw, FileText, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import AssignmentDetailDialog from '@/components/AssignmentDetailDialog';

interface Course {
  id: string;
  title: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  courses: Course;
  submissions?: Array<{ id: string; student_id: string }>;
}

const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    due_date: '',
  });

  const [requestForm, setRequestForm] = useState({
    course_name: '',
    assignment_title: '',
    what_to_do: '',
    deadline: '',
  });
  const [requestFile, setRequestFile] = useState<File | null>(null);
  const [uploadingRequest, setUploadingRequest] = useState(false);

  useEffect(() => {
    fetchUserRole();
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true);
    
    if (data) setCourses(data);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('assignments')
      .select(`
        *,
        courses:course_id (id, title),
        submissions (id, student_id)
      `)
      .order('due_date', { ascending: true });

    if (profile?.role !== 'admin') {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);
      
      const courseIds = enrollments?.map(e => e.course_id) || [];
      query = query.in('course_id', courseIds);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } else {
      setAssignments(data || []);
    }
    setLoading(false);
  };

  const handleCreateAssignment = async () => {
    if (!formData.course_id || !formData.title || !formData.due_date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('assignments')
      .insert({
        course_id: formData.course_id,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
      setDialogOpen(false);
      setFormData({ course_id: '', title: '', description: '', due_date: '' });
      fetchAssignments();
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.course_name || !requestForm.assignment_title || !requestForm.what_to_do || !requestForm.deadline) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingRequest(true);

    try {
      let fileUrl = null;

      // Upload file if provided (optional)
      if (requestFile) {
        const fileExt = requestFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('course_materials')
          .upload(fileName, requestFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('course_materials')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const { error } = await supabase
        .from('assignment_requests')
        .insert({
          student_id: userId,
          course_name: requestForm.course_name,
          assignment_title: requestForm.assignment_title,
          what_to_do: requestForm.what_to_do,
          deadline: requestForm.deadline,
          file_url: fileUrl,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Thanks for the information, Admin will respond back to you',
      });
      setShowRequestDialog(false);
      setRequestForm({
        course_name: '',
        assignment_title: '',
        what_to_do: '',
        deadline: '',
      });
      setRequestFile(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request.',
        variant: 'destructive',
      });
    } finally {
      setUploadingRequest(false);
    }
  };

  const handleToggleCompletion = async (assignmentId: string, isCompleted: boolean) => {
    if (isCompleted) {
      // Revert completion - delete the submission
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Error',
          description: 'Failed to revert completion',
          variant: 'destructive',
        });
      } else {
        // Update local state immediately for better UX
        setAssignments(prev => prev.map(a => {
          if (a.id === assignmentId) {
            return {
              ...a,
              submissions: a.submissions?.filter(s => s.student_id !== userId) || []
            };
          }
          return a;
        }));
        
        toast({
          title: 'Success',
          description: 'Assignment marked as incomplete',
        });
      }
    } else {
      // Mark as completed - insert submission
      const { error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: userId,
          content: 'Marked as completed',
        });

      if (error) {
        console.error('Insert error:', error);
        toast({
          title: 'Error',
          description: 'Failed to mark as completed',
          variant: 'destructive',
        });
      } else {
        // Update local state immediately for better UX
        setAssignments(prev => prev.map(a => {
          if (a.id === assignmentId) {
            return {
              ...a,
              submissions: [...(a.submissions || []), { id: crypto.randomUUID(), student_id: userId }]
            };
          }
          return a;
        }));
        
        toast({
          title: 'Success',
          description: 'Assignment marked as completed',
        });
      }
    }
  };

  const isAssignmentCompleted = (assignment: Assignment) => {
    return assignment.submissions?.some(s => s.student_id === userId) || false;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      fetchAssignments();
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Assignments
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAdmin ? 'Manage course assignments' : 'View and complete your assignments'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Post Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Post a new assignment for your course
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course Name *</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Assignment Name *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter assignment name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">What To Do</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter assignment description and instructions"
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Deadline *</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAssignment}>
                    Create Assignment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={() => setShowRequestDialog(true)} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              New Assignment Info
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl">
              <BookOpen className="h-20 w-20 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">No Assignments Yet</h2>
              <p className="text-muted-foreground text-lg">
                {isAdmin ? 'Create your first assignment to get started' : 'No assignments have been posted yet'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.due_date);
            const isCompleted = isAssignmentCompleted(assignment);
            const isOverdue = daysUntilDue < 0;
            const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;

            return (
              <Card 
                key={assignment.id} 
                className={`group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden relative cursor-pointer ${
                  isCompleted ? 'bg-muted/50' : ''
                }`}
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowDetailDialog(true);
                }}
              >
                {isCompleted && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                )}
                
                <div className={`h-32 relative overflow-hidden ${
                  isOverdue ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700' :
                  isUrgent ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500' :
                  'bg-gradient-to-br from-primary via-purple-500 to-accent'
                }`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">{assignment.courses.title}</span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-xl line-clamp-2">
                    {assignment.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy HH:mm')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {assignment.description}
                    </p>
                  )}

                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isOverdue ? 'bg-red-500/10 text-red-500' :
                    isUrgent ? 'bg-orange-500/10 text-orange-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` :
                       daysUntilDue === 0 ? 'Due today' :
                       daysUntilDue === 1 ? 'Due tomorrow' :
                       `${daysUntilDue} days left`}
                    </span>
                  </div>

                  {isAdmin ? (
                    <Button
                      className="w-full gap-2"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAssignment(assignment.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Assignment
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      variant={isCompleted ? "secondary" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompletion(assignment.id, isCompleted);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isCompleted ? 'Completed' : 'Mark as Completed'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AssignmentDetailDialog
        assignment={selectedAssignment}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Assignment Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Name</Label>
              <Input
                value={requestForm.course_name}
                onChange={(e) => setRequestForm({ ...requestForm, course_name: e.target.value })}
                placeholder="Enter course name"
              />
            </div>
            <div>
              <Label>Assignment Title</Label>
              <Input
                value={requestForm.assignment_title}
                onChange={(e) => setRequestForm({ ...requestForm, assignment_title: e.target.value })}
                placeholder="Enter assignment title"
              />
            </div>
            <div>
              <Label>What To Do</Label>
              <Textarea
                value={requestForm.what_to_do}
                onChange={(e) => setRequestForm({ ...requestForm, what_to_do: e.target.value })}
                placeholder="Describe the assignment details"
                rows={4}
              />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="datetime-local"
                value={requestForm.deadline}
                onChange={(e) => setRequestForm({ ...requestForm, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label>Upload Document (Optional)</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRequestFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                />
                {requestFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {requestFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={uploadingRequest}>
              {uploadingRequest ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;
