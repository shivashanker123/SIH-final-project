const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface MessageRequest {
  student_id: string;
  message_text: string;
  session_id?: number;
  metadata?: Record<string, any>;
}

export interface MessageResponse {
  student_id: string;
  message_id: string;
  message_text: string;
  checkpoint_results: Array<{
    checkpoint_name: string;
    passed: boolean;
    processing_time_ms: number;
  }>;
  emoji_analysis?: {
    genuine_distress: boolean;
    confidence: number;
    reasoning: string;
    emoji_function: string;
  };
  concern_indicators: string[];
  safety_flags: string[];
  risk_profile?: {
    overall_risk: string;
    confidence: number;
    risk_factors: any;
    recommended_action: string;
  };
  response_generated: boolean;
  response_text?: string;
  crisis_protocol_triggered: boolean;
}

export interface RiskProfile {
  overall_risk: string;
  confidence: number;
  risk_factors: any;
  calculated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  confirm_password: string;
  major?: string;
}

export interface AuthResponse {
  student_id: string;
  email: string;
  name: string;
  token: string;
}

// Process a student message
export async function processMessage(data: MessageRequest): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/messages/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to process message' }));
    throw new Error(error.detail || 'Failed to process message');
  }

  return await response.json();
}

// Get risk profile for a student
export async function getRiskProfile(studentId: string): Promise<RiskProfile> {
  const response = await fetch(`${API_BASE_URL}/alerts/risk-profile/${studentId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No risk profile found');
    }
    throw new Error('Failed to get risk profile');
  }

  return await response.json();
}

// Get message analyses for a student
export async function getMessageAnalyses(studentId: string, limit: number = 10) {
  const response = await fetch(`${API_BASE_URL}/messages/analysis/${studentId}?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to get message analyses');
  }

  return await response.json();
}

// Submit PHQ-2 assessment
export async function submitPHQ2(studentId: string, responses: Record<string, number>) {
  const response = await fetch(`${API_BASE_URL}/assessments/phq2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: studentId,
      responses: responses,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit PHQ-2');
  }

  return await response.json();
}

// Check if C-SSRS should be triggered
export async function checkCSSRSTrigger(studentId: string, context: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/assessments/cssrs/trigger-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: studentId,
      context: context,
    }),
  });

  return await response.json();
}

// Submit C-SSRS assessment
export async function submitCSSRS(
  studentId: string,
  responses: Record<string, number>,
  triggerReason: string
) {
  const response = await fetch(`${API_BASE_URL}/assessments/cssrs/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: studentId,
      responses: responses,
      trigger_reason: triggerReason,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit C-SSRS');
  }

  return await response.json();
}

// Submit counselor feedback
export async function submitFeedback(feedbackData: {
  student_id: string;
  alert_id?: number;
  risk_profile_id?: number;
  was_appropriate: boolean;
  actual_severity: string;
  urgency: string;
  ai_accuracy: string;
  what_ai_missed?: string;
  what_ai_over_interpreted?: string;
  actual_clinical_scores?: Record<string, any>;
  counselor_id: string;
}) {
  const response = await fetch(`${API_BASE_URL}/learning/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  return await response.json();
}

// Get pending alerts
export async function getPendingAlerts(limit: number = 20) {
  const response = await fetch(`${API_BASE_URL}/alerts/pending?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to get alerts');
  }

  return await response.json();
}

// Get checkpoint assessment plan
export async function getCheckpointPlan(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/assessments/checkpoint-plan/${studentId}`);

  if (!response.ok) {
    throw new Error('Failed to get checkpoint plan');
  }

  return await response.json();
}

// Student login
export async function loginStudent(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail || 'Login failed');
  }

  return await response.json();
}

// Student signup
export async function signupStudent(data: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Signup failed' }));
    throw new Error(errorData.detail || 'Signup failed');
  }

  return await response.json();
}

// ============ COMMUNITY API ============

export interface UserProfile {
  student_id: string;
  anonymized_name: string;
  major: string | null;
  bio: string;
  followers_count: number;
  following_count: number;
  communities_count: number;
  posts_count: number;
  join_date: string;
}

export interface Community {
  community_id: string;
  name: string;
  description: string;
  category: string;
  owner_id: string;
  owner_name: string;
  members_count: number;
  is_joined: boolean;
  created_at: string;
}

export interface Post {
  post_id: string;
  community_id: string;
  community_name: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface Connection {
  connection_id: string;
  student1_id: string;
  student1_name: string;
  student2_id: string;
  student2_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UserSearchResult {
  student_id: string;
  anonymized_name: string;
  major: string | null;
  bio: string | null;
  is_connected: boolean;
  connection_status: 'pending' | 'accepted' | 'rejected' | 'none';
}

// Get user profile
export async function getUserProfile(studentId: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/community/profile/${studentId}`);
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  return await response.json();
}

