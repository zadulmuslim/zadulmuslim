-- Zadulmuslim (যাদুল মুসলিম) — reference categories from the approved design.
insert into public.article_categories (slug, name_bn, description_bn, sort_order) values
  ('aqidah',       'আকিদা ও ঈমান',   'ঈমানের মৌলিক বিষয়, আহলুস সুন্নাহর আকিদা ও সংশয় নিরসন।', 1),
  ('fiqh',         'ফিকহ ও মাযহাব',  'হানাফী ফিকহের পরিচিতি, উসূল, দলীল ও ইখতিলাফের আদব।', 2),
  ('ibadah',       'ইবাদত ও আমল',    'নামায, রোযা, যাকাত ও হজ্বের নিয়ম ও ফযীলত।', 3),
  ('tazkiyah',     'আত্মশুদ্ধি',       'অন্তরের রোগ, তাওবা, সবর ও শুকরের বাস্তব নির্দেশনা।', 4),
  ('family',       'পরিবার ও সমাজ',   'বিবাহ, সন্তান প্রতিপালন, পিতা-মাতার হক ও সামাজিক আদব।', 5),
  ('contemporary', 'আধুনিক সমস্যা',   'প্রযুক্তি, অর্থনীতি ও সমকালীন বিষয়ে শরয়ী দৃষ্টিভঙ্গি।', 6)
on conflict (slug) do nothing;

insert into public.question_categories (slug, name_bn, sort_order) values
  ('salah-taharah', 'নামায ও পবিত্রতা', 1),
  ('nikah-family',  'বিবাহ ও পরিবার',  2),
  ('modern-masail', 'আধুনিক মাসায়েল', 3),
  ('aqidah-iman',   'আকিদা ও ঈমান',   4),
  ('sawm',          'রোযা', 5),
  ('zakat',         'যাকাত', 6),
  ('hajj',          'হজ্ব', 7),
  ('trade',         'ক্রয়-বিক্রয়', 8),
  ('inheritance',   'মিরাস', 9),
  ('dua',           'দু''আ', 10)
on conflict (slug) do nothing;
