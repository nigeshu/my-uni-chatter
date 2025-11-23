import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  course_name: string;
  exam_date: string;
  portions: string;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [portions, setPortions] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("exam_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive",
      });
      return;
    }

    setExams(data || []);
  };

  const handleAddExam = async () => {
    if (!courseName || !examDate || !portions) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("exams").insert([
      {
        course_name: courseName,
        exam_date: examDate,
        portions: portions,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exam",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Exam added successfully",
    });

    setCourseName("");
    setExamDate("");
    setPortions("");
    fetchExams();
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Exam deleted successfully",
    });

    fetchExams();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manage Exams</h1>
        <p className="text-muted-foreground">Add and manage exam schedules</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Exam</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Enter course name"
            />
          </div>
          <div>
            <Label htmlFor="examDate">Exam Date</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="portions">Portions</Label>
            <Textarea
              id="portions"
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
              placeholder="Enter exam portions"
              rows={4}
            />
          </div>
          <Button onClick={handleAddExam} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Exam
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Scheduled Exams</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Portions</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No exams scheduled
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.course_name}</TableCell>
                  <TableCell>{format(new Date(exam.exam_date), "PPP")}</TableCell>
                  <TableCell className="max-w-md truncate">{exam.portions}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminExams;
