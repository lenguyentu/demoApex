import React, { useState } from 'react';
import { ChevronRight, PenLine, History } from 'lucide-react';
import type { ClientDebtGroup, ClientDebtItem } from '../utils';

interface DebtTableProps {
  groups: ClientDebtGroup[];
  monthKeys: string[];
  loading: boolean;
  onEditItem?: (item: ClientDebtItem) => void;
  onHistoryItem?: (item: ClientDebtItem) => void;
}

export function DebtTable({ groups, monthKeys, loading, onEditItem, onHistoryItem }: DebtTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (clientId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  if (loading && groups.length === 0) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-20 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        Chưa có dữ liệu công nợ nào.
      </div>
    );
  }

  // Calculate Grand Totals
  const grandTotalIncurred = groups.reduce((sum, g) => sum + g.total_incurred_debt, 0);
  const grandTotalPaid = groups.reduce((sum, g) => sum + g.total_paid, 0);
  
  const grandTotalProjections: Record<string, { expected: number; paid: number }> = {};
  monthKeys.forEach(mKey => {
    grandTotalProjections[mKey] = groups.reduce((acc, g) => ({
      expected: acc.expected + (g.total_monthly_projections[mKey]?.expected || 0),
      paid: acc.paid + (g.total_monthly_projections[mKey]?.paid || 0)
    }), { expected: 0, paid: 0 });
  });

  // Format date: "2026-05-08" -> "08/05"
  const fmtDate = (dateStr: string) =>
    dateStr.split(' & ').map(d => d.split('-').reverse().slice(0, 2).join('/')).join(' & ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-xs text-left">
          <thead className="bg-brand-50/30">
            <tr>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-center border-b border-r border-[#ffe4e1]" style={{width: 32}}></th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 border-b border-r border-[#ffe4e1]">Tên khách hàng</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-center border-b border-r border-[#ffe4e1]" style={{width: 60}}>Số case</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-center border-b border-r border-[#ffe4e1]" style={{width: 80}}>Ngày đi làm</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-right border-b border-r border-[#ffe4e1]">Nợ phát sinh</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-right border-b border-r border-[#ffe4e1]">Đã TT</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-center border-b border-r border-[#ffe4e1]" style={{width: 120}}>Hoa hồng</th>
              
              <th colSpan={monthKeys.length * 2} className="px-2 py-2 font-bold text-gray-700 text-center border-b border-r border-[#ffe4e1]">
                Dự kiến thu công nợ theo tháng
              </th>
              
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-700 text-center border-b border-[#ffe4e1]" style={{width: 70}}>Trạng thái</th>
            </tr>
            <tr>
              {monthKeys.map(mKey => {
                const [year, month] = mKey.split('-');
                return (
                  <th key={mKey} colSpan={2} className="px-1 py-2 text-center border-b border-r border-[#ffe4e1]">
                    <div className="font-bold text-gray-700 text-[11px]">Tháng {parseInt(month)}/{year}</div>
                    <div className="flex justify-between w-full mt-0.5 text-[9px] text-gray-400 font-normal">
                      <span className="w-1/2 text-center text-red-400 font-semibold border-r border-[#ffe4e1]">Số tiền</span>
                      <span className="w-1/2 text-center">Ngày đến hạn dự kiến</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map((group) => {
              const isExpanded = expandedGroups[group.client_id];
              return (
                <React.Fragment key={group.client_id}>
                  {/* Parent Row - Client Group */}
                  {(() => {
                    const allDone = group.items.length > 0 && group.items.every(i => i.overall_status === 'Done');
                    const anyReject = group.items.some(i => i.overall_status === 'Reject');
                    const groupStatus = allDone ? 'Done' : anyReject ? 'Reject' : 'Doing';
                    return (
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer transition-colors bg-white group"
                    onClick={() => toggleGroup(group.client_id)}
                  >
                    <td className="px-2 py-3 text-center text-brand-500 border-r border-gray-100">
                      <ChevronRight 
                        size={14} 
                        className={`mx-auto transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    </td>
                    <td className="px-2 py-3 font-bold text-gray-900 border-r border-gray-100 italic text-[13px]">
                      {group.client_name}
                    </td>
                    <td className="px-2 py-3 text-center font-semibold text-gray-600 border-r border-gray-100">
                      {group.total_cases}
                    </td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">
                      {/* Empty for parent row */}
                    </td>
                    <td className={`px-2 py-3 text-right font-bold border-r border-gray-100 ${
                      groupStatus === 'Done' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {group.total_incurred_debt > 0 ? group.total_incurred_debt.toLocaleString() : 0}
                    </td>
                    <td className="px-2 py-3 text-right font-bold text-green-600 border-r border-gray-100">
                      {group.total_paid > 0 ? group.total_paid.toLocaleString() : 0}
                    </td>
                    <td className="px-2 py-3 text-center border-r border-gray-100 text-[10px]">
                      {/* Tổng hoa hồng của tất cả cases */}
                      {(() => {
                        const totalBD = group.items.reduce((s, i) => s + (i.finance?.rate_bd > 0 ? Math.round(i.incurred_debt * i.finance.rate_bd / 100 / 1.08) : 0), 0);
                        const totalHH = group.items.reduce((s, i) => {
                          if (i.finance?.rate_internal > 0 && i.finance?.candidate_type === 'Nội bộ') return s + Math.round(i.incurred_debt * i.finance.rate_internal / 100 / 1.08);
                          if (i.finance?.rate_ctv > 0) return s + Math.round(i.incurred_debt * i.finance.rate_ctv / 100 / 1.08);
                          if (i.finance?.rate_freelancer > 0) return s + i.finance.rate_freelancer;
                          if (i.finance?.rate_intern > 0) return s + i.finance.rate_intern;
                          return s;
                        }, 0);
                        const total = totalBD + totalHH;
                        return total > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-green-700 font-semibold">BD: {totalBD.toLocaleString()}</span>
                            <span className="text-amber-700 font-semibold">Rec: {totalHH.toLocaleString()}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>;
                      })()}
                    </td>
                    
                    {monthKeys.map(mKey => {
                      const proj = group.total_monthly_projections[mKey];
                      const allDoneInMonth = group.items.every(i => i.overall_status === 'Done');
                      const effectivePaid = allDoneInMonth ? proj.expected : proj.paid;
                      const percentage = proj.expected > 0 ? (effectivePaid / proj.expected) * 100 : 0;
                      return (
                        <td key={`total-${mKey}`} colSpan={2} className="px-2 py-3 text-center border-r border-gray-100 italic bg-brand-50/10">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[9px] text-gray-400 font-medium">TỔNG: {proj.expected.toLocaleString()}</div>
                            <div className="flex items-center gap-1">
                               <span className="text-green-600 font-bold">{effectivePaid.toLocaleString()}</span>
                               {proj.expected > 0 && (
                                 <span className={`text-[8px] font-black ${percentage >= 100 ? 'text-green-600' : 'text-brand-500'}`}>
                                   ({percentage.toFixed(0)}%)
                                 </span>
                               )}
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-2 py-3 text-center">
                      {groupStatus === 'Done' ? (
                        <span className="px-2 py-1 text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded tracking-wider uppercase">Done</span>
                      ) : groupStatus === 'Reject' ? (
                        <span className="px-2 py-1 text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded tracking-wider uppercase">Reject</span>
                      ) : (
                        <span className="px-2 py-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded tracking-wider uppercase">Doing</span>
                      )}
                    </td>
                  </tr>
                    );
                  })()}

                  {/* Child Rows - Candidates */}
                  {isExpanded && group.items.map(item => (
                    <tr key={item.sale_id} className="bg-gray-50/50 hover:bg-gray-100/50 transition-colors animate-fade-in-simple">
                      <td className="px-2 py-2 border-r border-gray-100"></td>
                      <td className="px-2 py-2 pl-6 border-r border-gray-100">
                        <div className="text-gray-600 font-medium truncate text-[11px]" title={item.job_title}>{item.job_title}</div>
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <div className="font-bold text-gray-900 leading-tight truncate text-[11px]" title={item.candidate_name}>
                          {item.candidate_name}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center border-r border-gray-100">
                        <span className="text-[10px] font-semibold text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-red-500 border-r border-gray-100">
                        {item.incurred_debt > 0 ? item.incurred_debt.toLocaleString() : 0}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-green-600 border-r border-gray-100">
                        {item.paid_amount > 0 ? item.paid_amount.toLocaleString() : 0}
                      </td>
                      {/* Hoa hồng */}
                      <td className="px-2 py-2 border-r border-gray-100">
                        {item.finance && (
                          <div className="flex flex-col gap-0.5 text-[10px]">
                            {/* BD luôn hiện */}
                            {item.finance.rate_bd > 0 && (
                              <div className="flex justify-between gap-1">
                                <span className="text-gray-400">BD {item.finance.rate_bd}%</span>
                                <span className="font-semibold text-green-700">{Math.round(item.incurred_debt * item.finance.rate_bd / 100 / 1.08).toLocaleString()}</span>
                              </div>
                            )}
                            {/* HH — chỉ khi Nội bộ */}
                            {item.finance.rate_internal > 0 && item.finance.candidate_type === 'Nội bộ' && (
                              <div className="flex justify-between gap-1">
                                <span className="text-gray-400">HH {item.finance.rate_internal}%</span>
                                <span className="font-semibold text-amber-700">{Math.round(item.incurred_debt * item.finance.rate_internal / 100 / 1.08).toLocaleString()}</span>
                              </div>
                            )}
                            {/* Intern cố định — chỉ khi Intern */}
                            {item.finance.rate_intern > 0 && item.finance.candidate_type === 'Intern' && (
                              <div className="flex justify-between gap-1">
                                <span className="text-gray-400">Intern cố định</span>
                                <span className="font-semibold text-purple-700">{item.finance.rate_intern.toLocaleString()}</span>
                              </div>
                            )}
                            {/* CTV % — chỉ khi CTV/Freelancer */}
                            {item.finance.rate_ctv > 0 && (item.finance.candidate_type === 'CTV' || item.finance.candidate_type === 'Freelancer') && (
                              <div className="flex justify-between gap-1">
                                <span className="text-gray-400">CTV {item.finance.rate_ctv}%</span>
                                <span className="font-semibold text-blue-700">{Math.round(item.incurred_debt * item.finance.rate_ctv / 100 / 1.08).toLocaleString()}</span>
                              </div>
                            )}
                            {/* CTV cố định — chỉ khi CTV/Freelancer */}
                            {item.finance.rate_freelancer > 0 && (item.finance.candidate_type === 'CTV' || item.finance.candidate_type === 'Freelancer') && (
                              <div className="flex justify-between gap-1">
                                <span className="text-gray-400">CTV cố định</span>
                                <span className="font-semibold text-blue-700">{item.finance.rate_freelancer.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {monthKeys.map(mKey => {
                        const projection = item.monthly_projections[mKey];
                        const isDone = item.overall_status === 'Done';
                        const remaining = (projection && !isDone)
                          ? Math.max(0, projection.expected_amount - projection.paid_amount)
                          : 0;
                        return (
                          <React.Fragment key={`child-${mKey}`}>
                            <td className="px-1 py-2 text-center border-r border-gray-100">
                              {projection && (
                                <div className="flex flex-col items-center font-bold text-[11px]">
                                  {isDone ? (
                                    <div className="text-green-600 leading-tight">✓ {projection.expected_amount.toLocaleString()}</div>
                                  ) : (
                                    <>
                                      {projection.paid_amount > 0 && <div className="text-green-600 leading-tight">{projection.paid_amount.toLocaleString()}</div>}
                                      {remaining > 0 && <div className="text-red-500 leading-tight">{remaining.toLocaleString()}</div>}
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-2 text-center text-[9px] text-gray-400 border-r border-gray-100">
                              {projection ? (
                                <span className="px-1 py-px bg-white border border-gray-100 rounded font-medium">
                                  {fmtDate(projection.expected_date)}
                                </span>
                              ) : null}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="px-2 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {item.overall_status === 'Done' ? (
                              <span className="px-2 py-1 text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded tracking-wider uppercase">Done</span>
                          ) : item.overall_status === 'Reject' ? (
                              <span className="px-2 py-1 text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded tracking-wider uppercase">Reject</span>
                          ) : item.overall_status === 'Cancel' ? (
                              <span className="px-2 py-1 text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded tracking-wider uppercase">Cancel</span>
                          ) : (
                              <span className="px-2 py-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded tracking-wider uppercase">Doing</span>
                          )}
                          <div className="flex items-center gap-0.5 mt-0.5 export-hidden">
                            <button 
                               onClick={(e) => { e.stopPropagation(); onEditItem?.(item); }}
                               className="p-1 hover:bg-brand-50 hover:text-brand-600 rounded text-gray-400 transition-colors"
                               title="Cập nhật thực thu"
                            >
                              <PenLine size={13} />
                            </button>
                            <button 
                               onClick={(e) => { e.stopPropagation(); onHistoryItem?.(item); }}
                               className="p-1 hover:bg-brand-50 hover:text-brand-600 rounded text-gray-400 transition-colors"
                               title="Xem lịch sử"
                            >
                              <History size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Footer - Grand Totals */}
          <tfoot className="bg-brand-50/30">
            <tr>
              <td colSpan={3} className="px-2 py-3 text-center font-bold text-gray-800 uppercase tracking-widest border-r border-[#ffe4e1] text-xs">
                Tổng
              </td>
              <td className="px-2 py-3 border-r border-[#ffe4e1]"></td>
              <td className="px-2 py-3 text-right font-black text-gray-900 border-r border-[#ffe4e1]">
                {grandTotalIncurred.toLocaleString()}
              </td>
              <td className="px-2 py-3 text-right font-black text-green-700 border-r border-[#ffe4e1]">
                {grandTotalPaid.toLocaleString()}
              </td>
              <td className="px-2 py-3 border-r border-[#ffe4e1]">
                {/* Tổng hoa hồng footer */}
                {(() => {
                  const allItems = groups.flatMap(g => g.items);
                  const totalBD = allItems.reduce((s, i) => s + (i.finance?.rate_bd > 0 ? Math.round(i.incurred_debt * i.finance.rate_bd / 100 / 1.08) : 0), 0);
                  const totalRec = allItems.reduce((s, i) => {
                    if (i.finance?.rate_internal > 0 && i.finance?.candidate_type === 'Nội bộ') return s + Math.round(i.incurred_debt * i.finance.rate_internal / 100 / 1.08);
                    if (i.finance?.rate_ctv > 0) return s + Math.round(i.incurred_debt * i.finance.rate_ctv / 100 / 1.08);
                    if (i.finance?.rate_freelancer > 0) return s + i.finance.rate_freelancer;
                    if (i.finance?.rate_intern > 0) return s + i.finance.rate_intern;
                    return s;
                  }, 0);
                  return (
                    <div className="flex flex-col gap-0.5 text-[10px]">
                      <span className="text-green-700 font-bold">BD: {totalBD.toLocaleString()}</span>
                      <span className="text-amber-700 font-bold">Rec: {totalRec.toLocaleString()}</span>
                    </div>
                  );
                })()}
              </td>
              
              {monthKeys.map(mKey => {
                const proj = grandTotalProjections[mKey];
                const percentage = proj.expected > 0 ? (proj.paid / proj.expected) * 100 : 0;
                
                return (
                  <td key={`grand-${mKey}`} colSpan={2} className="px-2 py-3 text-center border-r border-[#ffe4e1] min-w-[120px]">
                     <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Dự kiến thu: <span className="text-gray-900">{proj.expected.toLocaleString()}</span></div>
                        <div className="flex items-center gap-1.5">
                           <div className="text-green-700 font-black text-sm">{proj.paid.toLocaleString()}</div>
                           <div className={`px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm ${
                              percentage >= 100 ? 'bg-green-600 text-white' : 
                              percentage >= 50 ? 'bg-brand-500 text-white' : 
                              percentage > 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                           }`}>
                              {percentage.toFixed(0)}%
                           </div>
                        </div>
                        {/* Progress Bar Mini */}
                        <div className="w-full max-w-[80px] h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-500 ${percentage >= 100 ? 'bg-green-500' : 'bg-brand-500'}`} 
                              style={{ width: `${Math.min(100, percentage)}%` }}
                           />
                        </div>
                     </div>
                  </td>
                );
              })}
              
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
