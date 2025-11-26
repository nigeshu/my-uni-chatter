import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, BookOpen, HelpCircle, MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AssignmentRequest {
  id: string;
  course_name: string;
  assignment_title: string;
  what_to_do: string;
  deadline: string;
  slot_name: string | null;
  status: string;
  admin_response: string | null;
  created_at: string;
  file_url: string | null;
  student: {
    full_name: string;
    email: string;
  };
}

interface MaterialContribution {
  id: string;
  course_title: string;
  module_name: string;
  topic_name: string;
  file_url: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  student: {
    full_name: string;
    email: string;
  };
}

interface Query {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  student_id: string;
  student: {
    full_name: string;
    email: string;
  };
}

const AdminControlCenter = () => {
  const { toast } = useToast();
  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([]);
  const [materialContributions, setMaterialContributions] = useState<MaterialContribution[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AssignmentRequest | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialContribution | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectType, setRejectType] = useState<'assignment' | 'material' | 'query'>('assignment');
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    // Fetch assignment requests
    const { data: assignmentData } = await supabase
      .from('assignment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (assignmentData) {
      // Fetch student profiles for assignments
      const studentIds = assignmentData.map(a => a.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const assignmentsWithProfiles = assignmentData.map(a => ({
        ...a,
        student: profileMap.get(a.student_id) || { full_name: 'Unknown', email: 'Unknown' }
      }));

      setAssignmentRequests(assignmentsWithProfiles);
    }

    // Fetch material contributions
    const { data: materialData } = await supabase
      .from('material_contributions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (materialData) {
      // Fetch student profiles for materials
      const studentIds = materialData.map(m => m.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const materialsWithProfiles = materialData.map(m => ({
        ...m,
        student: profileMap.get(m.student_id) || { full_name: 'Unknown', email: 'Unknown' }
      }));

      setMaterialContributions(materialsWithProfiles);
    }

    // Fetch queries
    const { data: queryData } = await supabase
      .from('queries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (queryData) {
      // Fetch student profiles for queries
      const studentIds = queryData.map(q => q.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const queriesWithProfiles: Query[] = queryData.map(q => ({
        ...q,
        student: profileMap.get(q.student_id) || { full_name: 'Unknown', email: 'Unknown' }
      }));

      setQueries(queriesWithProfiles);
    }
  };

  const handleApproveAssignment = async (id: string) => {
    const { error } = await supabase
      .from('assignment_requests')
      .update({
        status: 'approved',
        admin_response: 'Thank you for your contribution! Your assignment request has been approved.',
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve request.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Assignment request approved and student notified.',
      });
      fetchRequests();
    }
  };

  const handleApproveMaterial = async (id: string) => {
    const { error } = await supabase
      .from('material_contributions')
      .update({
        status: 'approved',
        admin_response: 'Thank you for your contribution! Your course material has been approved.',
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve contribution.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Material contribution approved and student notified.',
      });
      fetchRequests();
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    let error: any;

    if (rejectType === 'assignment') {
      const result = await supabase
        .from('assignment_requests')
        .update({
          status: 'rejected',
          admin_response: rejectReason,
        })
        .eq('id', selectedRequest?.id || '');
      error = result.error;
    } else if (rejectType === 'material') {
      const result = await supabase
        .from('material_contributions')
        .update({
          status: 'rejected',
          admin_response: rejectReason,
        })
        .eq('id', selectedMaterial?.id || '');
      error = result.error;
    } else {
      const result = await supabase
        .from('queries')
        .update({
          status: 'rejected',
          admin_response: rejectReason,
        })
        .eq('id', selectedQuery?.id || '');
      error = result.error;
    }

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject request.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Request rejected and student notified with reason.',
      });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedRequest(null);
      setSelectedMaterial(null);
      setSelectedQuery(null);
      fetchRequests();
    }
  };

  const openRejectDialog = (type: 'assignment' | 'material' | 'query', item: any) => {
    setRejectType(type);
    if (type === 'assignment') {
      setSelectedRequest(item);
    } else if (type === 'material') {
      setSelectedMaterial(item);
    } else {
      setSelectedQuery(item);
    }
    setShowRejectDialog(true);
  };

  const openReplyDialog = (query: Query) => {
    setSelectedQuery(query);
    setReplyMessage('');
    setShowReplyDialog(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reply message.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('queries')
      .update({
        status: 'resolved',
        admin_response: replyMessage,
      })
      .eq('id', selectedQuery?.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Reply sent to student.',
      });
      setShowReplyDialog(false);
      setReplyMessage('');
      setSelectedQuery(null);
      fetchRequests();
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Control Center
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage student assignment requests and course material contributions
        </p>
      </div>

      {/* Assignment Requests */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Assignment Requests
          <Badge variant="secondary">{assignmentRequests.length}</Badge>
        </h2>
        <div className="grid gap-4">
          {assignmentRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{request.assignment_title}</CardTitle>
                      {request.slot_name && (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <span className="text-sm font-bold text-primary">{request.slot_name}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Course: {request.course_name} • By: {request.student.full_name} ({request.student.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline: {format(new Date(request.deadline), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">What to do:</p>
                  <p className="text-sm text-muted-foreground">{request.what_to_do}</p>
                </div>
                {request.file_url && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Attached Document:</p>
                    <div className="flex gap-2">
                      <a
                        href={request.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Preview Document
                      </a>
                      <span className="text-muted-foreground">•</span>
                      <a
                        href={request.file_url}
                        download
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveAssignment(request.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Notify
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog('assignment', request)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {assignmentRequests.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending assignment requests
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Material Contributions */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Course Material Contributions
          <Badge variant="secondary">{materialContributions.length}</Badge>
        </h2>
        <div className="grid gap-4">
          {materialContributions.map((material) => (
            <Card key={material.id} className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{material.course_title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      By: {material.student.full_name} ({material.student.email})
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Module:</p>
                    <p className="text-sm text-muted-foreground">{material.module_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Topic:</p>
                    <p className="text-sm text-muted-foreground">{material.topic_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Document:</p>
                  <div className="flex gap-2">
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Preview Document
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={material.file_url}
                      download
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveMaterial(material.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Notify
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog('material', material)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {materialContributions.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending material contributions
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Reason for rejection:
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject & Notify Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog for Queries */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuery && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-1">Subject:</p>
                <p className="text-sm mb-3">{selectedQuery.subject}</p>
                <p className="text-sm font-semibold mb-1">Student's Message:</p>
                <p className="text-sm text-muted-foreground">{selectedQuery.message}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Your Reply:
              </label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your reply to the student..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} className="gap-2">
              <Send className="h-4 w-4" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Queries */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Student Queries
          <Badge variant="secondary">{queries.length}</Badge>
        </h2>
        <div className="grid gap-4">
          {queries.map((query) => (
            <Card key={query.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{query.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      By: {query.student.full_name} ({query.student.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(query.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Message:</p>
                  <p className="text-sm text-muted-foreground">{query.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openReplyDialog(query)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {queries.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending queries
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminControlCenter;
