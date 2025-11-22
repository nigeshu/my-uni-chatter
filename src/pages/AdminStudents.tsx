import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  enrollmentCount?: number;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);

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

          return { ...student, enrollmentCount: count || 0 };
        })
      );

      setStudents(studentsWithEnrollments);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-accent bg-clip-text text-transparent">
          Students
        </h1>
        <p className="text-muted-foreground text-lg">
          View and manage student accounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
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
    </div>
  );
};

export default AdminStudents;
