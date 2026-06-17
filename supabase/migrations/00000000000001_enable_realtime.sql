-- Supabase jadvallari uchun Realtime funksiyasini yoqish

begin;

-- `supabase_realtime` publikatsiyasi (publication) agar yo'q bo'lsa yaratilmaydi (chunki u o'zi mavjud),
-- lekin biz unga kerakli jadvallarni qo'shamiz.
alter publication supabase_realtime add table public.courses;
alter publication supabase_realtime add table public.vocabularies;
alter publication supabase_realtime add table public.homeworks;
alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.course_members;
alter publication supabase_realtime add table public.homework_submissions;

commit;
