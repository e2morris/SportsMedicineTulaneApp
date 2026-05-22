// Database Adapter - Abstracts localStorage vs Supabase
// This allows the app to work with either storage method

// Use the STORAGE_KEY constant from script.js if available, or define it
const STORAGE_KEY = typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : "at_appointments";

// Initialize on load
let useDatabase = false;
let supabase = null;

// Check if we should use Supabase or localStorage
async function initDatabase() {
  // Try to initialize Supabase
  if (typeof window.supabase !== 'undefined') {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
                       window.__SUPABASE_URL__ || 
                       '';
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                       window.__SUPABASE_ANON_KEY || 
                       '';
    
    if (supabaseUrl && supabaseKey) {
      try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        // Test connection
        const { data, error } = await supabase.from('appointments').select('id').limit(1);
        if (!error) {
          useDatabase = true;
          console.log('✅ Connected to Supabase database');
          return;
        }
      } catch (err) {
        console.warn('Supabase connection failed, using localStorage:', err);
      }
    }
  }
  
  console.log('📦 Using localStorage for data storage');
  useDatabase = false;
}

// Get all appointments
async function getAppointments() {
  if (useDatabase && supabase) {
    try {
      // Use the simplified appointments_simple table
      const { data, error } = await supabase
        .from('appointments_simple')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // Transform from database format to app format
      return (data || []).map(transformFromDB);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Fallback to localStorage on error
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

// Save appointments (replace all)
// Note: This is less efficient - prefer using addAppointment/updateAppointment/deleteAppointment
async function saveAppointments(appointments) {
  if (useDatabase && supabase) {
    try {
      // Get all existing appointments
      const { data: existing } = await supabase
        .from('appointments_simple')
        .select('id');
      
      const existingIds = new Set((existing || []).map(e => e.id));
      
      // Delete appointments that are no longer in the list
      const currentIds = new Set(appointments.map(a => a.id));
      const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
      
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('appointments_simple')
          .delete()
          .in('id', toDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // Upsert all appointments (insert or update)
      const dbAppointments = appointments.map(transformToDB);
      const { error } = await supabase
        .from('appointments_simple')
        .upsert(dbAppointments, { onConflict: 'id' });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving appointments:', error);
      // Fallback to localStorage on error
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
      return false;
    }
  } else {
    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    return true;
  }
}

// Add a single appointment
async function addAppointment(appointment) {
  if (useDatabase && supabase) {
    try {
      const dbFormat = transformToDB(appointment);
      const { data, error } = await supabase
        .from('appointments_simple')
        .insert(dbFormat)
        .select()
        .single();
      
      if (error) {
        // Check if it's a conflict error
        if (error.message && error.message.includes('already booked')) {
          throw new Error('This time slot is already booked. Please select a different time.');
        }
        throw error;
      }
      return transformFromDB(data);
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  } else {
    const appointments = await getAppointments();
    appointments.push(appointment);
    await saveAppointments(appointments);
    return appointment;
  }
}

// Update an appointment
async function updateAppointment(id, updates) {
  if (useDatabase && supabase) {
    try {
      // Get existing appointment first
      const { data: existing } = await supabase
        .from('appointments_simple')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!existing) {
        throw new Error('Appointment not found');
      }
      
      // Merge updates with existing data
      const updated = { ...transformFromDB(existing), ...updates };
      const dbFormat = transformToDB(updated);
      
      const { data, error } = await supabase
        .from('appointments_simple')
        .update(dbFormat)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return transformFromDB(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  } else {
    const appointments = await getAppointments();
    const index = appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...updates };
      await saveAppointments(appointments);
      return appointments[index];
    }
    return null;
  }
}

// Delete an appointment
async function deleteAppointment(id) {
  if (useDatabase && supabase) {
    try {
      const { error } = await supabase
        .from('appointments_simple')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  } else {
    const appointments = await getAppointments();
    const filtered = appointments.filter(apt => apt.id !== id);
    await saveAppointments(filtered);
    return true;
  }
}

// Transform app format to database format
function transformToDB(appointment) {
  return {
    id: appointment.id,
    name: appointment.name || `${appointment.firstName} ${appointment.lastName}`,
    first_name: appointment.firstName || appointment.name?.split(' ')[0] || '',
    last_name: appointment.lastName || appointment.name?.split(' ').slice(1).join(' ') || '',
    email: appointment.email,
    phone: appointment.phone || null,
    date: appointment.date,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    duration: appointment.duration || null,
    reason: appointment.reason || null,
    service_name: appointment.serviceName || null,
    notes: appointment.notes || null,
    status: appointment.status || 'booked',
    cancel_token: appointment.cancelToken || (typeof generateId === 'function' ? generateId() : Date.now().toString(36)),
    metadata: {}
  };
}

// Transform database format to app format
function transformFromDB(dbAppointment) {
  return {
    id: dbAppointment.id,
    name: dbAppointment.name,
    firstName: dbAppointment.first_name || dbAppointment.name?.split(' ')[0] || '',
    lastName: dbAppointment.last_name || dbAppointment.name?.split(' ').slice(1).join(' ') || '',
    email: dbAppointment.email,
    phone: dbAppointment.phone || '',
    date: dbAppointment.date,
    startTime: dbAppointment.start_time,
    endTime: dbAppointment.end_time,
    duration: dbAppointment.duration || calculateDuration(
      new Date(`${dbAppointment.date}T${dbAppointment.start_time}`),
      new Date(`${dbAppointment.date}T${dbAppointment.end_time}`)
    ),
    reason: dbAppointment.reason || '',
    serviceName: dbAppointment.service_name || '',
    notes: dbAppointment.notes || '',
    status: dbAppointment.status || 'booked',
    cancelToken: dbAppointment.cancel_token || (typeof generateId === 'function' ? generateId() : Date.now().toString(36)),
    createdAt: dbAppointment.created_at || new Date().toISOString(),
  };
}

function calculateDuration(start, end) {
  return Math.round((end - start) / (1000 * 60)); // minutes
}

// Initialize on page load (if DOM already loaded, run immediately)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDatabase);
} else {
  initDatabase();
}