// Update user profile
export async function updateUserProfile(
  studentId: string,
  bio?: string,
  major?: string
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/community/profile/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio, major }),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return await response.json();
}

// Create community
export async function createCommunity(
  studentId: string,
  name: string,
  description: string,
  category: string
): Promise<Community> {
  const response = await fetch(`${API_BASE_URL}/community/communities?student_id=${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, category }),
  });
  if (!response.ok) {
    throw new Error('Failed to create community');
  }
  return await response.json();
}

// List communities
export async function listCommunities(
  studentId: string,
  category?: string
): Promise<Community[]> {
  let url = `${API_BASE_URL}/community/communities?student_id=${studentId}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list communities');
  }
  return await response.json();
}

// Join community
export async function joinCommunity(
  studentId: string,
  communityId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/community/communities/${communityId}/join?student_id=${studentId}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error('Failed to join community');
  }
}

// Leave community
export async function leaveCommunity(
  studentId: string,
  communityId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/community/communities/${communityId}/leave?student_id=${studentId}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new Error('Failed to leave community');
  }
}

// Create post
export async function createPost(
  studentId: string,
  communityId: string,
  title: string,
  content: string,
  imageUrl?: string,
  videoUrl?: string
): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/community/posts?student_id=${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ community_id: communityId, title, content, image_url: imageUrl, video_url: videoUrl }),
  });
  if (!response.ok) {
    throw new Error('Failed to create post');
  }
  return await response.json();
}

// List posts
export async function listPosts(
  studentId: string,
  communityId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Post[]> {
  let url = `${API_BASE_URL}/community/posts?student_id=${studentId}&limit=${limit}&offset=${offset}`;
  if (communityId) {
    url += `&community_id=${communityId}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list posts');
  }
  return await response.json();
}

// Like post
export async function likePost(
  studentId: string,
  postId: string
): Promise<{ likes_count: number; is_liked: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/community/posts/${postId}/like?student_id=${studentId}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error('Failed to like post');
  }
  return await response.json();
}

// Send connection request
export async function sendConnectionRequest(
  studentId: string,
  targetStudentId: string
): Promise<Connection> {
  const response = await fetch(`${API_BASE_URL}/community/connections?student_id=${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student2_id: targetStudentId }),
  });
  if (!response.ok) {
    throw new Error('Failed to send connection request');
  }
  return await response.json();
}

// List connections
export async function listConnections(
  studentId: string,
  statusFilter?: 'pending' | 'accepted' | 'rejected'
): Promise<Connection[]> {
  let url = `${API_BASE_URL}/community/connections?student_id=${studentId}`;
  if (statusFilter) {
    url += `&status_filter=${statusFilter}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list connections');
  }
  return await response.json();
}

// Accept connection
export async function acceptConnection(
  studentId: string,
  connectionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/community/connections/${connectionId}/accept?student_id=${studentId}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error('Failed to accept connection');
  }
}

// Reject connection
export async function rejectConnection(
  studentId: string,
  connectionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/community/connections/${connectionId}/reject?student_id=${studentId}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error('Failed to reject connection');
  }
}

// Send message
export async function sendMessage(
  studentId: string,
  receiverId: string,
  content: string
): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/community/messages?student_id=${studentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return await response.json();
}

// Get messages
export async function getMessages(
  studentId: string,
  otherStudentId?: string,
  limit: number = 100,
  offset: number = 0
): Promise<Message[]> {
  let url = `${API_BASE_URL}/community/messages?student_id=${studentId}&limit=${limit}&offset=${offset}`;
  if (otherStudentId) {
    url += `&other_student_id=${otherStudentId}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to get messages');
  }
  return await response.json();
}

// Search users
export async function searchUsers(
  studentId: string,
  query: string,
  limit: number = 20
): Promise<UserSearchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/community/search/users?student_id=${studentId}&query=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error('Failed to search users');
  }
  return await response.json();
}
