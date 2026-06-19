import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ReactDOM from 'react-dom';
import type { UserRole } from '../../auth/types';
import type { ManageUser, ProfilePosition } from '../types';
import { User, Mail, Calendar, Check, Eye, Pencil, Briefcase, X, Clock, XCircle, Ban, CheckCircle, Users } from 'lucide-react';
import { type DateRange } from '../../../components/DateRangePicker';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { UserDetailModal } from '../UserDetailModal';
import { AddUserModal } from '../AddUserModal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store';

// Shared Resources
import { userApi } from '../api';
import { useUserStatus, useUserProfiles, useUsersList, useAssignedHRs } from '../hooks';
import { ROLE_BADGE_CLASSES, ROLE_DISPLAY_NAMES } from '../constants';

// Components
import { UserHeader } from '../components/UserHeader';
import { UserFilterBar } from '../components/UserFilterBar';
import { StatusBadge } from '../components/StatusBadge';

export const ManageUserTab = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'Admin';
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole | 'All'>('All');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [userToApprove, setUserToApprove] = useState<ManageUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<ManageUser | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<ManageUser | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<ManageUser | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState<ManageUser | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [expModalData, setExpModalData] = useState<{ userName: string; positions: string[]; experience?: string } | null>(null);
  const [teamLeadForAssign, setTeamLeadForAssign] = useState<ManageUser | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamCandidates, setTeamCandidates] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  // Custom Hooks
  const { pendingCount } = useUserStatus();

  const currentFilters = useMemo(() => ({
    activeTab,
    selectedRole,
    search: search.trim(),
    dateFrom: dateRange.from?.toISOString(),
    dateTo: dateRange.to?.toISOString(),
    managedById: selectedLeadId,
  }), [activeTab, selectedRole, search, dateRange, selectedLeadId]);

  const {
    data: users,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
    totalCount,
    refresh
  } = useUsersList(currentFilters);

  const userIds = users.map(u => u.id);
  const { data: profilesData } = useUserProfiles(userIds);
  const hrIds = useMemo(() => users.map(u => u.assigned_hr_id).filter(Boolean) as string[], [users]);
  const { data: hrsData } = useAssignedHRs(hrIds);
  const [leadOptions, setLeadOptions] = useState<Array<{ id: string; full_name: string | null; email: string | null; role?: string | null }>>([]);

  useEffect(() => {
    const loadLeads = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('role', ['HH Lead', 'BD Lead'])
        .eq('is_active', true)
        .order('full_name');
      setLeadOptions(data || []);
    };
    loadLeads();
  }, []);

  const usersWithProfiles = useMemo(() => {
    if (!profilesData && !hrsData) return users;
    const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
    const hrMap = new Map((hrsData || []).map((h: any) => [h.id, h]));
    return users.map(user => ({
      ...user,
      profile: profileMap.get(user.id) || null,
      assigned_hr: user.assigned_hr_id ? (hrMap.get(user.assigned_hr_id) || null) : null,
    }));
  }, [users, profilesData, hrsData]);

  const handleApproveUser = async () => {
    if (!userToApprove) return;
    setIsApproving(true);
    try {
      await userApi.activateUser(userToApprove.id);
      toast.success(`Đã duyệt tài khoản ${userToApprove.full_name || userToApprove.email} thành công!`);

      if (userToApprove.email) {
        try {
          await userApi.sendApprovalEmail(userToApprove.email, userToApprove.full_name || userToApprove.email);
          toast.success('Đã gửi email thông báo cho người dùng');
        } catch (emailErr) {
          console.error('Lỗi gửi email:', emailErr);
          toast.error('Duyệt thành công nhưng lỗi gửi email');
        }
      }

      refresh();
      queryClient.invalidateQueries({ queryKey: ['users', 'pending-count'] });
    } catch (err: any) {
      console.error('Error approving user:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi duyệt tài khoản.');
    } finally {
      setIsApproving(false);
      setUserToApprove(null);
    }
  };

  const handleRejectUser = async () => {
    if (!userToReject) return;
    setIsRejecting(true);
    try {
      await userApi.rejectUser(userToReject.id);
      toast.success(`Đã từ chối tài khoản ${userToReject.full_name || userToReject.email} thành công!`);
      refresh();
      queryClient.invalidateQueries({ queryKey: ['users', 'pending-count'] });
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi từ chối tài khoản.');
    } finally {
      setIsRejecting(false);
      setUserToReject(null);
    }
  };

  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;
    setIsDeactivating(true);
    try {
      await userApi.deactivateUser(userToDeactivate.id);
      toast.success(`Đã vô hiệu hóa tài khoản ${userToDeactivate.full_name || userToDeactivate.email} thành công!`);
      refresh();
    } catch (err: any) {
      console.error('Error deactivating user:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi vô hiệu hóa tài khoản.');
    } finally {
      setIsDeactivating(false);
      setUserToDeactivate(null);
    }
  };

  const handleReactivateUser = async () => {
    if (!userToReactivate) return;
    setIsReactivating(true);
    try {
      await userApi.reactivateUser(userToReactivate.id);
      toast.success(`Đã kích hoạt lại tài khoản ${userToReactivate.full_name || userToReactivate.email} thành công!`);
      refresh();
    } catch (err: any) {
      console.error('Error reactivating user:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi kích hoạt lại tài khoản.');
    } finally {
      setIsReactivating(false);
      setUserToReactivate(null);
    }
  };

  const handleOpenTeamAssign = async (leadUser: ManageUser) => {
    setTeamLeadForAssign(leadUser);
    setTeamSearch('');
    setIsLoadingTeamData(true);
    const memberRole = leadUser.role === 'BD Lead' ? 'BD' : 'Headhunter';

    try {
      const [allHeadhuntersRes, currentTeamRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', memberRole)
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('users')
          .select('id')
          .eq('role', memberRole)
          .eq('managed_by_id', leadUser.id),
      ]);

      if (allHeadhuntersRes.error) throw allHeadhuntersRes.error;
      if (currentTeamRes.error) throw currentTeamRes.error;

      setTeamCandidates(allHeadhuntersRes.data || []);
      setSelectedTeamMemberIds((currentTeamRes.data || []).map((u) => u.id));
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu gán team');
      setTeamLeadForAssign(null);
    } finally {
      setIsLoadingTeamData(false);
    }
  };

  const handleCloseTeamAssign = () => {
    setTeamLeadForAssign(null);
    setTeamSearch('');
    setTeamCandidates([]);
    setSelectedTeamMemberIds([]);
  };

  const handleToggleTeamMember = (userId: string) => {
    setSelectedTeamMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveTeamAssign = async () => {
    if (!teamLeadForAssign) return;
    setIsSavingTeam(true);
    const memberRole = teamLeadForAssign.role === 'BD Lead' ? 'BD' : 'Headhunter';
    try {
      const clearRes = await supabase
        .from('users')
        .update({ managed_by_id: null })
        .eq('role', memberRole)
        .eq('managed_by_id', teamLeadForAssign.id);
      if (clearRes.error) throw clearRes.error;

      if (selectedTeamMemberIds.length > 0) {
        const assignRes = await supabase
          .from('users')
          .update({ managed_by_id: teamLeadForAssign.id })
          .in('id', selectedTeamMemberIds);
        if (assignRes.error) throw assignRes.error;
      }

      toast.success(`Đã cập nhật team cho ${teamLeadForAssign.full_name || teamLeadForAssign.email}`);
      refresh();
      handleCloseTeamAssign();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu gán team');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const filteredTeamCandidates = useMemo(() => {
    const keyword = teamSearch.trim().toLowerCase();
    if (!keyword) return teamCandidates;
    return teamCandidates.filter((u) =>
      (u.full_name || '').toLowerCase().includes(keyword) ||
      (u.email || '').toLowerCase().includes(keyword)
    );
  }, [teamCandidates, teamSearch]);

  return (
    <div className="space-y-6 animate-fade-in pb-10 px-6">
      <UserHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingCount={pendingCount} 
        onAddUser={() => setIsAddUserOpen(true)} 
      />

      <UserFilterBar 
        search={search}
        setSearch={setSearch}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        selectedLeadId={selectedLeadId}
        setSelectedLeadId={setSelectedLeadId}
        leadOptions={leadOptions}
        showLeadFilter={isAdmin}
        dateRange={dateRange}
        setDateRange={setDateRange}
        totalCount={totalCount}
        activeTab={activeTab}
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading && users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách người dùng...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <p>Không tìm thấy người dùng nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium tracking-wider">
                  <th className="px-4 py-4 min-w-[280px]">Người dùng</th>
                  <th className="px-4 py-4">Vai trò</th>
                  {selectedRole === 'Client' && (
                    <th className="px-4 py-4 hidden md:table-cell">Khách hàng</th>
                  )}
                  <th className="px-4 py-4 hidden lg:table-cell">Người tuyển</th>
                  <th className="px-4 py-4 hidden xl:table-cell">Exp</th>
                  <th className="px-4 py-4 hidden sm:table-cell">Trạng thái</th>
                  <th className="px-4 py-4 hidden md:table-cell">Ngày đăng ký</th>
                  <th className="px-4 py-4 text-right sticky right-0 bg-gray-50 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] z-10">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersWithProfiles.map((user) => {
                  const positions = (user.profile?.positions_confident || []) as ProfilePosition[];
                  const experienceInfo = positions.find((p) => p.startsWith('Kinh nghiệm:'));
                  const validPositions = positions.filter((p) => !p.startsWith('Kinh nghiệm:'));
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-brand-600 font-bold border border-blue-100">
                            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                            <div className="text-xs text-gray-500 flex items-start gap-1.5 mt-0.5">
                              <Mail size={12} className="shrink-0 mt-0.5" />
                              <span className="break-all leading-snug">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_BADGE_CLASSES[user.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {ROLE_DISPLAY_NAMES[user.role] || user.role}
                        </span>
                      </td>
                      {selectedRole === 'Client' && (
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="font-medium text-gray-900 max-w-[200px] truncate" title={user.client?.client_name}>
                            {user.client?.client_name || '---'}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {user.assigned_hr ? (
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{user.assigned_hr.full_name || 'No Name'}</div>
                            <div className="text-xs text-gray-500">{user.assigned_hr.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">---</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="flex flex-col gap-1.5">
                          {validPositions.length > 0 ? (
                            <button
                              onClick={() => setExpModalData({
                                userName: user.full_name || user.email || 'User',
                                positions: validPositions,
                                experience: experienceInfo
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer w-fit"
                            >
                              <Briefcase size={12} />
                              <span className="font-semibold">{validPositions.length}</span>
                              <span className="text-emerald-600">vị trí</span>
                            </button>
                          ) : (
                            !experienceInfo && <span className="text-gray-400 text-xs">---</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <StatusBadge status={user.status as string} />
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '---'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-gray-50/80 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] z-10 transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setUserToApprove(user)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Duyệt tài khoản"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setUserToReject(user)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Từ chối tài khoản"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {(user.status === 'active' || user.status === 'approved') && user.is_active && (
                            <button
                              onClick={() => setUserToDeactivate(user)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Vô hiệu hóa tài khoản (chỉ Admin)"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                          {user.status === 'rejected' && !user.is_active && (
                            <button
                              onClick={() => setUserToReactivate(user)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Kích hoạt lại tài khoản (chỉ Admin)"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUserForDetail(user);
                              setDetailMode('view');
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForDetail(user);
                              setDetailMode('edit');
                            }}
                            className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          {(user.role === 'HH Lead' || user.role === 'BD Lead') && (
                            <button
                              onClick={() => handleOpenTeamAssign(user)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Gán team cho Lead"
                            >
                              <Users size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <LoadMoreButton
              onClick={loadMore}
              loading={isLoading}
              hasMore={hasMore}
              loadedCount={users.length}
              totalCount={totalCount ?? undefined}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!userToApprove}
        onClose={() => setUserToApprove(null)}
        onConfirm={handleApproveUser}
        title="Duyệt tài khoản"
        message={`Bạn có chắc chắn muốn duyệt tài khoản "${userToApprove?.full_name || userToApprove?.email}"? Tài khoản sẽ được kích hoạt và có thể đăng nhập vào hệ thống.`}
        confirmText="Duyệt"
        cancelText="Hủy"
        variant="success"
        isLoading={isApproving}
      />

      <ConfirmModal
        open={!!userToReject}
        onClose={() => setUserToReject(null)}
        onConfirm={handleRejectUser}
        title="Từ chối tài khoản"
        message={`Bạn có chắc chắn muốn từ chối tài khoản "${userToReject?.full_name || userToReject?.email}"? Tài khoản này sẽ không được kích hoạt.`}
        confirmText="Từ chối"
        cancelText="Hủy"
        variant="danger"
        isLoading={isRejecting}
      />

      <ConfirmModal
        open={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
        title="Vô hiệu hóa tài khoản"
        message={`Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${userToDeactivate?.full_name || userToDeactivate?.email}"? Người dùng này sẽ không thể đăng nhập vào hệ thống. Chỉ Admin mới có quyền thực hiện thao tác này.`}
        confirmText="Vô hiệu hóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeactivating}
      />

      <ConfirmModal
        open={!!userToReactivate}
        onClose={() => setUserToReactivate(null)}
        onConfirm={handleReactivateUser}
        title="Kích hoạt lại tài khoản"
        message={`Bạn có chắc chắn muốn kích hoạt lại tài khoản "${userToReactivate?.full_name || userToReactivate?.email}"? Người dùng này sẽ có thể đăng nhập vào hệ thống trở lại.`}
        confirmText="Kích hoạt lại"
        cancelText="Hủy"
        variant="success"
        isLoading={isReactivating}
      />

      <UserDetailModal
        userId={selectedUserForDetail?.id || null}
        mode={detailMode}
        onClose={() => setSelectedUserForDetail(null)}
      />

      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={() => {
          refresh();
        }}
      />

      {expModalData && ReactDOM.createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Briefcase className="text-emerald-600" size={20} />
                <h3 className="font-semibold text-gray-900">Kinh nghiệm & Vị trí</h3>
              </div>
              <button
                onClick={() => setExpModalData(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-gray-700">{expModalData.userName}</span> :
              </p>
              <div className="space-y-4">
                {expModalData.experience && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mb-1 flex items-center gap-1">
                      <Clock size={12} />
                      Mức kinh nghiệm
                    </p>
                    <p className="text-sm font-bold text-amber-900">
                      {expModalData.experience.replace('Kinh nghiệm: ', '').replace('Kinh nghiệm:', '')}
                    </p>
                  </div>
                )}
                
                {expModalData.positions.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mb-2 flex items-center gap-1">
                      <Briefcase size={12} />
                      Vị trí chuyên môn ({expModalData.positions.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {expModalData.positions.map((pos, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          {pos}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => setExpModalData(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {teamLeadForAssign && ReactDOM.createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Gán team cho Lead</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {teamLeadForAssign.full_name || teamLeadForAssign.email}
                </p>
              </div>
              <button
                onClick={handleCloseTeamAssign}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder={teamLeadForAssign.role === 'BD Lead' ? 'Tìm BD theo tên/email...' : 'Tìm Headhunter theo tên/email...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                {isLoadingTeamData ? (
                  <div className="p-4 text-center text-sm text-gray-500">Đang tải danh sách...</div>
                ) : filteredTeamCandidates.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Không có thành viên phù hợp</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredTeamCandidates.map((member) => (
                      <label key={member.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeamMemberIds.includes(member.id)}
                          onChange={() => handleToggleTeamMember(member.id)}
                          className="accent-brand-500"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500 truncate">{member.email || 'No Email'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Đã chọn {selectedTeamMemberIds.length} thành viên.</p>
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-gray-100">
              <button
                onClick={handleCloseTeamAssign}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTeamAssign}
                disabled={isSavingTeam}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
              >
                {isSavingTeam ? 'Đang lưu...' : 'Lưu team'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
