export interface Student {
  student_id: string;
  full_name: string;
  class_level: string;
  department: string;
  email: string;
  phone_number: string;
  photo: string;
  created_at?: string;
}

export type NotificationType = "success" | "error" | "info";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  message: string;
}

export interface StudentFilters {
  search: string;
  classLevel: string;
  department: string;
}

export interface PaginatedResponse {
  students: Student[];
  totalCount: number;
  page: number;
  pagesCount: number;
}
