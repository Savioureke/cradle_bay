import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zhyxmgpsqzidwfconpsu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeXhtZ3BzcXppZHdmY29ucHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDQ4ODksImV4cCI6MjEwNjAyMDg4OX0.0qFZEA30qHV5R6LUPtYoj2n7ehlIMVvQlOvA3ZVvYt0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
