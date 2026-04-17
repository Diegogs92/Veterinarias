import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://gjhqhflxbdaavkpbvepp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHFoZmx4YmRhYXZrcGJ2ZXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODMxOTksImV4cCI6MjA5MTk1OTE5OX0.6u59SeL4aT6p-J-UPt-b8F0XIu7KXPBBb6WeVupVyNI'
)
