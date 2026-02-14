import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to default values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zinzncigwjiwahcyfwbi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbnpuY2lnd2ppd2FoY3lmd2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzgyOTAsImV4cCI6MjA2ODk1NDI5MH0.xr3Pe3CM4WOYms9IbrwkEL77Zp8X4ddvSm2XBGaVr0o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Device {
  id: string;
  device_code: string;
  device_name: string;
  user_id: string | null;
  is_online: boolean;
  last_seen: string;
  wifi_ssid?: string;
  ip_address?: string;
  mac_address?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  user_id: string;
  title: string;
  content_type: 'text' | 'image' | 'video';
  text_content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceContent {
  id: string;
  device_id: string;
  content_id: string;
  display_order: number;
  is_active: boolean;
  scheduled_start?: string;
  scheduled_end?: string;
  created_at: string;
  content?: Content;
}