// Supabase Configuration
// Replace these with your actual Supabase project credentials

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
  // Check if Supabase SDK is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase SDK not loaded. Make sure to include the Supabase script in HTML.');
    return null;
  }

  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || window.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Falling back to localStorage.');
    return null;
  }

  supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Check if Supabase is available, fallback to localStorage
function isSupabaseAvailable() {
  return supabaseClient !== null;
}

