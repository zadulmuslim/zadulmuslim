import sys, re
sys.path.insert(0, '/home/claude/content')
from qa import QA
from articles import ARTICLES

ADMIN = "aa0f5ee1-177f-4374-a94e-dd78ef49c2fc"
def dq(s, tag="zq"):
    assert f"${tag}$" not in s
    return f"${tag}${s}${tag}$"

def minutes(body):
    words = len(re.sub(r"[#>*_`!\[\]()-]", " ", body).split())
    return max(1, round(words / 180))

order = ["masah-on-socks","witr-salah-method","janaza-in-ambulance","child-custody-after-divorce",
         "aqiqah-parents-and-child-one-animal","lab-grown-meat-halal","bitcoin-cryptocurrency-ruling",
         "kalima-pronunciation-and-iman","worship-for-worldly-benefit","imam-abu-hanifa-five-hadith-advice",
         "rickshaw-fare-not-fixed","kabinnama-without-verbal-ijab-qabul","is-one-good-deed-enough-for-jannah"]
by = {q["slug"]: q for q in QA}
assert set(order) == set(by), set(by) ^ set(order)

qa_stmts, art_stmts = [], []
for i, slug in enumerate(order):
    q = by[slug]
    offset = (len(order) - i) * 7
    qa_stmts.append(f"""insert into public.questions (slug, title, question, answer, category_id, status, is_public, answered_by, answered_at, published_at, notify_email)
values ({dq(slug)}, {dq(q['title'])}, {dq(q['q'])}, {dq(q['a'])},
  (select id from public.question_categories where slug = {dq(q['cat'])}), 'answered', true, '{ADMIN}',
  now() - interval '{offset} minutes', now() - interval '{offset} minutes', false)
on conflict (slug) do update set title = excluded.title, question = excluded.question, answer = excluded.answer,
  category_id = excluded.category_id, status = 'answered', is_public = true;""")

for i, a in enumerate(ARTICLES):
    offset = (len(ARTICLES) - i) * 11
    art_stmts.append(f"""insert into public.articles (slug, title, excerpt, body, category_id, author_id, author_name, reading_minutes, status, published_at)
values ({dq(a['slug'])}, {dq(a['title'])}, {dq(a['excerpt'])}, {dq(a['body'])},
  (select id from public.article_categories where slug = {dq(a['cat'])}), '{ADMIN}', 'যাদুল মুসলিম সম্পাদকীয় বিভাগ', {minutes(a['body'])},
  'published', now() - interval '{offset} minutes')
on conflict (slug) do update set title = excluded.title, excerpt = excluded.excerpt, body = excluded.body,
  category_id = excluded.category_id, reading_minutes = excluded.reading_minutes, status = 'published';""")

open("qa1.sql", "w").write("\n".join(qa_stmts[:7]))
open("qa2.sql", "w").write("\n".join(qa_stmts[7:]))
open("articles.sql", "w").write("\n".join(art_stmts))
print(len(qa_stmts), len(art_stmts), [minutes(a['body']) for a in ARTICLES])
