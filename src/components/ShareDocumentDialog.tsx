import { useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDocumentDialog = ({ open, onOpenChange }: ShareDocumentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    course_title: '',
    module_name: '',
    topic_name: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.course_title || !form.module_name || !form.topic_name || !file) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields and select a file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course_materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course_materials')
        .getPublicUrl(fileName);

      // Insert contribution record
      const { error: insertError } = await supabase
        .from('material_contributions')
        .insert({
          student_id: user?.id,
          course_title: form.course_title,
          module_name: form.module_name,
          topic_name: form.topic_name,
          file_url: publicUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Thanks for the information, Admin will respond back to you',
      });

      // Reset form
      setForm({
        course_title: '',
        module_name: '',
        topic_name: '',
      });
      setFile(null);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit contribution.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Provide Course Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Course Title</Label>
            <Input
              value={form.course_title}
              onChange={(e) => setForm({ ...form, course_title: e.target.value })}
              placeholder="Enter course title"
            />
          </div>
          <div>
            <Label>Module Name</Label>
            <Input
              value={form.module_name}
              onChange={(e) => setForm({ ...form, module_name: e.target.value })}
              placeholder="Enter module name"
            />
          </div>
          <div>
            <Label>Topic Name</Label>
            <Input
              value={form.topic_name}
              onChange={(e) => setForm({ ...form, topic_name: e.target.value })}
              placeholder="Enter topic name"
            />
          </div>
          <div>
            <Label>Upload Document</Label>
            <div className="mt-2">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;
