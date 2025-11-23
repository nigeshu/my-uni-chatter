import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  course_name: string;
  exam_date: string;
  portions: string;
  exam_type: string;
  sub_category: string;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [portions, setPortions] = useState("");
  const [examType, setExamType] = useState("theory");
  const [subCategory, setSubCategory] = useState("Cat 1");
  const [customLabCategory, setCustomLabCategory] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    // Update subcategory based on exam type
    if (examType === "theory") {
      setSubCategory("Cat 1");
    } else if (examType === "lab") {
      setSubCategory("Lab FAT");
    } else if (examType === "non_graded") {
      setSubCategory("Assessment 1");
    }
  }, [examType]);

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
    if (!courseName || !examDate || !portions || !examType || !subCategory) {
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
        exam_type: examType,
        sub_category: subCategory,
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
    setCustomLabCategory("");
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

  const getSubCategoryOptions = () => {
    if (examType === "theory") {
      return ["Cat 1", "Cat 2", "FAT"];
    } else if (examType === "lab") {
      // Get unique lab categories from existing exams
      const labCategories = exams
        .filter(e => e.exam_type === "lab" && e.sub_category !== "Lab FAT")
        .map(e => e.sub_category)
        .filter((v, i, a) => a.indexOf(v) === i);
      return ["Lab FAT", ...labCategories, "custom"];
    } else if (examType === "non_graded") {
      return ["Assessment 1", "Assessment 2", "Assessment 3", "Assessment 4", "Assessment 5", "Assessment 6"];
    }
    return [];
  };

  const getExamTypeLabel = (type: string) => {
    switch(type) {
      case "theory": return "Theory";
      case "lab": return "Lab";
      case "non_graded": return "Non Graded";
      default: return type;
    }
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
            <Label htmlFor="examType">Exam Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="theory">Theory</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="non_graded">Non Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="subCategory">Sub Category</Label>
            {examType === "lab" && subCategory === "custom" ? (
              <Input
                id="customLabCategory"
                value={customLabCategory}
                onChange={(e) => {
                  setCustomLabCategory(e.target.value);
                  setSubCategory(e.target.value);
                }}
                placeholder="Enter custom lab category"
              />
            ) : (
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getSubCategoryOptions().map(option => (
                    <SelectItem key={option} value={option}>
                      {option === "custom" ? "+ Add Custom Category" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

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
              <TableHead>Type</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Portions</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No exams scheduled
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{getExamTypeLabel(exam.exam_type)}</TableCell>
                  <TableCell>{exam.sub_category}</TableCell>
                  <TableCell>{exam.course_name}</TableCell>
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
