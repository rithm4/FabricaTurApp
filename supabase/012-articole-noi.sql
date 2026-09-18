-- 012 · Încă patru articole, ca ciorne: le citești, le corectezi și le publici din panou.
-- Se rulează în Supabase → SQL Editor. Nu adaugă de două ori același titlu.

insert into public.articles (position, title_ro, title_ru, summary_ro, summary_ru, body_ro, body_ru)
select v.position, v.title_ro, v.title_ru, v.summary_ro, v.summary_ru, v.body_ro, v.body_ru
from (values
  (3,
   'Actele de care ai nevoie pentru Ungaria',
   'Какие документы нужны для поездки в Венгрию',
   'Pașaportul, asigurarea și ce verifici înainte de plecare.',
   'Паспорт, страховка и что проверить перед выездом.',
   E'Ungaria face parte din spațiul Schengen. Cu pașaportul biometric al Republicii Moldova poți călători fără viză, pentru o ședere scurtă.\n\n- Pașaportul biometric, valabil încă cel puțin trei luni după întoarcere.\n- Asigurarea medicală de călătorie, pentru toate zilele.\n- Buletinul de identitate, ca act în plus.\n- Dacă un copil călătorește fără unul dintre părinți, e nevoie de acordul notarial al acestuia.\n\nRegulile se pot schimba. Înainte de plecare, întreabă-ne: îți spunem exact ce acte să iei.',
   E'Венгрия входит в Шенгенскую зону. С биометрическим паспортом Республики Молдова можно ехать без визы на короткий срок.\n\n- Биометрический паспорт, действительный ещё минимум три месяца после возвращения.\n- Медицинская страховка на все дни поездки.\n- Удостоверение личности как дополнительный документ.\n- Если ребёнок едет без одного из родителей, нужно нотариальное согласие этого родителя.\n\nПравила могут меняться. Перед поездкой спросите нас — подскажем, какие документы взять.'),
  (4,
   'Bani în Ungaria: forinți, euro sau card',
   'Деньги в Венгрии: форинты, евро или карта',
   'Ce monedă folosești și cum plătești cel mai simplu.',
   'Какой валютой пользоваться и как проще платить.',
   E'Moneda Ungariei este forintul (HUF). Euro se primește doar în unele locuri și, de obicei, la un curs mai puțin bun.\n\n- Cardul bancar merge în majoritatea magazinelor, cafenelelor și farmaciilor.\n- Ia și puțini forinți în numerar, pentru cumpărături mici și bacșiș.\n- Schimbă bani la bancă sau la o casă de schimb, nu pe stradă.\n- Anunță-ți banca înainte de plecare că vei plăti cu cardul în străinătate.\n\nCe e inclus în ofertă e deja plătit: la hotel plătești doar extra, dacă vrei.',
   E'Валюта Венгрии — форинт (HUF). Евро принимают лишь в некоторых местах и обычно по менее выгодному курсу.\n\n- Банковской картой можно платить в большинстве магазинов, кафе и аптек.\n- Возьмите немного форинтов наличными — для мелких покупок и чаевых.\n- Меняйте деньги в банке или в обменном пункте, не на улице.\n- Перед поездкой предупредите банк, что будете платить картой за границей.\n\nВсё, что входит в предложение, уже оплачено: в отеле вы платите только за дополнительные услуги, если захотите.'),
  (5,
   'Drumul cu autocarul, ușor și fără griji',
   'Поездка на автобусе — легко и спокойно',
   'Câteva lucruri mici care fac drumul lung mult mai comod.',
   'Несколько мелочей, которые сделают долгую дорогу удобнее.',
   E'Drumul până în Ungaria e lung, dar se poate face comod dacă te pregătești puțin.\n\n- Haine lejere, în straturi, și încălțăminte comodă.\n- O sticlă de apă și ceva ușor de mâncat.\n- O pernă mică de gât.\n- Medicamentele tale în bagajul de mână, nu în portbagaj.\n- Pașaportul la îndemână: ți-l cer la graniță.\n\nPe drum facem opriri. Dacă ai nevoie de ceva special, spune-ne la rezervare.',
   E'Дорога до Венгрии долгая, но её можно сделать удобной, если немного подготовиться.\n\n- Свободная одежда в несколько слоёв и удобная обувь.\n- Бутылка воды и что-то лёгкое перекусить.\n- Небольшая подушка для шеи.\n- Ваши лекарства в ручной клади, а не в багажном отделении.\n- Паспорт под рукой: его спросят на границе.\n\nВ дороге мы делаем остановки. Если вам нужно что-то особенное, скажите об этом при бронировании.'),
  (6,
   'Kumánia sau Hungarospa: care ți se potrivește?',
   'Кумания или Хунгароспа: что вам подойдёт?',
   'Două stațiuni termale, două feluri de a te odihni.',
   'Два термальных курорта — два способа отдохнуть.',
   E'Ambele hoteluri au băi termale și mic dejun inclus, dar se potrivesc unor oameni diferiți.\n\nKumánia, în Kisújszállás, e un loc liniștit, cu acces direct din hotel la băi și cu proceduri. E potrivit dacă vrei odihnă și tratament, fără agitație.\n\nHungarospa, în Hajdúszoboszló, e lângă unul dintre cele mai mari complexe termale din Europa, cu multe bazine și zonă wellness. E potrivit dacă îți place să ai de toate la îndemână.\n\nNu știi ce să alegi? Trimite o cerere din aplicație: consultantul te sună și te ajută.',
   E'В обоих отелях есть термальные купальни и завтрак, но подходят они разным людям.\n\nКумания в Кишуйсаллаше — спокойное место с прямым переходом из отеля в купальни и процедурами. Подойдёт, если хочется отдыха и лечения без суеты.\n\nХунгароспа в Хайдусобосло — рядом с одним из крупнейших термальных комплексов Европы, много бассейнов и зона wellness. Подойдёт, если любите, чтобы всё было под рукой.\n\nНе знаете, что выбрать? Отправьте заявку в приложении — консультант позвонит и поможет.')
) as v(position, title_ro, title_ru, summary_ro, summary_ru, body_ro, body_ru)
where not exists (select 1 from public.articles a where a.title_ro = v.title_ro);

-- Verificare: toate articolele, cu starea lor.
select position, title_ro, published from public.articles order by position;
