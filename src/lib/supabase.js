import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://gjhqhflxbdaavkpbvepp.supabase.co'
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHFoZmx4YmRhYXZrcGJ2ZXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODMxOTksImV4cCI6MjA5MTk1OTE5OX0.6u59SeL4aT6p-J-UPt-b8F0XIu7KXPBBb6WeVupVyNI'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHFoZmx4YmRhYXZrcGJ2ZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM4MzE5OSwiZXhwIjoyMDkxOTU5MTk5fQ.KWBBqleKfkEmUBzobClCU-y9snOQ54VgqBkt2vlTGl0'

// Client normal — para operaciones autenticadas de usuario
export const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Cliente admin — para gestión de usuarios (crear/eliminar cuentas de Auth)
// Solo se usa desde la sección de Usuarios con rol owner/developer
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
