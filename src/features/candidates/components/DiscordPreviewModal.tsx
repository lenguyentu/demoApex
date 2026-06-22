import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Edit3 } from 'lucide-react';
import type { CandidateFormData } from '../../../hooks/useCandidateForm';
import { getDiscordPayload } from '../utils/notification';
import type { DiscordExtraData } from '../utils/notification';

interface DiscordPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (extraData: DiscordExtraData) => void;
  candidate: CandidateFormData;
  cvUrl?: string | null;
  creatorName?: string;
  cddCode?: string | null;
  isSending: boolean;
}

export function DiscordPreviewModal({
  open,
  onClose,
  onConfirm,
  candidate,
  cvUrl,
  creatorName,
  cddCode,
  isSending
}: DiscordPreviewModalProps) {
  const [extraData, setExtraData] = useState<DiscordExtraData>({
    fullName: candidate.fullName || '',
    appliedPosition: candidate.appliedPosition || '',
    address: candidate.address || 'Hanoi',
    cddCode: cddCode || '',
    expectedSalary: candidate.expectedSalary || 'Negotiable during interview',
    desiredLocation: 'Hanoi',
    startDate: 'Can start immediately',
    reason: '',
    professionalSummary: candidate.professionalSummary || '',
  });

  // Sync with candidate data when modal opens
  useEffect(() => {
    if (open) {
      setExtraData({
        fullName: candidate.fullName || '',
        appliedPosition: candidate.appliedPosition || '',
        address: candidate.address || 'Hanoi',
        cddCode: cddCode || '',
        expectedSalary: candidate.expectedSalary || 'Negotiable during interview',
        desiredLocation: 'Hanoi',
        startDate: 'Can start immediately',
        reason: '',
        professionalSummary: candidate.professionalSummary || '',
      });
    }
  }, [open, candidate, cddCode]);

  if (!open) return null;

  const payload = getDiscordPayload(candidate, cvUrl, creatorName, cddCode, extraData);
  const embed = payload.embeds[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExtraData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 overflow-hidden">
      <div className="bg-[#313338] text-[#dbdee1] rounded-lg shadow-2xl w-full max-w-5xl flex flex-col md:flex-row h-[95vh] md:h-[80vh] overflow-hidden border border-white/5">
        
        {/* Left Side: Editors */}
        <div className="md:w-[35%] bg-[#2b2d31] border-r border-white/5 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-white/5 flex items-center gap-2 text-white shrink-0">
            <Edit3 size={18} className="text-brand-500" />
            <h3 className="font-bold text-sm">Edit Notification</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Candidate Code</label>
                <input
                  type="text"
                  name="cddCode"
                  value={extraData.cddCode}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Candidate Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={extraData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Position</label>
                <input
                  type="text"
                  name="appliedPosition"
                  value={extraData.appliedPosition}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={extraData.address}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Expected Salary</label>
                <input
                  type="text"
                  name="expectedSalary"
                  value={extraData.expectedSalary}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">📍 Desired Location</label>
                <input
                  type="text"
                  name="desiredLocation"
                  value={extraData.desiredLocation}
                  onChange={handleInputChange}
                  className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">📌 Start Date</label>
              <input
                type="text"
                name="startDate"
                value={extraData.startDate}
                onChange={handleInputChange}
                className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">📌 Reason for seeking new opportunities</label>
              <input
                name="reason"
                value={extraData.reason}
                onChange={handleInputChange}
                className="w-full bg-[#1e1f22] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#b5bac1] uppercase mb-1">Brief Summary (Markdown)</label>
              <textarea
                name="professionalSummary"
                value={extraData.professionalSummary}
                onChange={handleInputChange}
                rows={10}
                className="w-full bg-[#1e1f22] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-500 text-white resize-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#313338]">
          {/* Header */}
          <header className="flex items-center justify-between p-3 border-b border-white/5 bg-[#2b2d31] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#5865F2] rounded-full flex items-center justify-center shrink-0">
                <Send size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm leading-none">Discord Preview</h2>
                <p className="text-[10px] text-[#b5bac1] mt-1">Actual content when sending message</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/10 transition text-[#b5bac1] hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-[#313338]">
            <div className="flex items-start gap-2 bg-[#f0f0f0]/5 p-2 rounded text-[11px] text-[#b5bac1] border-l-4 border-amber-500">
              <AlertCircle size={14} className="shrink-0 text-amber-500 mt-0.5" />
              <p>Candidate <strong>{extraData.fullName}</strong> ({extraData.cddCode}) will be notified. Carefully check the content before sending.</p>
            </div>

            <div className="space-y-1">
              {/* Discord Message Simulation */}
              <div className="bg-[#2b2d31] p-3 rounded-md border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">Apex Bot</span>
                    <span className="bg-[#5865f2] text-white text-[9px] px-1 rounded uppercase font-bold">Bot</span>
                    <span className="text-[10px] text-[#b5bac1] ml-1">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="text-[#dbdee1] text-[13px] mb-2">{payload.content}</div>
                  
                  {/* Embed Simulation */}
                  <div className="border-l-4 border-[#f1c40f] bg-[#1e1f22] p-3 rounded-r flex flex-col gap-2 max-w-full overflow-hidden">
                    <div className="font-bold text-white text-[15px] leading-tight">{embed.title}</div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-1">
                      {embed.fields.map((field, idx) => (
                        <div key={idx} className={field.inline ? 'col-span-1' : 'col-span-2'}>
                          <div className="text-[#b5bac1] font-bold text-[10px] uppercase mb-0.5">{field.name}</div>
                          <div className="text-[#dbdee1] text-[12px] whitespace-pre-wrap wrap-break-word">{field.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] text-[#b5bac1] uppercase font-medium">{embed.footer?.text}</span>
                      <span className="text-[9px] text-[#b5bac1]">Just now</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="p-3 bg-[#2b2d31] border-t border-white/5 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#dbdee1] hover:underline"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(extraData)}
              disabled={isSending}
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded font-medium text-xs flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send to Discord
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
