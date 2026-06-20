/**
 * Danh sách toàn bộ Permissions trong hệ thống (Mapping 1-1 với Database)
 * Giúp tránh dùng magic strings và dễ dàng scale/rename sau này.
 */
export const PERMISSIONS = {
  // DASHBOARD & ADMIN
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_SYSTEM: "manage_system",
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",
  AUDIT_LOGS: "audit_logs",
  ADMIN_ONLY: "admin_only", // Flag cho các trang cực kỳ nhạy cảm
  
  // SALES & REVENUE
  VIEW_ALL_SALES: "view_all_sales",
  VIEW_SALES: "view_sales",
  VIEW_BD_DASHBOARD: "view_bd_dashboard",
  VIEW_PLACEMENTS: "view_placements",

  // JOBS
  VIEW_JOBS: "view_jobs",
  CREATE_JOB: "create_job",
  UPDATE_JOB: "update_job",
  DELETE_JOB: "delete_job",
  
  // CANDIDATES
  VIEW_CANDIDATES: "view_candidates",
  CREATE_CANDIDATE: "create_candidate",
  UPDATE_CANDIDATE: "update_candidate",
  DELETE_CANDIDATE: "delete_candidate",
  
  // PROCESSES
  VIEW_PROCESSES: "view_processes",
  CREATE_PROCESS: "create_process",
  UPDATE_PROCESS: "update_process",
  DELETE_PROCESS: "delete_process",
  
  // CLIENTS
  VIEW_CLIENTS: "view_clients",
  MANAGE_CLIENTS: "manage_clients",
  
  // SYSTEM FEATURES
  VIEW_CHAT: "view_chat",
  MANAGE_INTERNAL_HR: "manage_internal_hr",
  ONBOARDING: "onboarding",

  // TEAM MANAGEMENT (BD Lead / HH Lead)
  VIEW_TEAM_DASHBOARD: "view_team_dashboard",
  ASSIGN_JOB_FOCUS: "assign_job_focus",       // HH Lead + Admin: giao job focus cho team / bản thân

  // RESEARCH
  VIEW_RESEARCH_QUEUE: "view_research_queue", // Research + HH + HH Lead + Admin

  // MARKETING
  VIEW_MARKETING: "view_marketing",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Các vai trò chính trong hệ thống
 */
export const ROLES = {
  ADMIN: "Admin",
  BD: "BD",
  BD_LEAD: "BD Lead",
  HEADHUNTER: "Headhunter",
  HH_LEAD: "HH Lead",
  HR: "HR",
  MANAGER: "Manager",
  COMMUNITY_MANAGER: "Community Manager",
  CTV: "CTV",
  FREELANCER: "Freelancer",
  CLIENT: "Client",
  RESEARCH: "Researcher",  // Tên trong DB enum: user_role_enum
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
