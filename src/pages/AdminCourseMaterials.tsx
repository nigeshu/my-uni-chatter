import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, FileText, Link, Video, File } from 'lucide-react';
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

const AdminCourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    material_type: 'document',
  });

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchMaterials();
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

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setMaterials(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('course_materials')
          .update(formData)
          .eq('id', editingMaterial.id);
        if (error) throw error;
        toast({ title: 'Success!', description: 'Material updated successfully.' });
      } else {
        const { error } = await supabase.from('course_materials').insert({
          ...formData,
          course_id: courseId,
          order_index: materials.length,
        });
        if (error) throw error;
        toast({ title: 'Success!', description: 'Material added successfully.' });
      }

      setShowDialog(false);
      setEditingMaterial(null);
      setFormData({ title: '', description: '', file_url: '', material_type: 'document' });
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save material.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      file_url: material.file_url || '',
      material_type: material.material_type,
    });
    setShowDialog(true);
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    const { error } = await supabase.from('course_materials').delete().eq('id', materialId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete material.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Material deleted successfully.' });
      fetchMaterials();
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="h-5 w-5" />;
      case 'link': return <Link className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {course?.title}
            </h1>
            <p className="text-muted-foreground text-lg">Course Management</p>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-accent hover:opacity-90"
              onClick={() => {
                setEditingMaterial(null);
                setFormData({ title: '', description: '', file_url: '', material_type: 'document' });
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Material title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Material description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Material Type</Label>
                <Select
                  value={formData.material_type}
                  onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_url">URL / File Link</Label>
                <Input
                  id="file_url"
                  placeholder="https://..."
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-accent hover:opacity-90">
                  {loading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Add Material'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getMaterialIcon(material.material_type)}
                  <div>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{material.material_type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(material)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(material.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(material.description || material.file_url) && (
              <CardContent>
                {material.description && (
                  <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                )}
                {material.file_url && (
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    Open Resource
                  </a>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-16">
          <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4">
            <FileText className="h-20 w-20 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No materials yet</h3>
          <p className="text-muted-foreground mb-6">Add your first course material to get started</p>
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

export default AdminCourseMaterials;
