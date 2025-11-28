-- Create custom user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
                                               id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
                                               username TEXT UNIQUE,
                                               full_name TEXT,
                                               avatar_url TEXT,
                                               bio TEXT,
                                               website TEXT,
                                               created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
                                      USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
                                             USING (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
INSERT INTO public.profiles (id, full_name, avatar_url)
VALUES (
           new.id,
           new.raw_user_meta_data->>'full_name',
           new.raw_user_meta_data->>'avatar_url'
       );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();