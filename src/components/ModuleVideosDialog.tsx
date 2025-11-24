import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Loader2, Plus, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const [selectedSpaceCategory, setSelectedSpaceCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (open && module?.id) {
      fetchCategories();
    } else {
      setSelectedCategory(null);
      setVideos([]);
      setSelectedVideo(null);
    }
  }, [open, module?.id]);

  useEffect(() => {
    if (selectedCategory) {
      fetchVideos(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    if (!module?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_video_categories')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index');

      if (error) throw error;

      setCategories(data || []);
      
      // Auto-select first category if available
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (categoryId: string) => {
    setLoading(true);
    setVideos([]);
    setSelectedVideo(null);
    
    try {
      const { data, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index');
      
      if (error) throw error;
      
      setVideos(data || []);
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
    setSelectedCategory(null);
    setVideos([]);
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
    setSelectedSpaceCategory('');
    if (value) {
      fetchSpaceCategories(value);
    }
  };

  const saveToSpace = async () => {
    if (!selectedVideoToAdd) return;

    let categoryId = selectedSpaceCategory;

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
    setSelectedSpaceCategory('');
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {module?.heading} - Videos
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ScrollArea className="h-[calc(80vh-120px)]">
              {loading && categories.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No categories available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span className="line-clamp-2">{category.name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Videos Section */}
          <div className="flex-1 overflow-hidden">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a category to view videos
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            ) : videos.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p>No videos in this category</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {videos.map((video) => (
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
              </ScrollArea>
            )}
          </div>
        </div>
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
                  value={selectedSpaceCategory}
                  onValueChange={(value) => {
                    setSelectedSpaceCategory(value);
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
                disabled={!selectedSubject || (!selectedSpaceCategory && !showNewCategory)}
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
