import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, BookOpen } from 'lucide-react';
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
  status: string;
  admin_response: string | null;
  created_at: string;
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

const AdminControlCenter = () => {
  const { toast } = useToast();
  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([]);
  const [materialContributions, setMaterialContributions] = useState<MaterialContribution[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AssignmentRequest | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialContribution | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectType, setRejectType] = useState<'assignment' | 'material'>('assignment');

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

    const table = rejectType === 'assignment' ? 'assignment_requests' : 'material_contributions';
    const id = rejectType === 'assignment' ? selectedRequest?.id : selectedMaterial?.id;

    const { error } = await supabase
      .from(table)
      .update({
        status: 'rejected',
        admin_response: rejectReason,
      })
      .eq('id', id);

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
      fetchRequests();
    }
  };

  const openRejectDialog = (type: 'assignment' | 'material', item: any) => {
    setRejectType(type);
    if (type === 'assignment') {
      setSelectedRequest(item);
    } else {
      setSelectedMaterial(item);
    }
    setShowRejectDialog(true);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
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
                  <div>
                    <CardTitle className="text-xl">{request.assignment_title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Course: {request.course_name} • By: {request.student.full_name} ({request.student.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline: {format(new Date(request.deadline), 'PPP')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">What to do:</p>
                  <p className="text-sm text-muted-foreground">{request.what_to_do}</p>
                </div>
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
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Uploaded File
                  </a>
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
    </div>
  );
};

export default AdminControlCenter;
