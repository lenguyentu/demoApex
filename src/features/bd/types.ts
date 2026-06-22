// Status Enum (Kết hợp cũ và mới)
export type BDStatus = 
  // Old Statuses
  | 'Working' 
  | 'Hiring' 
  | 'Pending' 
  | 'Closed' 
  | 'Reject'
  // New Statuses
  | 'Research'
  | 'Addfriend/Connect'
  | 'Approach'
  | 'Follow up'
  | 'Consulting'
  | 'Demo contract'
  | 'Signing'
  | 'Signed'
  | 'Meeting Clear JD'
  | 'Hunting'
  | 'Take care'
  | 'No current need'
  | 'Excluded';
export type BDPhase = 'Connect' | 'Follow up' | 'Approach' | 'Nurturing' | 'Proposal' | 'Negotiation' | 'Closing' | 'Lost';
export type BDPriority = 'Normal' | 'High Priority';

// Type ánh xạ trực tiếp từ DB
export interface BDProcess {
  id: string; // UUID
  client_id: string;
  owner_id: string; // User ID của BD
  priority: BDPriority;
  source: string;
  potential_job_title: string | null;
  potential_job_link: string | null;
  
  // Các trường chuẩn của Process
  phase: BDPhase;
  status: BDStatus;
  first_contact_date: string | null; // ISO Date string
  last_contact_date: string | null;  // ISO Date string (quan trọng cho remind)
  memo: string | null;
  
  created_at: string;
  updated_at: string;

  // Joined fields (Khi query kèm bảng clients/users)
  client?: {
    id: string;
    client_name: string;
    website_url?: string;
    client_industry?: string; // Tương ứng Domain
    location?: string;
  };
  
  owner?: {
    id: string;
    full_name: string;
  };
}

// Type dùng cho UI (có thể map từ DB type sang)
export interface BDCustomer extends BDProcess {
  // Alias tiện dụng nếu cần
  companyName?: string; // map từ client.client_name
  domain?: string;      // map từ client.client_industry
  daysLastContact?: number; // Tính toán cho tiện hiển thị
}

export interface BDSchedule {
  id: string;
  process_id: string;
  owner_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  reminder_type: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  id: string;
  processId: string;
  clientId: string;
  clientName: string;
  reminderType: string; // Changed from 7 | 15 | 30 to string
  status: string;
  startDate: string; 
  dueDate: string;   
  bdOwner: string;
  bdOwnerId: string;
  overdueDays?: number; 
  isToday?: boolean;
  priority: string;   
  source: string;     
  industry?: string;  
}
