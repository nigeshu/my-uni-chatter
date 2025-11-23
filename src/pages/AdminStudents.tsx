import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  enrollmentCount?: number;
  cgpa?: number;
}

interface Semester {
  id: string;
  semester_name: string;
  gpa: number;
  credits: number;
  graded_credits: number;
  order_index: number;
}

interface CourseMark {
  id: string;
  course_type: string;
  cat1_mark: number | null;
  cat2_mark: number | null;
  da1_mark: number | null;
  da2_mark: number | null;
  da3_mark: number | null;
  theory_fat: number | null;
  lab_internals: number | null;
  lab_fat: number | null;
  course: {
    title: string;
  };
}

interface StudentProgress {
  semesters: Semester[];
  courseMarks: CourseMark[];
  enrolledCourses: Array<{ course: { title: string; credits: number } }>;
  totalCreditsEarned: number;
  totalCreditsEnrolled: number;
  overallCGPA: number;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressData, setProgressData] = useState<StudentProgress | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (data) {
      const studentsWithEnrollments = await Promise.all(
        data.map(async (student) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id);

          const { data: semesters } = await supabase
            .from('cgpa_semesters')
            .select('gpa, graded_credits')
            .eq('student_id', student.id);

          let cgpa = 0;
          if (semesters && semesters.length > 0) {
            const totalWeightedGPA = semesters.reduce(
              (sum, sem) => sum + (sem.gpa * sem.graded_credits),
              0
            );
            const totalCredits = semesters.reduce(
              (sum, sem) => sum + sem.graded_credits,
              0
            );
            cgpa = totalCredits > 0 ? totalWeightedGPA / totalCredits : 0;
          }

          return { ...student, enrollmentCount: count || 0, cgpa };
        })
      );

      setStudents(studentsWithEnrollments);
    }
  };

  const fetchStudentProgress = async (studentId: string) => {
    setLoading(true);
    
    // Fetch semesters
    const { data: semesters } = await supabase
      .from('cgpa_semesters')
      .select('*')
      .eq('student_id', studentId)
      .order('order_index', { ascending: true });

    // Fetch course marks
    const { data: courseMarks } = await supabase
      .from('course_marks')
      .select(`
        *,
        course:courses (title)
      `)
      .eq('student_id', studentId);

    // Fetch enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        course:courses (title, credits)
      `)
      .eq('student_id', studentId);

    // Calculate totals
    let totalCreditsEarned = 0;
    let totalCreditsEnrolled = 0;
    let overallCGPA = 0;

    if (semesters && semesters.length > 0) {
      totalCreditsEarned = semesters.reduce((sum, sem) => sum + sem.credits, 0);
      const totalWeightedGPA = semesters.reduce(
        (sum, sem) => sum + (sem.gpa * sem.graded_credits),
        0
      );
      const totalGradedCredits = semesters.reduce(
        (sum, sem) => sum + sem.graded_credits,
        0
      );
      overallCGPA = totalGradedCredits > 0 ? totalWeightedGPA / totalGradedCredits : 0;
    }

    if (enrollments) {
      totalCreditsEnrolled = enrollments.reduce((sum, enr) => sum + (enr.course.credits || 0), 0);
    }

    setProgressData({
      semesters: semesters || [],
      courseMarks: courseMarks || [],
      enrolledCourses: enrollments || [],
      totalCreditsEarned,
      totalCreditsEnrolled,
      overallCGPA,
    });

    setLoading(false);
  };

  const handleStudentClick = async (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
    await fetchStudentProgress(student.id);
  };

  const calculateTheoryTotal = (mark: CourseMark) => {
    const cat1 = ((mark.cat1_mark || 0) / 50) * 15;
    const cat2 = ((mark.cat2_mark || 0) / 50) * 15;
    const da1 = ((mark.da1_mark || 0) / 10) * 10;
    const da2 = ((mark.da2_mark || 0) / 10) * 10;
    const da3 = ((mark.da3_mark || 0) / 10) * 10;
    const fat = ((mark.theory_fat || 0) / 100) * 40;
    return cat1 + cat2 + da1 + da2 + da3 + fat;
  };

  const calculateLabTotal = (mark: CourseMark) => {
    const internals = ((mark.lab_internals || 0) / 60) * 60;
    const fat = ((mark.lab_fat || 0) / 50) * 40;
    return internals + fat;
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

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Students</h1>
        <p className="text-muted-foreground text-lg">
          View and manage student accounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card 
            key={student.id} 
            className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg cursor-pointer hover:scale-105"
            onClick={() => handleStudentClick(student)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xl">
                    {student.full_name?.[0] || student.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {student.full_name || 'Student'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {student.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enrolled Courses</span>
                  <Badge variant="secondary">{student.enrollmentCount}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CGPA</span>
                  <Badge variant={student.cgpa && student.cgpa >= 8.0 ? "default" : "secondary"}>
                    {student.cgpa ? student.cgpa.toFixed(2) : 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-sm">
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {students.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No students yet</h3>
          <p className="text-muted-foreground">
            Students will appear here once they sign up
          </p>
        </div>
      )}

      {/* Student Progress Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {selectedStudent?.full_name?.[0] || selectedStudent?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl">{selectedStudent?.full_name || 'Student'}</div>
                <div className="text-sm text-muted-foreground font-normal">{selectedStudent?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : progressData ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overall CGPA</p>
                        <p className="text-2xl font-bold">{progressData.overallCGPA.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Credits Earned</p>
                        <p className="text-2xl font-bold">{progressData.totalCreditsEarned}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Credits Enrolled</p>
                        <p className="text-2xl font-bold">{progressData.totalCreditsEnrolled}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="semesters" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="semesters">Semesters</TabsTrigger>
                  <TabsTrigger value="theory">Theory Marks</TabsTrigger>
                  <TabsTrigger value="lab">Lab Marks</TabsTrigger>
                </TabsList>

                <TabsContent value="semesters" className="space-y-4">
                  {progressData.semesters.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No semester data available</p>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Semester</TableHead>
                            <TableHead>GPA</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Graded Credits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {progressData.semesters.map((sem) => (
                            <TableRow key={sem.id}>
                              <TableCell className="font-medium">{sem.semester_name}</TableCell>
                              <TableCell>
                                <Badge variant={sem.gpa >= 8.0 ? "default" : "secondary"}>
                                  {sem.gpa.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell>{sem.credits}</TableCell>
                              <TableCell>{sem.graded_credits}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="theory" className="space-y-4">
                  {progressData.courseMarks.filter(m => m.course_type === 'theory').length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No theory marks available</p>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>CAT 1</TableHead>
                            <TableHead>CAT 2</TableHead>
                            <TableHead>DA1</TableHead>
                            <TableHead>DA2</TableHead>
                            <TableHead>DA3</TableHead>
                            <TableHead>FAT</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {progressData.courseMarks
                            .filter(m => m.course_type === 'theory')
                            .map((mark) => {
                              const total = calculateTheoryTotal(mark);
                              return (
                                <TableRow key={mark.id}>
                                  <TableCell className="font-medium">{mark.course.title}</TableCell>
                                  <TableCell>{mark.cat1_mark ?? '-'}</TableCell>
                                  <TableCell>{mark.cat2_mark ?? '-'}</TableCell>
                                  <TableCell>{mark.da1_mark ?? '-'}</TableCell>
                                  <TableCell>{mark.da2_mark ?? '-'}</TableCell>
                                  <TableCell>{mark.da3_mark ?? '-'}</TableCell>
                                  <TableCell>{mark.theory_fat ?? '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant={total >= 50 ? "default" : "destructive"}>
                                      {total.toFixed(2)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="lab" className="space-y-4">
                  {progressData.courseMarks.filter(m => m.course_type === 'lab').length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No lab marks available</p>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Internals</TableHead>
                            <TableHead>FAT</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {progressData.courseMarks
                            .filter(m => m.course_type === 'lab')
                            .map((mark) => {
                              const total = calculateLabTotal(mark);
                              const grade = getLabGrade(total);
                              return (
                                <TableRow key={mark.id}>
                                  <TableCell className="font-medium">{mark.course.title}</TableCell>
                                  <TableCell>{mark.lab_internals ?? '-'}</TableCell>
                                  <TableCell>{mark.lab_fat ?? '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant={total >= 50 ? "default" : "destructive"}>
                                      {total.toFixed(2)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={
                                        grade === 'S' || grade === 'A' ? 'bg-blue-500' :
                                        grade === 'B' || grade === 'C' ? 'bg-yellow-500' :
                                        grade === 'D' || grade === 'E' ? 'bg-green-500' :
                                        'bg-red-500'
                                      }
                                    >
                                      {grade}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
