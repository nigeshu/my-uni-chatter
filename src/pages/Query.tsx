import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Query {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const Query = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queries, setQueries] = useState<Query[]>([]);
  const [showNewQueryDialog, setShowNewQueryDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      fetchQueries();
    }
  }, [user]);

  const fetchQueries = async () => {
    const { data } = await supabase
      .from('queries')
      .select('*')
      .eq('student_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setQueries(data);
    }
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('queries')
        .insert({
          student_id: user?.id,
          subject: form.subject,
          message: form.message,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Query submitted successfully! Admin will contact you soon.',
      });

      setForm({ subject: '', message: '' });
      setShowNewQueryDialog(false);
      fetchQueries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit query.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Query
          </h1>
          <p className="text-muted-foreground text-lg">
            Ask questions and get help from admin
          </p>
        </div>
        
        <Button onClick={() => setShowNewQueryDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Request New Query
        </Button>
      </div>

      <div className="grid gap-6">
        {queries.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="p-8 bg-gradient-primary rounded-full inline-block shadow-xl mb-6">
                <MessageSquare className="h-20 w-20 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Queries Yet</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Submit your first query to get help from admin
              </p>
              <Button onClick={() => setShowNewQueryDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Request New Query
              </Button>
            </CardContent>
          </Card>
        ) : (
          queries.map((query) => (
            <Card key={query.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{query.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(query.created_at), 'PPp')}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(query.status)} border`}>
                    {query.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Your Message:</p>
                  <p className="text-sm text-muted-foreground">{query.message}</p>
                </div>
                
                {query.admin_response && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm font-semibold text-primary mb-2">Admin Response:</p>
                    <p className="text-sm text-muted-foreground">{query.admin_response}</p>
                  </div>
                )}

                {query.status === 'pending' && !query.admin_response && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm text-yellow-600">
                      ⏳ Waiting for admin response...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showNewQueryDialog} onOpenChange={setShowNewQueryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request New Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Query Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Enter query subject"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your query in detail..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewQueryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              <Send className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Query'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Query;
