import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Link2, Mail, Copy, Check, X, UserPlus, 
  Eye, Edit, Crown, Loader2, Trash2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  inviteCollaborator,
  generateShareableLink,
  getCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
  Collaborator,
  CollaboratorRole,
} from '@/services/collaborationService';
import { useAuth } from '@/context/AuthContext';

interface ShareTripModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
}

const roleLabels: Record<CollaboratorRole | 'owner', { label: string; icon: React.ReactNode; description: string }> = {
  owner: { label: 'Owner', icon: <Crown className="w-4 h-4" />, description: 'Full control' },
  co_planner: { label: 'Co-Planner', icon: <Crown className="w-4 h-4" />, description: 'Full editing access' },
  editor: { label: 'Editor', icon: <Edit className="w-4 h-4" />, description: 'Can edit activities' },
  viewer: { label: 'Viewer', icon: <Eye className="w-4 h-4" />, description: 'View only' },
};

const ShareTripModal = ({ open, onClose, tripId, tripName }: ShareTripModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('editor');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkRole, setLinkRole] = useState<CollaboratorRole>('viewer');
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    if (open && tripId) {
      loadCollaborators();
    }
  }, [open, tripId]);

  const loadCollaborators = async () => {
    setIsLoading(true);
    const data = await getCollaborators(tripId);
    setCollaborators(data);
    setIsLoading(false);
  };

  const handleInviteByEmail = async () => {
    if (!email.trim() || !user) return;
    
    setIsInviting(true);
    const result = await inviteCollaborator(tripId, email.trim(), selectedRole, user.id);
    
    if (result.success) {
      toast({
        title: 'Invitation sent! 📧',
        description: `${email} has been invited as ${roleLabels[selectedRole].label}`,
      });
      setEmail('');
      loadCollaborators();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsInviting(false);
  };

  const handleGenerateLink = async () => {
    if (!user) return;
    
    setIsGeneratingLink(true);
    const result = await generateShareableLink(tripId, linkRole, user.id);
    
    if (result.success && result.link) {
      setGeneratedLink(result.link);
      toast({
        title: 'Link generated! 🔗',
        description: 'Anyone with this link can join as ' + roleLabels[linkRole].label,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsGeneratingLink(false);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (collaboratorId: string, newRole: CollaboratorRole) => {
    const success = await updateCollaboratorRole(collaboratorId, newRole);
    if (success) {
      toast({ title: 'Role updated' });
      loadCollaborators();
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    const success = await removeCollaborator(collaboratorId);
    if (success) {
      toast({ title: 'Collaborator removed' });
      loadCollaborators();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Share "{tripName}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="invite" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite" className="gap-2">
              <Mail className="w-4 h-4" />
              Invite by Email
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="w-4 h-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Email address</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
                  />
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CollaboratorRole)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Viewer
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Editor
                        </div>
                      </SelectItem>
                      <SelectItem value="co_planner">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Co-Planner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleInviteByEmail} 
                className="w-full"
                disabled={!email.trim() || isInviting}
              >
                {isInviting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Link permissions</Label>
                <Select value={linkRole} onValueChange={(v) => setLinkRole(v as CollaboratorRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Viewer - Can only view the itinerary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        <span>Editor - Can edit activities</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="co_planner">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span>Co-Planner - Full access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generatedLink ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can join as {roleLabels[linkRole].label}
                  </p>
                </motion.div>
              ) : (
                <Button 
                  onClick={handleGenerateLink} 
                  className="w-full"
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Shareable Link
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Collaborators */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium mb-3">People with access</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Owner (current user if they own it) */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">You</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Crown className="w-3 h-3" />
                  Owner
                </Badge>
              </div>

              {/* Collaborators */}
              <AnimatePresence>
                {collaborators.map((collab) => (
                  <motion.div
                    key={collab.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {collab.profile?.name ? getInitials(collab.profile.name) : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {collab.profile?.name || collab.email || 'Pending'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {collab.status === 'pending' ? 'Invitation pending' : collab.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {collab.status === 'pending' ? (
                        <Badge variant="outline" className="text-amber-600">
                          Pending
                        </Badge>
                      ) : (
                        <Select 
                          value={collab.role} 
                          onValueChange={(v) => handleRoleChange(collab.id, v as CollaboratorRole)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="co_planner">Co-Planner</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(collab.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {collaborators.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No collaborators yet. Invite your travel buddies!
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripModal;
