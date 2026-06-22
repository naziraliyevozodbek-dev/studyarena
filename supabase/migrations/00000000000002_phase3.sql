-- 1. Add example sentences to vocabularies table
ALTER TABLE public.vocabularies
ADD COLUMN IF NOT EXISTS example_german TEXT,
ADD COLUMN IF NOT EXISTS example_uzbek TEXT;

-- 2. Create student_vocabulary_progress table
CREATE TABLE IF NOT EXISTS public.student_vocabulary_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    vocabulary_id UUID REFERENCES public.vocabularies(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('learning', 'weak', 'learned')) DEFAULT 'learning',
    mistakes_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, vocabulary_id)
);

-- 3. Create user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    words_practiced INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, date)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.student_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for student_vocabulary_progress
-- Students can view and update their own progress
CREATE POLICY "Students can view their own progress." ON public.student_vocabulary_progress
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own progress." ON public.student_vocabulary_progress
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress." ON public.student_vocabulary_progress
FOR UPDATE USING (auth.uid() = student_id);

-- Mentors can view their students' progress
CREATE POLICY "Mentors can view student progress in their courses." ON public.student_vocabulary_progress
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.vocabularies v
        JOIN public.courses c ON c.id = v.course_id
        WHERE v.id = public.student_vocabulary_progress.vocabulary_id AND c.mentor_id = auth.uid()
    )
);

-- 6. RLS Policies for user_activity_logs
-- Students can view and update their own logs
CREATE POLICY "Students can view their own activity logs." ON public.user_activity_logs
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own activity logs." ON public.user_activity_logs
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own activity logs." ON public.user_activity_logs
FOR UPDATE USING (auth.uid() = student_id);

-- Mentors can view their students' activity logs
CREATE POLICY "Mentors can view student activity in their courses." ON public.user_activity_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.course_members cm
        JOIN public.courses c ON c.id = cm.course_id
        WHERE cm.student_id = public.user_activity_logs.student_id AND c.mentor_id = auth.uid()
    )
);
