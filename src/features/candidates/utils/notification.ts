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
    toast.error('Failed to send Discord notification (but candidate was still created)');
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
    address: extraData?.address || candidate.address || 'Hanoi',
    cddCode: extraData?.cddCode || cddCode || 'N/A',
    expectedSalary: extraData?.expectedSalary || candidate.expectedSalary || 'Negotiable',
    desiredLocation: extraData?.desiredLocation || 'Hanoi',
    startDate: extraData?.startDate || 'Can start immediately',
    reason: extraData?.reason || '',
    professionalSummary: extraData?.professionalSummary || candidate.professionalSummary || 'N/A'
  };

  const fields = [
    {
      name: 'Candidate Code',
      value: data.cddCode,
      inline: true,
    },
    {
      name: 'Candidate Name',
      value: data.fullName,
      inline: true,
    },
    {
      name: 'Position',
      value: data.appliedPosition,
      inline: true,
    },
    {
      name: 'Location',
      value: data.address,
      inline: true,
    },
    {
      name: 'Expected Salary',
      value: data.expectedSalary,
      inline: true,
    },
    {
      name: '📍 Desired Location',
      value: data.desiredLocation,
      inline: true,
    },
    {
      name: '📌 Start Date',
      value: data.startDate,
      inline: false,
    }
  ];

  if (data.reason) {
    fields.push({
      name: '📌 Reason for seeking new opportunities',
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
      value: `[View CV](${cvUrl})`,
      inline: false, 
    } as any);
  }

  if (creatorName) {
    fields.push({
      name: 'Assigned to',
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
          description: `You have been assigned a new candidate from **${researcherName || 'Researcher'}**.`,
          color: 5814783, // Blue color
          fields: [
            {
              name: '📋 Position',
              value: jobTitle,
              inline: true,
            },
            {
              name: '👤 Candidate Code',
              value: cddCode || 'N/A',
              inline: true,
            },
            {
              name: '📧 Email',
              value: candidate.email || 'N/A',
              inline: true,
            },
            {
              name: '📍 Location',
              value: candidate.address || 'N/A',
              inline: true,
            },
            {
              name: '💰 Expected Salary',
              value: candidate.expectedSalary || 'Negotiable',
              inline: true,
            },
            {
              name: '👤 Assigned to',
              value: nguoiXuLyText,
              inline: true,
            },
            {
              name: '📄 CV Link',
              value: `>>> **[📋 VIEW IN QUEUE](${queueUrl})**`,
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
Potential profile from TD Consulting
Candidate Code: ${cddCode || 'N/A'}
Position: ${candidate.appliedPosition || 'Not updated'}
Location: ${candidate.address || 'Not updated'}

Overview
${summary}

Expected salary: ${candidate.expectedSalary || 'Negotiable'}

Please contact TD Consulting if you want a paid connection (headhunting) with us via Zalo: 0336828903
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
