import { supabase } from '../lib/supabase';

const GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export interface GoogleToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  email?: string;
  name?: string;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

// ─── Token storage ───────────────────────────────────────

export async function saveGoogleToken(userId: string, token: GoogleToken) {
  const { error } = await supabase.from('google_integrations').upsert({
    user_id: userId,
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    token_expires_at: token.expires_at ? new Date(token.expires_at * 1000).toISOString() : null,
    google_email: token.email || null,
    google_name: token.name || null,
    is_connected: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

export async function getGoogleToken(userId: string): Promise<GoogleToken | null> {
  const { data, error } = await supabase
    .from('google_integrations')
    .select('access_token, refresh_token, token_expires_at, google_email, google_name')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.token_expires_at ? new Date(data.token_expires_at).getTime() / 1000 : undefined,
    email: data.google_email,
    name: data.google_name,
  };
}

export async function disconnectGoogle(userId: string) {
  const { error } = await supabase
    .from('google_integrations')
    .update({ is_connected: false, access_token: null, refresh_token: null, token_expires_at: null })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// ─── Google API calls ────────────────────────────────────

async function callGoogleApi<T>(token: string, url: string, method = 'GET', body?: any): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error: ${err}`);
  }
  return res.json();
}

// Calendar
export async function createCalendarEvent(
  token: string,
  event: CalendarEvent,
  calendarId = 'primary',
): Promise<any> {
  return callGoogleApi(
    token,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    'POST',
    event,
  );
}

export async function listCalendarEvents(token: string, maxResults = 10, calendarId = 'primary'): Promise<any> {
  return callGoogleApi(
    token,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true`,
  );
}

// Docs
export async function createDocument(token: string, title: string, content?: string): Promise<any> {
  // Step 1: create empty doc
  const doc = await callGoogleApi<any>(
    token,
    'https://docs.googleapis.com/v1/documents',
    'POST',
    { title },
  );

  // Step 2: insert content if provided
  if (content && doc.documentId) {
    await callGoogleApi(
      token,
      `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
      'POST',
      {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: stripHtml(content),
            },
          },
        ],
      },
    );
  }

  return doc;
}

export function getDocumentUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
