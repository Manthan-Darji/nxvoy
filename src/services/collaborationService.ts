import { supabase } from '@/integrations/supabase/client';

export type CollaboratorRole = 'viewer' | 'editor' | 'co_planner';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface Collaborator {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string | null;
  role: CollaboratorRole;
  invite_token: string | null;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
  profile?: {
    name: string;
    email: string | null;
  };
}

export interface ActivityLog {
  id: string;
  trip_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  profile?: {
    name: string;
  };
}

// Generate a random invite token
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Invite a collaborator by email
export async function inviteCollaborator(
  tripId: string,
  email: string,
  role: CollaboratorRole,
  invitedBy: string
): Promise<{ success: boolean; error?: string; collaborator?: Collaborator }> {
  try {
    const inviteToken = generateInviteToken();
    
    const { data, error } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: tripId,
        email: email.toLowerCase(),
        role,
        invite_token: inviteToken,
        invited_by: invitedBy,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'This person has already been invited' };
      }
      throw error;
    }

    return { success: true, collaborator: data as Collaborator };
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

// Generate a shareable link with token
export async function generateShareableLink(
  tripId: string,
  role: CollaboratorRole,
  invitedBy: string
): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    const inviteToken = generateInviteToken();
    
    const { error } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: tripId,
        role,
        invite_token: inviteToken,
        invited_by: invitedBy,
        status: 'pending',
      });

    if (error) throw error;

    const baseUrl = window.location.origin;
    const link = `${baseUrl}/itinerary/${tripId}?invite=${inviteToken}`;
    
    return { success: true, link };
  } catch (error) {
    console.error('Error generating share link:', error);
    return { success: false, error: 'Failed to generate link' };
  }
}

// Accept an invitation
export async function acceptInvitation(
  inviteToken: string,
  userId: string
): Promise<{ success: boolean; tripId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('trip_collaborators')
      .update({
        user_id: userId,
        status: 'accepted',
      })
      .eq('invite_token', inviteToken)
      .eq('status', 'pending')
      .select('trip_id')
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Invalid or expired invitation' };

    return { success: true, tripId: data.trip_id };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

// Get collaborators for a trip
export async function getCollaborators(tripId: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('trip_collaborators')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }

  // Fetch profile data for collaborators with user_ids
  const collaborators = data || [];
  const userIds = collaborators.filter(c => c.user_id).map(c => c.user_id);
  
  let profiles: Record<string, { name: string; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, name, email')
      .in('user_id', userIds);
    
    if (profileData) {
      profiles = profileData.reduce((acc, p) => {
        acc[p.user_id] = { name: p.name, email: p.email };
        return acc;
      }, {} as Record<string, { name: string; email: string | null }>);
    }
  }

  return collaborators.map(item => ({
    ...item,
    profile: item.user_id ? profiles[item.user_id] : undefined,
  })) as Collaborator[];
}

// Update collaborator role
export async function updateCollaboratorRole(
  collaboratorId: string,
  role: CollaboratorRole
): Promise<boolean> {
  const { error } = await supabase
    .from('trip_collaborators')
    .update({ role })
    .eq('id', collaboratorId);

  return !error;
}

// Remove a collaborator
export async function removeCollaborator(collaboratorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trip_collaborators')
    .delete()
    .eq('id', collaboratorId);

  return !error;
}

// Log an activity
export async function logActivity(
  tripId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await supabase.from('trip_activity_log').insert({
    trip_id: tripId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    metadata,
  });
}

// Get recent activity for a trip
export async function getRecentActivity(
  tripId: string,
  limit: number = 10
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('trip_activity_log')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity:', error);
    return [];
  }

  // Fetch profile data for activity logs
  const activities = data || [];
  const userIds = [...new Set(activities.map(a => a.user_id))];
  
  let profiles: Record<string, { name: string }> = {};
  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, name')
      .in('user_id', userIds);
    
    if (profileData) {
      profiles = profileData.reduce((acc, p) => {
        acc[p.user_id] = { name: p.name };
        return acc;
      }, {} as Record<string, { name: string }>);
    }
  }

  return activities.map(item => ({
    ...item,
    profile: profiles[item.user_id],
  })) as ActivityLog[];
}

// Get user's role for a trip
export async function getUserRole(
  tripId: string,
  userId: string
): Promise<string | null> {
  // First check if user is owner
  const { data: trip } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single();

  if (trip?.user_id === userId) return 'owner';

  // Then check collaborator role
  const { data: collaborator } = await supabase
    .from('trip_collaborators')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();

  return collaborator?.role || null;
}
