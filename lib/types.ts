export interface Teacher {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Slide {
  id: string;
  sessionId: string;
  orderIndex: number;
  type: "text" | "image";
  contentText?: string;
  imageUrl?: string;
  imageLabel?: string;
  customDuration?: number;
  customGap?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  defaultDuration: number;
  defaultGap: number;
  shuffleEnabled: boolean;
  showSecondsTimer: boolean;
  shareToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
}

// Shape returned to the student (no teacherId, no internal fields)
export interface PublicSession {
  id: string;
  title: string;
  defaultDuration: number;
  defaultGap: number;
  shuffleEnabled: boolean;
  showSecondsTimer: boolean;
  slides: PublicSlide[];
}

export interface PublicSlide {
  id: string;
  orderIndex: number;
  type: "text" | "image";
  contentText?: string;
  imageUrl?: string;
  imageLabel?: string;
  duration: number;
  gap: number;
}

// Drive OAuth configuration per teacher
export interface DriveConfig {
  email: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenInfo: object | null;
  updatedAt: string;
}
