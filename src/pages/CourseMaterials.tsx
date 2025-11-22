import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Link, Video, File, Download } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseDetailDialog from '@/components/CourseDetailDialog';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  material_type: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration_hours: number;
  credits?: number;
  class_days?: string[];
}

const CourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      checkEnrollment();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (data) {
      setCourse(data);
      setSelectedCourse(data);
    }
  };

  const checkEnrollment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single();

    if (data) {
      setIsEnrolled(true);
      fetchMaterials();
    }
  };

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setMaterials(data);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="h-5 w-5" />;
      case 'link': return <Link className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (!isEnrolled) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Access Denied
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You need to enroll in this course to access the materials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            {course?.title}
          </h1>
          <p className="text-muted-foreground text-lg">Course Content</p>
        </div>
      </div>

      <Tabs value="materials" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger 
            value="course" 
            onClick={() => {
              setSelectedCourse(course);
              setShowDetailDialog(true);
            }}
          >
            Course Page
          </TabsTrigger>
          <TabsTrigger value="materials">Course Materials</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                {getMaterialIcon(material.material_type)}
                <div className="flex-1">
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{material.material_type}</p>
                </div>
                {material.file_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            {material.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{material.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-16">
          <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4 opacity-50">
            <FileText className="h-20 w-20 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No materials available yet</h3>
          <p className="text-muted-foreground">Check back later for course materials</p>
        </div>
      )}

      <CourseDetailDialog
        course={selectedCourse}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  );
};

export default CourseMaterials;
