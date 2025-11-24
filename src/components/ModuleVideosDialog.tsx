import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Video, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoCategory {
  id: string;
  name: string;
  module_id: string | null;
}

interface CourseVideo {
  id: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string;
  channel_title: string;
  category_id: string;
}

interface ModuleVideosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: {
    id: string;
    heading: string;
    topic: string;
  } | null;
}

const ModuleVideosDialog = ({ open, onOpenChange, module }: ModuleVideosDialogProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [addToSpaceOpen, setAddToSpaceOpen] = useState(false);
  const [selectedVideoToAdd, setSelectedVideoToAdd] = useState<CourseVideo | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [spaceCategories, setSpaceCategories] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (open && module?.id) {
      fetchCategoriesAndVideos();
    }
  }, [open, module?.id]);

  const fetchCategoriesAndVideos = async () => {
    if (!module?.id) return;
    
    setLoading(true);
    try {
      // Fetch categories for this module
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('course_video_categories')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index');

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData || []);

      // Fetch all videos for these categories
      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map(c => c.id);
        const { data: videosData, error: videosError } = await supabase
          .from('course_videos')
          .select('*')
          .in('category_id', categoryIds)
          .order('order_index');

        if (videosError) throw videosError;
        setVideos(videosData || []);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedVideo(null);
    onOpenChange(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('study_subjects')
      .select('*')
      .eq('student_id', user?.id);
    
    setSubjects(data || []);
  };

  const fetchSpaceCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('study_categories')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('category_type', 'videos');
    
    setSpaceCategories(data || []);
  };

  const handleAddToSpace = (video: CourseVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVideoToAdd(video);
    fetchSubjects();
    setAddToSpaceOpen(true);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedCategory('');
    if (value) {
      fetchSpaceCategories(value);
    }
  };

  const saveToSpace = async () => {
    if (!selectedVideoToAdd) return;

    let categoryId = selectedCategory;

    // Create new category if needed
    if (showNewCategory && newCategoryName.trim()) {
      const { data, error } = await supabase
        .from('study_categories')
        .insert({
          subject_id: selectedSubject,
          name: newCategoryName.trim(),
          category_type: 'videos',
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create category',
          variant: 'destructive',
        });
        return;
      }

      categoryId = data.id;
    }

    if (!categoryId) {
      toast({
        title: 'Error',
        description: 'Please select or create a category',
        variant: 'destructive',
      });
      return;
    }

    // Save video
    const { error } = await supabase.from('study_items').insert({
      category_id: categoryId,
      title: selectedVideoToAdd.video_title,
      youtube_url: `https://www.youtube.com/watch?v=${selectedVideoToAdd.video_id}`,
      video_source: 'course',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add video to space',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Video added to your space!',
    });

    setAddToSpaceOpen(false);
    setSelectedVideoToAdd(null);
    setSelectedSubject('');
    setSelectedCategory('');
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const getCategoryVideos = (categoryId: string) => {
    return videos.filter(v => v.category_id === categoryId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {module?.heading} - Videos
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Video className="h-12 w-12 animate-pulse text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Video className="h-20 w-20 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Videos Available</h3>
              <p className="text-muted-foreground">
                Videos for this module haven't been added yet.
              </p>
            </div>
          </div>
        ) : selectedVideo ? (
          <div className="space-y-4 h-full flex flex-col">
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <Button variant="outline" onClick={() => setSelectedVideo(null)}>
              Back to video list
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryVideos = getCategoryVideos(category.id);
                
                return (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader className="bg-accent/5 border-b">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {categoryVideos.length} {categoryVideos.length === 1 ? 'video' : 'videos'}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      {categoryVideos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No videos in this category yet
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {categoryVideos.map((video) => (
                            <Card
                              key={video.id}
                              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40 relative group"
                            >
                              <div onClick={() => setSelectedVideo(video.video_id)}>
                                <CardHeader className="p-0">
                                  <div className="relative aspect-video">
                                    <img
                                      src={video.video_thumbnail}
                                      alt={video.video_title}
                                      className="w-full h-full object-cover rounded-t-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Play className="h-12 w-12 text-white" />
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-3">
                                  <CardTitle className="text-sm line-clamp-2 mb-1">
                                    {video.video_title}
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground">{video.channel_title}</p>
                                </CardContent>
                              </div>
                              <Button
                                size="sm"
                                variant="default"
                                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => handleAddToSpace(video, e)}
                                title="Add to My Space"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>

      {/* Add to Space Dialog */}
      <Dialog open={addToSpaceOpen} onOpenChange={setAddToSpaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video to My Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Do you want to add "{selectedVideoToAdd?.video_title}" to your space?
            </p>

            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubject && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setShowNewCategory(value === 'new');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaceCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">+ Create New Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showNewCategory && (
              <div className="space-y-2">
                <Label>New Category Name</Label>
                <Input
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={saveToSpace}
                disabled={!selectedSubject || (!selectedCategory && !showNewCategory)}
                className="flex-1"
              >
                Add to Space
              </Button>
              <Button variant="outline" onClick={() => setAddToSpaceOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ModuleVideosDialog;
