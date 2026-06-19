import { toast } from 'react-hot-toast';
import type { CandidateFormData } from '../../../hooks/useCandidateForm';

/**
 * Extra data for Discord notification that can be edited during preview.
 */
export interface DiscordExtraData {
  fullName?: string;
  appliedPosition?: string;
  address?: string;
  cddCode?: string;
  expectedSalary?: string;
  desiredLocation?: string;
  startDate?: string;
  reason?: string;
  professionalSummary?: string;
}

/**
 * Sends a notification to Discord webhook when a potential candidate is added.
 */
export async function sendPotentialCandidateNotification(
  candidate: CandidateFormData, 
  cvUrl?: string | null,
  creatorName?: string,
  cddCode?: string | null,
  extraData?: DiscordExtraData
) {
  console.log('DEBUG: Inside sendPotentialCandidateNotification');
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('VITE_DISCORD_WEBHOOK_URL is not set. Skipping Discord notification.');
    return;
  }

  try {
    const payload = getDiscordPayload(candidate, cvUrl, creatorName, cddCode, extraData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
        console.log('✅ Discord notification sent successfully!');
    } else {
        console.error('❌ Failed to send Discord notification:', await response.text());
    }

  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    toast.error('Gửi thông báo Discord thất bại (nhưng ứng viên vẫn được tạo)');
  }
}

/**
 * Gets the Discord notification payload for preview or sending.
 */
export function getDiscordPayload(
  candidate: CandidateFormData, 
  cvUrl?: string | null,
  creatorName?: string,
  cddCode?: string | null,
  extraData?: DiscordExtraData
) {
  const bdRoleId = import.meta.env.VITE_DISCORD_BD_ROLE_ID;

  const data = {
    fullName: extraData?.fullName || candidate.fullName || 'N/A',
    appliedPosition: extraData?.appliedPosition || candidate.appliedPosition || 'N/A',
    address: extraData?.address || candidate.address || 'Hà Nội',
    cddCode: extraData?.cddCode || cddCode || 'N/A',
    expectedSalary: extraData?.expectedSalary || candidate.expectedSalary || 'Thỏa thuận',
    desiredLocation: extraData?.desiredLocation || 'Hà Nội',
    startDate: extraData?.startDate || 'Có thể bắt đầu ngay',
    reason: extraData?.reason || '',
    professionalSummary: extraData?.professionalSummary || candidate.professionalSummary || 'N/A'
  };

  const fields = [
    {
      name: 'Mã ứng viên',
      value: data.cddCode,
      inline: true,
    },
    {
      name: 'Tên ứng viên',
      value: data.fullName,
      inline: true,
    },
    {
      name: 'Vị trí',
      value: data.appliedPosition,
      inline: true,
    },
    {
      name: 'Địa điểm',
      value: data.address,
      inline: true,
    },
    {
      name: 'Mức lương kỳ vọng',
      value: data.expectedSalary,
      inline: true,
    },
    {
      name: '📍 Địa điểm mong muốn',
      value: data.desiredLocation,
      inline: true,
    },
    {
      name: '📌 Thời gian nhận việc',
      value: data.startDate,
      inline: false,
    }
  ];

  if (data.reason) {
    fields.push({
      name: '📌 Lý do tìm cơ hội mới',
      value: data.reason,
      inline: false,
    });
  }

  fields.push({
    name: 'Brief Summary',
    value: data.professionalSummary,
    inline: false,
  });

  if (cvUrl) {
    fields.push({
      name: 'CV Link',
      value: `[Xem CV](${cvUrl})`,
      inline: false, 
    } as any);
  }

  if (creatorName) {
    fields.push({
      name: 'Người phụ trách',
      value: creatorName,
      inline: false,
    } as any);
  }

  const mention = bdRoleId ? `<@&${bdRoleId}>` : '@BD';
  
  // Filter out invalid fields and ensure value is not empty
  const validFields = fields.filter(f => f.name && f.value).map(f => ({
    name: f.name.substring(0, 256), // Limit name length
    value: String(f.value).length > 0 ? String(f.value).substring(0, 1024) : 'N/A', // Limit value length and ensure not empty
    inline: !!f.inline
  }));

  return {
    content: `${mention} 🌟 **New Potential Candidate Added!**`,
    embeds: [
      {
        title: `🔥 ${data.fullName}`,
        color: 15844367, // Gold color (decimal)
        fields: validFields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Apex Potential Candidate System"
        }
      },
    ],
  };
}



/**
 * Sends a notification to assigned headhunter when researcher introduces candidate.
 */
