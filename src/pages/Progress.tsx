import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Calculator, Award, FlaskConical, BookOpen, CheckCircle2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Semester {
  id: string;
  semester_name: string;
  credits: number;
  graded_credits: number;
  gpa: number;
  order_index: number;
}

interface EnrolledCourse {
  id: string;
  course_id: string;
  completed_at?: string | null;
  course: {
    id: string;
    title: string;
    course_type: 'theory' | 'lab';
  };
}

interface CourseMark {
  id?: string;
  course_id: string;
  course_type: 'theory' | 'lab';
  lab_internals?: number;
  lab_fat?: number;
  cat1_mark?: number;
  cat2_mark?: number;
  da1_mark?: number;
  da2_mark?: number;
  da3_mark?: number;
  theory_fat?: number;
}

const Progress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [newSemester, setNewSemester] = useState({ name: '', credits: '', gradedCredits: '', gpa: '' });
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<EnrolledCourse[]>([]);
  const [courseMarks, setCourseMarks] = useState<Record<string, CourseMark>>({});
  const [completedCourseMarks, setCompletedCourseMarks] = useState<Record<string, CourseMark>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [semesterCompletionEnabled, setSemesterCompletionEnabled] = useState(false);
  const [marksheetDialogOpen, setMarksheetDialogOpen] = useState(false);
  const [totalMarksDialogOpen, setTotalMarksDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSemesters();
      fetchEnrolledCourses();
      fetchCompletedCourses();
      checkAdminRole();
      fetchSemesterSettings();
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

  const fetchSemesters = async () => {
    const { data } = await supabase
      .from('cgpa_semesters')
      .select('*')
      .eq('student_id', user?.id)
      .order('order_index');

    if (data) {
      setSemesters(data);
      calculateCGPA(data);
    }
  };

  const fetchEnrolledCourses = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        completed_at,
        course:courses(id, title, course_type)
      `)
      .eq('student_id', user?.id)
      .is('completed_at', null);

    if (data) {
      setEnrolledCourses(data as any);
      fetchCourseMarks(data.map((e: any) => e.course_id));
    }
  };

  const fetchCompletedCourses = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        completed_at,
        course:courses(id, title, course_type)
      `)
      .eq('student_id', user?.id)
      .not('completed_at', 'is', null);

    if (data) {
      setCompletedCourses(data as any);
      fetchCompletedCourseMarks(data.map((e: any) => e.course_id));
    }
  };

  const fetchCourseMarks = async (courseIds: string[]) => {
    if (courseIds.length === 0) {
      setCourseMarks({});
      return;
    }
    
    const { data } = await supabase
      .from('course_marks')
      .select('*')
      .eq('student_id', user?.id)
      .in('course_id', courseIds);

    if (data) {
      const marksMap: Record<string, CourseMark> = {};
      data.forEach((mark: any) => {
        marksMap[mark.course_id] = {
          id: mark.id,
          course_id: mark.course_id,
          course_type: mark.course_type as 'theory' | 'lab',
          lab_internals: mark.lab_internals,
          lab_fat: mark.lab_fat,
          cat1_mark: mark.cat1_mark,
          cat2_mark: mark.cat2_mark,
          da1_mark: mark.da1_mark,
          da2_mark: mark.da2_mark,
          da3_mark: mark.da3_mark,
          theory_fat: mark.theory_fat,
        };
      });
      setCourseMarks(marksMap);
    }
  };

  const fetchCompletedCourseMarks = async (courseIds: string[]) => {
    if (courseIds.length === 0) {
      setCompletedCourseMarks({});
      return;
    }
    
    const { data } = await supabase
      .from('course_marks')
      .select('*')
      .eq('student_id', user?.id)
      .in('course_id', courseIds);

    if (data) {
      const marksMap: Record<string, CourseMark> = {};
      data.forEach((mark: any) => {
        marksMap[mark.course_id] = {
          id: mark.id,
          course_id: mark.course_id,
          course_type: mark.course_type as 'theory' | 'lab',
          lab_internals: mark.lab_internals,
          lab_fat: mark.lab_fat,
          cat1_mark: mark.cat1_mark,
          cat2_mark: mark.cat2_mark,
          da1_mark: mark.da1_mark,
          da2_mark: mark.da2_mark,
          da3_mark: mark.da3_mark,
          theory_fat: mark.theory_fat,
        };
      });
      setCompletedCourseMarks(marksMap);
    }
  };

  const calculateCGPA = (semesterData: Semester[]) => {
    if (semesterData.length === 0) {
      setCgpa(0);
      return;
    }

    const totalGradedCredits = semesterData.reduce((sum, sem) => sum + sem.graded_credits, 0);
    const weightedSum = semesterData.reduce((sum, sem) => sum + sem.graded_credits * sem.gpa, 0);
    setCgpa(totalGradedCredits > 0 ? weightedSum / totalGradedCredits : 0);
  };

  const handleAddSemester = async () => {
    if (!newSemester.name || !newSemester.credits || !newSemester.gradedCredits || !newSemester.gpa) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('cgpa_semesters').insert({
      student_id: user?.id,
      semester_name: newSemester.name,
      credits: parseFloat(newSemester.credits),
      graded_credits: parseFloat(newSemester.gradedCredits),
      gpa: parseFloat(newSemester.gpa),
      order_index: semesters.length,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add semester',
        variant: 'destructive',
      });
    } else {
      setNewSemester({ name: '', credits: '', gradedCredits: '', gpa: '' });
      setDialogOpen(false);
      fetchSemesters();
      toast({
        title: 'Success',
        description: 'Semester added successfully',
      });
    }
  };

  const fetchSemesterSettings = async () => {
    const { data } = await supabase
      .from('semester_settings')
      .select('semester_completion_enabled')
      .maybeSingle();
    
    if (data) {
      setSemesterCompletionEnabled(data.semester_completion_enabled);
    }
  };

  const handleCompleteSemester = async () => {
    if (!user) return;

    // Get all enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .is('completed_at', null);

    if (!enrollments || enrollments.length === 0) {
      toast({
        title: 'Info',
        description: 'No enrolled courses to complete',
      });
      return;
    }

    // Update all enrollments to completed
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ completed_at: new Date().toISOString() })
      .eq('student_id', user.id)
      .is('completed_at', null);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to complete semester',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Semester completed! View your marksheet below.',
    });

    // Refresh data to show 0 enrolled courses and fetch completed courses
    fetchEnrolledCourses();
    fetchCompletedCourses();
  };

  const handleDeleteSemester = async (id: string) => {
    const { error } = await supabase
      .from('cgpa_semesters')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete semester',
        variant: 'destructive',
      });
    } else {
      fetchSemesters();
      toast({
        title: 'Success',
        description: 'Semester deleted successfully',
      });
    }
  };

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setEditDialogOpen(true);
  };

  const handleUpdateSemester = async () => {
    if (!editingSemester) return;

    const { error } = await supabase
      .from('cgpa_semesters')
      .update({
        semester_name: editingSemester.semester_name,
        credits: editingSemester.credits,
        graded_credits: editingSemester.graded_credits,
        gpa: editingSemester.gpa,
      })
      .eq('id', editingSemester.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update semester',
        variant: 'destructive',
      });
    } else {
      setEditDialogOpen(false);
      setEditingSemester(null);
      fetchSemesters();
      toast({
        title: 'Success',
        description: 'Semester updated successfully',
      });
    }
  };

  const handleMarkChange = async (courseId: string, field: string, value: number) => {
    const currentMark = courseMarks[courseId];
    const course = enrolledCourses.find(e => e.course_id === courseId);
    
    if (!course) return;

    const updatedMark = {
      ...(currentMark || {}),
      course_id: courseId,
      course_type: course.course.course_type,
      [field]: value,
    };

    setCourseMarks(prev => ({ ...prev, [courseId]: updatedMark }));

    // Save to database
    if (currentMark?.id) {
      await supabase
        .from('course_marks')
        .update({ [field]: value })
        .eq('id', currentMark.id);
    } else {
      const { data } = await supabase
        .from('course_marks')
        .insert({
          student_id: user?.id,
          ...updatedMark,
        })
        .select()
        .single();

      if (data) {
        setCourseMarks(prev => ({ 
          ...prev, 
          [courseId]: { ...updatedMark, id: data.id } 
        }));
      }
    }
  };

  const calculateLabTotal = (mark: Partial<CourseMark>) => {
    const internals = mark.lab_internals || 0;
    const fat = mark.lab_fat || 0;
    const fatWeighted = (fat / 50) * 40;
    return internals + fatWeighted;
  };

  const getLabGrade = (total: number) => {
    if (total >= 90) return 'S';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const getLabGradeColor = (grade: string) => {
    if (grade === 'S' || grade === 'A') return 'bg-blue-500 text-white';
    if (grade === 'B' || grade === 'C') return 'bg-yellow-500 text-white';
    if (grade === 'D' || grade === 'E') return 'bg-green-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getMarksNeededToPass = (currentTotal: number, isLab: boolean) => {
    const passingMark = 50;
    if (currentTotal >= passingMark) return null;
    return (passingMark - currentTotal).toFixed(2);
  };

  const calculateTheoryTotal = (mark: Partial<CourseMark>) => {
    const cat1 = ((mark.cat1_mark || 0) / 50) * 15;
    const cat2 = ((mark.cat2_mark || 0) / 50) * 15;
    const da1 = mark.da1_mark || 0;
    const da2 = mark.da2_mark || 0;
    const da3 = mark.da3_mark || 0;
    const fat = ((mark.theory_fat || 0) / 100) * 40;
    return cat1 + cat2 + da1 + da2 + da3 + fat;
  };

  const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const ensurePositive = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Progress Tracking
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your CGPA and course performance
        </p>
      </div>

      {/* CGPA Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Your CGPA
            </CardTitle>
            <div className="text-4xl font-bold">
              {cgpa.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Semesters</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Semester
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Semester</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Semester Name</Label>
                    <Input
                      value={newSemester.name}
                      onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                      placeholder="e.g., Semester 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newSemester.credits}
                      onKeyDown={preventNegative}
                      onChange={(e) => setNewSemester({ ...newSemester, credits: e.target.value })}
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Graded Credits</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newSemester.gradedCredits}
                      onKeyDown={preventNegative}
                      onChange={(e) => setNewSemester({ ...newSemester, gradedCredits: e.target.value })}
                      placeholder="e.g., 18"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={newSemester.gpa}
                      onKeyDown={preventNegative}
                      onChange={(e) => setNewSemester({ ...newSemester, gpa: e.target.value })}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                  <Button onClick={handleAddSemester} className="w-full">
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{sem.semester_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Credits: {sem.credits} | GPA: {sem.gpa.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSemester(sem)}
                    className="hover:bg-primary/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSemester(sem.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No semesters added yet. Click "Add Semester" to get started.</p>
              </div>
            )}
          </div>

          {/* Edit Semester Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Semester</DialogTitle>
              </DialogHeader>
              {editingSemester && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Semester Name</Label>
                    <Input
                      value={editingSemester.semester_name}
                      onChange={(e) => setEditingSemester({ ...editingSemester, semester_name: e.target.value })}
                      placeholder="e.g., Semester 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingSemester.credits}
                      onKeyDown={preventNegative}
                      onChange={(e) => setEditingSemester({ ...editingSemester, credits: ensurePositive(e.target.value) })}
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Graded Credits</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingSemester.graded_credits}
                      onKeyDown={preventNegative}
                      onChange={(e) => setEditingSemester({ ...editingSemester, graded_credits: ensurePositive(e.target.value) })}
                      placeholder="e.g., 18"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editingSemester.gpa}
                      onKeyDown={preventNegative}
                      onChange={(e) => setEditingSemester({ ...editingSemester, gpa: ensurePositive(e.target.value) })}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                  <Button onClick={handleUpdateSemester} className="w-full">
                    Update
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {!isAdmin && semesterCompletionEnabled && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full gap-2" 
                variant="default"
                onClick={handleCompleteSemester}
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Semester
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Marks</CardTitle>
            {enrolledCourses.length > 0 && (
              <Button 
                onClick={() => setTotalMarksDialogOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Total Marks
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theory" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="theory" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Theory Courses
              </TabsTrigger>
              <TabsTrigger value="lab" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Lab Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lab">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses
                  .filter((enrollment) => enrollment.course.course_type === 'lab')
                  .map((enrollment) => {
                    const course = enrollment.course;
                    const mark = courseMarks[course.id];

                    return (
                      <div key={enrollment.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            Lab
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Internals (out of 60)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="60"
                              value={mark?.lab_internals || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'lab_internals', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>FAT (out of 50)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={mark?.lab_fat || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'lab_fat', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2 space-y-3">
                            <div className="p-3 bg-muted/50 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Total (out of 100):</span>
                                <span className="text-xl font-bold">{calculateLabTotal(mark || {}).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Grade:</span>
                                <span className={`text-2xl font-bold px-4 py-2 rounded ${getLabGradeColor(getLabGrade(calculateLabTotal(mark || {})))}`}>
                                  {getLabGrade(calculateLabTotal(mark || {}))}
                                </span>
                              </div>
                            </div>
                            {calculateLabTotal(mark || {}) < 50 ? (
                              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                  ⚠️ Failed! You need {getMarksNeededToPass(calculateLabTotal(mark || {}), true)} more marks to pass (minimum 50/100 required)
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                  ✓ Passed! You just need 40 out of 100 in FAT to get passed
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {enrolledCourses.filter((e) => e.course.course_type === 'lab').length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FlaskConical className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No lab courses enrolled.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="theory">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses
                  .filter((enrollment) => enrollment.course.course_type === 'theory')
                  .map((enrollment) => {
                    const course = enrollment.course;
                    const mark = courseMarks[course.id];

                    return (
                      <div key={enrollment.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                            Theory
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>CAT 1 (out of 50)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={mark?.cat1_mark || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'cat1_mark', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CAT 2 (out of 50)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={mark?.cat2_mark || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'cat2_mark', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>DA 1 (out of 10)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={mark?.da1_mark || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'da1_mark', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>DA 2 (out of 10)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={mark?.da2_mark || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'da2_mark', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>DA 3 (out of 10)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={mark?.da3_mark || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'da3_mark', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>FAT (out of 100)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={mark?.theory_fat || ''}
                              onKeyDown={preventNegative}
                              onChange={(e) => handleMarkChange(course.id, 'theory_fat', ensurePositive(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2 space-y-3">
                            <div className="p-3 bg-muted/50 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Total (out of 100):</span>
                                <span className="text-xl font-bold">{calculateTheoryTotal(mark || {}).toFixed(2)}</span>
                              </div>
                            </div>
                            {calculateTheoryTotal(mark || {}) < 50 ? (
                              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                  ⚠️ Failed! You need {getMarksNeededToPass(calculateTheoryTotal(mark || {}), false)} more marks to pass (minimum 50/100 required)
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                  ✓ Passed! You just need 40 out of 100 in FAT to get passed
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {enrolledCourses.filter((e) => e.course.course_type === 'theory').length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No theory courses enrolled.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          {enrolledCourses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No enrolled courses found. Enroll in courses to track your marks.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marksheet Button - Only show if there are completed courses */}
      {completedCourses.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Semester Marksheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View your completed semester marksheet with all course marks
            </p>
            <Button 
              onClick={() => setMarksheetDialogOpen(true)}
              className="w-full gap-2"
            >
              <Award className="h-4 w-4" />
              View Marksheet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Total Marks Dialog */}
      <Dialog open={totalMarksDialogOpen} onOpenChange={setTotalMarksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-primary" />
              Total Marks
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="theory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="theory" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Theory Courses
                </TabsTrigger>
                <TabsTrigger value="lab" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Lab Courses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="theory">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left py-3 px-4 font-semibold">Course</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Marks</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledCourses
                        .filter((enrollment) => enrollment.course.course_type === 'theory')
                        .map((enrollment) => {
                          const course = enrollment.course;
                          const mark = courseMarks[course.id];
                          const total = calculateTheoryTotal(mark || {});

                          return (
                            <tr key={enrollment.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-medium">{course.title}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-lg font-bold">
                                  {total.toFixed(2)} / 100
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {total < 50 ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium">
                                    ⚠️ Need {getMarksNeededToPass(total, false)} more to pass
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                                    ✓ Passed
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {enrolledCourses.filter((e) => e.course.course_type === 'theory').length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No theory courses enrolled.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lab">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left py-3 px-4 font-semibold">Course</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Marks</th>
                        <th className="text-center py-3 px-4 font-semibold">Grade</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledCourses
                        .filter((enrollment) => enrollment.course.course_type === 'lab')
                        .map((enrollment) => {
                          const course = enrollment.course;
                          const mark = courseMarks[course.id];
                          const total = calculateLabTotal(mark || {});
                          const grade = getLabGrade(total);

                          return (
                            <tr key={enrollment.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-medium">{course.title}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-lg font-bold">
                                  {total.toFixed(2)} / 100
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-lg font-bold px-3 py-1 rounded ${getLabGradeColor(grade)}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {total < 50 ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium">
                                    ⚠️ Need {getMarksNeededToPass(total, true)} more to pass
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                                    ✓ Passed
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {enrolledCourses.filter((e) => e.course.course_type === 'lab').length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FlaskConical className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No lab courses enrolled.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marksheet Dialog */}
      <Dialog open={marksheetDialogOpen} onOpenChange={setMarksheetDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Award className="h-6 w-6 text-primary" />
              Semester Marksheet
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-4 font-semibold">Course</th>
                    <th className="text-center py-3 px-4 font-semibold">Type</th>
                    <th className="text-right py-3 px-4 font-semibold">Total Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {completedCourses.map((enrollment) => {
                    const course = enrollment.course;
                    const mark = completedCourseMarks[course.id];
                    const total = course.course_type === 'theory' 
                      ? calculateTheoryTotal(mark || {})
                      : calculateLabTotal(mark || {});

                    return (
                      <tr key={enrollment.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-medium">{course.title}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.course_type === 'theory' 
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {course.course_type === 'theory' ? 'Theory' : 'Lab'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-lg font-bold">
                            {total.toFixed(2)} / 100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {completedCourses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No completed courses yet. Complete a semester to view your marksheet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Progress;