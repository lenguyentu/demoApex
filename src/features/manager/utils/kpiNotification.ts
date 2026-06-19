import { supabase } from '../../../lib/supabase';

export interface KPIDailyNotificationData {
  reporterUserId: string;
  reporterName: string;
  reporterEmail?: string;
  reporterDiscordId?: string | null;
  date: string;
  dateLabel: string;
  savedAt: Date;
  approaches: number;
  cvToDb: number;
  cvToClient: number;
  setupInterview: number;
  actualInterview: number;
  offer: number;
  placement: number;
  note?: string | null;
}

function formatSavedTimeVN(date: Date): string {
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

async function resolveReporterDiscordId(
  userId: string,
  provided?: string | null
): Promise<string | null> {
  const trimmed = provided?.trim();
  if (trimmed) return trimmed;

  const { data, error } = await supabase
    .from('profiles')
    .select('discord_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Could not fetch discord_id from profiles:', error.message);
    return null;
  }

  return data?.discord_id?.trim() || null;
}

/**
 * Builds Discord webhook payload for daily KPI report.
 */
export function getKPIDailyPayload(
  data: KPIDailyNotificationData,
  reporterDiscordId: string | null
) {
  const savedTime = formatSavedTimeVN(data.savedAt);
  const reporterDisplay = data.reporterEmail
    ? `${data.reporterName} (${data.reporterEmail})`
    : data.reporterName;

  const mention = reporterDiscordId ? `<@${reporterDiscordId}>` : `@${data.reporterName}`;

  const metricsBlock = [
    `**Approaches:** ${data.approaches}`,
    `**CV to Database:** ${data.cvToDb}`,
    `**CV to Client:** ${data.cvToClient}`,
    `**Set up Interview:** ${data.setupInterview}`,
    `**Actual Interview:** ${data.actualInterview}`,
    `**Offer:** ${data.offer}`,
    `**Placement:** ${data.placement}`,
  ].join('\n');

  const fields: { name: string; value: string; inline: boolean }[] = [
    {
      name: 'Người báo cáo',
      value: reporterDisplay,
      inline: false,
    },
    {
      name: 'Ngày',
      value: data.dateLabel,
      inline: true,
    },
    {
      name: 'Khung tính',
      value: `00:00 → **${savedTime}** (GMT+7)`,
      inline: true,
    },
    {
      name: 'Chỉ số hôm nay',
      value: metricsBlock,
      inline: false,
    },
  ];

  if (data.note?.trim()) {
    fields.push({
      name: '📝 Ghi chú',
      value: data.note.trim().substring(0, 1024),
      inline: false,
    });
  }

  const validFields = fields.map((f) => ({
    name: f.name.substring(0, 256),
    value: String(f.value).substring(0, 1024) || '—',
    inline: f.inline,
  }));

  const payload: Record<string, unknown> = {
    content: `${mention} **${data.reporterName}** report daily`,
    embeds: [
      {
        title: `KPI Daily — ${data.reporterName}`,
        description: `Số liệu từ **00:00** đến **${savedTime}** , ngày **${data.date}**.`,
        color: 5763719,
        fields: validFields,
        timestamp: data.savedAt.toISOString(),
        footer: { text: 'Apex KPI Daily Report' },
      },
    ],
  };

  if (reporterDiscordId) {
    payload.allowed_mentions = { users: [reporterDiscordId] };
  }

  return payload;
}

/**
 * Sends daily KPI report to Discord when user saves KPI for today.
 */
export async function sendKPIdailyNotification(data: KPIDailyNotificationData) {
  const webhookUrl = import.meta.env.VITE_DISCORD_KPI_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('VITE_DISCORD_KPI_WEBHOOK_URL is not set. Skipping KPI Discord notification.');
    return;
  }

  try {
    const reporterDiscordId = await resolveReporterDiscordId(
      data.reporterUserId,
      data.reporterDiscordId
    );
    const payload = getKPIDailyPayload(data, reporterDiscordId);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ KPI daily Discord notification sent!');
    } else {
      console.error('❌ KPI Discord failed:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send KPI daily notification:', error);
  }
}
