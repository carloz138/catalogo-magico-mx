-- Enable Row Level Security on user_statistics table
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view only their own statistics
CREATE POLICY "Users can view own statistics" 
ON public.user_statistics 
FOR SELECT 
USING (auth.uid() = id OR auth.email() = email);

-- Create policy for users to insert their own statistics
CREATE POLICY "Users can insert own statistics" 
ON public.user_statistics 
FOR INSERT 
WITH CHECK (auth.uid() = id OR auth.email() = email);

-- Create policy for users to update their own statistics
CREATE POLICY "Users can update own statistics" 
ON public.user_statistics 
FOR UPDATE 
USING (auth.uid() = id OR auth.email() = email);

-- Create policy for users to delete their own statistics
CREATE POLICY "Users can delete own statistics" 
ON public.user_statistics 
FOR DELETE 
USING (auth.uid() = id OR auth.email() = email);