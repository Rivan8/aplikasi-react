export type ScheduleResponseStatus = 'pending' | 'accepted' | 'declined';

export interface EventSessionSummary {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  attendance_start_time: string;
}

export interface EventScheduleItem {
  id?: number;
  title: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface EventSchedule {
  assignment_id: number;
  event_id: number;
  response_status: ScheduleResponseStatus;
  response_reason: string | null;
  responded_at: string | null;
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  category: string;
  attendance_type: 'volunteer' | 'general';
  total_sessions: number;
  sessions: EventSessionSummary[];
}

export interface EventDetail {
  id: number;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  address: string | null;
  category: string;
  attendance_type?: 'volunteer' | 'general';
  total_sessions?: number;
  sessions: EventSessionSummary[];
  worship: {
    date: string | null;
    start_time: string | null;
    end_time: string | null;
  };
  training: EventScheduleItem[];
  other: EventScheduleItem[];
  training_schedules: EventScheduleItem[];
  other_schedules: EventScheduleItem[];
}

export interface ScheduleActionData {
  assignment_id: number;
  event_id: number;
  response_status: ScheduleResponseStatus;
  response_reason: string | null;
  responded_at: string | null;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}
