import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Link, Video, File, Download, Play } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseDetailDialog from '@/components/CourseDetailDialog';
import ModuleVideosDialog from '@/components/ModuleVideosDialog';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  material_type: string;
  order_index: number;
  module_id: string | null;
}

interface Module {
  id: string;
  serial_no: string;
  topic: string;
  heading: string | null;
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
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videosDialogOpen, setVideosDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single();

    if (data) {
      setIsEnrolled(true);
      fetchMaterials();
      fetchModules();
    }
    setLoading(false);
  };

  const fetchModules = async () => {
    const { data } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setModules(data);
  };

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    
    if (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course materials. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
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

  if (loading) {
    return null;
  }

  if (!isEnrolled) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">
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
          <h1 className="text-4xl font-bold">
            {course?.title}
          </h1>
          <p className="text-muted-foreground text-lg">Course Content</p>
        </div>
      </div>

      <Tabs value="content" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger 
            value="course" 
            onClick={(e) => {
              e.preventDefault();
              setSelectedCourse(course);
              setShowDetailDialog(true);
            }}
          >
            Course Page
          </TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {modules.map((module) => {
          const moduleMaterials = materials.filter(m => m.module_id === module.id);
          const topics = module.topic ? module.topic.split(/[–\-\n]/).map(t => t.trim()).filter(t => t.length > 10) : [];
          const isExpanded = expandedModule === module.id;
          
          return (
            <Card key={module.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="flex items-center gap-3 p-6 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">{module.serial_no}</span>
                  </div>
                  <div className="flex-1">
                    {module.heading && (
                      <h3 className="text-lg font-semibold">{module.heading}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">{topics.length} topics</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModule(module);
                      setVideosDialogOpen(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Videos
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t p-6 space-y-4 bg-accent/5">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Topics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {topics.map((topic, index) => (
                        <Card
                          key={index}
                          className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setSelectedModule(module);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-sm line-clamp-2">{topic}</span>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {selectedTopic && selectedModule?.id === module.id && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold">Materials</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTopic(null)}
                          >
                            Close
                          </Button>
                        </div>
                        
                        <div className="grid gap-4">
                          {moduleMaterials.length > 0 ? (
                            moduleMaterials.map((material) => (
                              <Card key={material.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    {getMaterialIcon(material.material_type)}
                                    <div className="flex-1">
                                      <h5 className="font-semibold">{material.title}</h5>
                                      <p className="text-sm text-muted-foreground capitalize mb-2">{material.material_type}</p>
                                      {material.description && (
                                        <p className="text-sm text-muted-foreground">{material.description}</p>
                                      )}
                                      {material.file_url && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="mt-3"
                                          onClick={() => {
                                            setPreviewUrl(material.file_url);
                                            setPreviewTitle(material.title);
                                            setPreviewOpen(true);
                                          }}
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Open
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                              <p className="text-sm text-muted-foreground">No materials available for this topic yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {modules.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4 opacity-50">
                <FileText className="h-20 w-20 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No modules available yet</h3>
              <p className="text-muted-foreground">Check back later for course content</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{previewTitle || 'Resource preview'}</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <div className="mt-4 h-[70vh]">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-md border"
                title={previewTitle || 'Course resource preview'}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              Preview not available for this resource.
            </p>
          )}
          <div className="mt-4 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {previewUrl && (
              <Button asChild>
                <a href={previewUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CourseDetailDialog
        course={selectedCourse}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <ModuleVideosDialog
        open={videosDialogOpen}
        onOpenChange={setVideosDialogOpen}
        module={selectedModule}
      />
    </div>
  );
};

export default CourseMaterials;
