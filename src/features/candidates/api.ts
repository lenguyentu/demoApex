import { supabase } from '../../lib/supabase';
import type { Candidate, CandidateFormData, DatabaseCandidate } from './types';

export interface GetCandidatesParams {
  userId?: string;
  search?: string;
  position?: string;
  cddCode?: string;
  isPotential?: boolean;
}

// ============================================
// MY CANDIDATES (bảng candidates, owner_id = current user)
// Note: List uses useCursorPagination hook directly in CandidatesPage
// ============================================

/**
 * Lấy chi tiết 1 candidate
 */
export async function getCandidateById(id: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Candidate;
}

/**
 * Tạo mới Candidate
 */
export async function createCandidate(
  payload: CandidateFormData,
  userId: string
) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      ...payload,
      owner_id: userId,
      created_by_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Candidate;
}

/**
 * Cập nhật Candidate
 */
export async function updateCandidate(
  id: string,
  payload: Partial<CandidateFormData>,
  userId: string
) {
  const { data, error } = await supabase
    .from('candidates')
    .update({
      ...payload,
      updated_by_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Candidate;
}

/**
 * Xóa Candidate
 */
export async function deleteCandidate(id: string) {
  const { error } = await supabase.from('candidates').delete().eq('id', id);

  if (error) throw error;
  return true;
}

// ============================================
// DATABASE CANDIDATES (bảng database_candidates)
// Note: List uses useCursorPagination hook directly in CandidatesPage
// ============================================

/**
 * Lấy chi tiết 1 Database Candidate
 */
export async function getDatabaseCandidateById(id: string) {
  const { data, error } = await supabase
    .from('database_candidates')
    .select(`
      id, name, email, phone, photo_url, gender, date_of_birth, visa_status, ic_passport_no,
      caution, linkedin, facebook, address, phase, phase_date, phase_memo, cdd_rank, entry_route,
      preferred_industry, preferred_job, expected_monthly_salary, expected_annual_salary,
      preferred_location, preferred_mrt, notice_period, employment_start_date, employment_type,
      experienced_industry, experienced_job, professional_summary, professional_history,
      current_employment_status, current_monthly_salary, current_salary_allowance,
      highest_education, course_training, education_details, english_level, other_languages,
      cv_link, location, applied_position, major, school_name, education_period, gpa,
      professional_certifications, technical_skills, soft_skills, career_goals, key_strengths,
      evaluation_file_path, cdd_code, is_potential, created_at, updated_at, 
      current_salary_normalized_vnd, expected_salary_normalized_vnd
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DatabaseCandidate;
}

/**
 * Xóa Database Candidate
 */
export async function deleteDatabaseCandidate(id: string) {
  const { error } = await supabase.from('database_candidates').delete().eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Cập nhật Database Candidate
 */
export async function updateDatabaseCandidate(
  id: string,
  payload: Partial<CandidateFormData>,
  _userId: string
) {
  const { data, error } = await supabase
    .from('database_candidates')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DatabaseCandidate;
}

/**
 * Hàm chung để áp dụng các bộ lọc vào query ứng viên
 */
export const getCandidatesQuery = (
  baseQuery: any,
  params: GetCandidatesParams
) => {
  let query = baseQuery;

  if (params.userId) {
    query = query.eq('owner_id', params.userId);
  }

  if (params.search) {
    // Tìm kiếm mờ trên nhiều trường
    query = query.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%,cdd_code.ilike.%${params.search}%`
    );
  }

  if (params.position) {
    query = query.ilike('applied_position', `%${params.position}%`);
  }

  if (params.cddCode) {
    query = query.eq('cdd_code', params.cddCode.trim());
  }

  if (params.isPotential !== undefined) {
    query = query.eq('is_potential', params.isPotential);
  }

  return query;
};
