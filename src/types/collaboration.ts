export interface PublicationData {
  id: string;
  process: { id: string; name: string; description: string; bpmnXml: string; svgThumbnail?: string; category: string };
  title: string;
  description: string;
  isPublic: boolean;
  publishedBy: { firstName: string; lastName: string };
  publishedAt: string;
  expiresAt?: string;
  viewCount: number;
  feedbacks: FeedbackData[];
  _count?: { feedbacks: number };
}

export interface FeedbackData {
  id: string;
  user: { firstName: string; lastName: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CommentData {
  id: string;
  content: string;
  user: { id: string; firstName: string; lastName: string; avatar?: string };
  parentId?: string;
  replies?: CommentData[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