export async function sendHeadhunterAssignmentNotification(
  candidate: CandidateFormData,
  jobTitle: string,
  assignedHeadhunter: {
    id: string;
    name: string;
    discordId?: string;
    email?: string;
  },
  researcherName?: string,
  cddCode?: string | null,
  candidateId?: string | null,
  researcherDiscordId?: string | null
) {
  console.log('DEBUG: Inside sendHeadhunterAssignmentNotification');
  const webhookUrl = import.meta.env.VITE_RESEARCH_TEAM_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('VITE_RESEARCH_TEAM_WEBHOOK_URL is not set. Skipping Discord notification.');
    return;
  }

  try {
    const defaultUserId =
      import.meta.env.VITE_DISCORD_RESEARCH_DEFAULT_USER_ID || '888437723461992558';

    const hhDiscord = assignedHeadhunter.discordId?.trim();
    const researchDiscord = researcherDiscordId?.trim();

    // Lọc trùng lặp ID nếu headhunter hoặc researcher chính là default user
    const allowedUserIdsSet = new Set<string>();
    if (hhDiscord) allowedUserIdsSet.add(hhDiscord);
    if (researchDiscord) allowedUserIdsSet.add(researchDiscord);
    allowedUserIdsSet.add(defaultUserId);

    const allowedUserIds = Array.from(allowedUserIdsSet);

    // Tạo chuỗi mention
    const contentParts: string[] = [];
    if (!hhDiscord) {
      contentParts.push(`@${assignedHeadhunter.name}`);
    }
    allowedUserIds.forEach(id => contentParts.push(`<@${id}>`));

    const content = `${contentParts.join(' ')} 🎯 **New Candidate Assignment!**`;

    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const queueUrl = candidateId
      ? `${baseUrl}/research/queue?candidate=${encodeURIComponent(candidateId)}`
      : `${baseUrl}/research/queue`;

    // Tạo text người xử lý hiển thị Tên (Email) nếu có
    let nguoiXuLyText = assignedHeadhunter.name;
    if (assignedHeadhunter.email) {
      nguoiXuLyText += ` (${assignedHeadhunter.email})`;
    }

    const payload: Record<string, unknown> = {
      content,
      allowed_mentions: { users: allowedUserIds },
      embeds: [
        {
          title: `🔥 ${candidate.fullName}`,
          description: `Bạn được phân công ứng viên mới từ **${researcherName || 'Researcher'}**.`,
          color: 5814783, // Blue color
          fields: [
            {
              name: '📋 Vị trí',
              value: jobTitle,
              inline: true,
            },
            {
              name: '👤 Mã ứng viên',
              value: cddCode || 'N/A',
              inline: true,
            },
            {
              name: '📧 Email',
              value: candidate.email || 'N/A',
              inline: true,
            },
            {
              name: '📍 Địa điểm',
              value: candidate.address || 'N/A',
              inline: true,
            },
            {
              name: '💰 Mức lương kỳ vọng',
              value: candidate.expectedSalary || 'Thỏa thuận',
              inline: true,
            },
            {
              name: '👤 Người xử lý',
              value: nguoiXuLyText,
              inline: true,
            },
            {
              name: '📄 CV Link',
              value: `>>> **[📋 XEM TRONG QUEUE](${queueUrl})**`,
              inline: false,
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "Apex Research Assignment System"
          }
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ Headhunter assignment notification sent successfully!');
    } else {
      console.error('❌ Failed to send headhunter assignment notification:', await response.text());
    }

  } catch (error) {
    console.error('Failed to send headhunter assignment notification:', error);
  }
}

/**
 * Sends a notification to Zalo via VPS bot when a potential candidate is added.
 */
export async function sendZaloCandidateNotification(
  candidate: CandidateFormData,
  cddCode?: string,
  customMessage?: string
) {
  let message = '';

  if (customMessage) {
    message = customMessage;
  } else {
    // 1. Chỉ strip các HTML tags đơn giản nếu nội dung là HTML từ RichTextEditor
    const stripHtml = (html: string) => {
      if (!html) return 'N/A';
      return html
        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .trim();
    };

    const summary = stripHtml(candidate.professionalSummary || '');

    // 2. Soạn nội dung theo form chuẩn
    message = `
Hồ sơ tiềm năng từ TD Consulting
Mã ứng viên: ${cddCode || 'Chưa có'}
Vị trí: ${candidate.appliedPosition || 'Chưa cập nhật'}
Địa điểm: ${candidate.address || 'Chưa cập nhật'}

Tổng quan
${summary}

Mức lương mong muốn: ${candidate.expectedSalary || 'Thỏa thuận'}

Vui lòng liên hệ TD Consulting nếu muốn kết nối có phí (headhunting) với chúng tôi qua zalo số: 0336828903
`.trim();
  }

  try {
    // 4. Gọi tới VPS Bot (Đã cập nhật HTTPS)
    console.log('🚀 Sending request to Zalo Bot...');
    const response = await fetch('https://bot.dreamjob.blog/send-zalo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'hihihi' // Khớp với SECRET_KEY trong bot.js
      },
      body: JSON.stringify({
        groupName: "TD CONSULTING TALENT POOL",
        message: message
      }),
    });
    
    if (response.ok) {
        console.log('✅ Zalo message sent to VPS queue!');
    } else {
        const errText = await response.text();
        console.error('❌ Zalo Bot Error:', errText);
    }
  } catch (error) {
    console.error('❌ Zalo connection error:', error);
  }
}
