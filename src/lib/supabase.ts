import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Word {
  id: string;
  user_id: string;
  original_word: string;
  translation: string;
  source_language: string;
  target_language: string;
  language_code?: string;
  audio_url?: string;
  created_at: string;
}

export interface LearningSession {
  id: string;
  user_id: string;
  word_ids: string[];
  session_type: 'study' | 'test';
  completed: boolean;
  created_at: string;
}

export interface TestResult {
  id: string;
  session_id: string;
  word_id: string;
  test_type: 'listen_write' | 'read_speak' | 'recognition';
  correct: boolean;
  user_answer?: string;
  created_at: string;
}
