export type Lang = 'ro' | 'ru';

const ro = {
  signInTitle: 'Bun venit',
  signInFirstName: 'Prenume',
  signInFirstNameEx: 'ex. Ion',
  signInLastName: 'Nume',
  signInLastNameEx: 'ex. Popescu',
  signInPhone: 'Număr de telefon',
  signInPhoneEx: 'ex. 69 123 456',
  signInContinue: 'Continuă',
  signInNeedFirst: 'Scrie prenumele',
  signInNeedLast: 'Scrie numele de familie',
  signInNeedPhone: 'Numărul are 8 cifre după +373',
  signInTagline: 'Sejururi termale în Ungaria, cu plecare din Chișinău',

  hello: 'Bună ziua,',
  homeOffer: 'Oferta săptămânii',
  homeResorts: 'Destinații recomandate',
  seeAll: 'Vezi toate',
  seeOffer: 'Vezi oferta',
  promoTitle: '{name}, {nights}',
  listTitle: 'Stațiuni în Ungaria',
  hungary: 'Ungaria',
  water: 'Apa la sursă',
  stay: 'Sejur',
  fromPrice: 'De la',
  perPersonShort: 'Preț / pers.',
  tabDetails: 'Detalii',
  gallery: 'Galerie',
  departuresTitle: 'Plecări disponibile',
  departuresSeats: 'locuri libere',
  departuresLast: 'Ultimele locuri',
  departuresFull: 'Complet — nu mai sunt locuri',
  departuresUntil: 'până pe {date}',
  departuresChosen: 'Plecarea aleasă',
  departuresChange: 'Schimbă',
  askOffer: 'Vreau oferta',
  notifTitle: 'Notificări',
  settings: 'Setări',
  promoLimit: 'Oferta este valabilă până la {date}.',
  formTitle: 'Cerere ofertă',
  formPerPerson: 'de persoană',
  formStepDate: 'Data plecării',
  formNoDate: 'Încă nu știu',
  formNoDateHint: 'Te ajutăm la telefon',
  formEstimate: 'Cost estimativ',
  formFrom: 'de la',
  formStepContact: 'Datele tale',
  articleCtaTitle: 'Gata de drum?',
  articleCtaText: 'Trimite o cerere: consultantul te sună și îți spune tot ce trebuie.',
  articleCtaButton: 'Cere o ofertă',
  formWho: 'Câte persoane',
  formName: 'Nume și prenume',
  formNameEx: 'ex. Ion Popescu',
  formPhone: 'Telefon',
  formFine: 'Trimiterea cererii este gratuită și nu te obligă să rezervi.',
  formSend: 'Trimite cererea',
  bookTitle: 'Rezervările mele',
  persons: 'persoane',
  profTitle: 'Profil',
  profNotif: 'Notificări',
  profLang: 'Limba',
  profSignOut: 'Ieși din cont',
  notifSummary: '{on} din {all} active',
  notifAllOff: 'Toate sunt oprite',
  notifSettingsIntro: 'Alege despre ce vrei să afli primul. Poți schimba oricând.',
  back: 'Înapoi',
  a11yPhotosOf: 'Fotografii de la',
  a11yPoolPhoto: 'Bazinul termal interior',
  a11yPhotoN: 'Fotografia {n} din {all}',
  a11yFrom: 'de la',
  a11yRating: 'nota',
  bookEmptyTitle: 'Nu ai încă nicio cerere',
  bookEmptyText: 'Alege o plecare și trimite o cerere. O găsești apoi aici.',
  bookEmptyCta: 'Vezi plecările',
  bookStatusSaved: 'Salvată',
  bookStatusSent: 'Trimisă pe WhatsApp',
  formSendWa: 'Trimite pe WhatsApp',
  waMessage: 'Bună ziua! Aș dori o ofertă pentru {resort}, plecarea {dates}, {party} persoane. Nume: {name}, telefon: {phone}.',
  waNoDate: 'data de stabilit',
  formNeedName: 'Scrie numele și prenumele',
  discountLabel: 'Reducere',
  relNow: 'chiar acum',
  relMin: 'acum {n} min',
  relHours: 'acum {n} h',
  relYesterday: 'ieri',
  relDays: 'acum {n} zile',
  notifEmpty: 'Nicio noutate încă. Aici apar promoțiile și plecările noi.',
  bookStatusSentAgency: 'Trimisă agenției',
  bookStatusCalled: 'Consultantul te-a sunat',
  bookStatusBooked: 'Rezervată',
  bookStatusCancelled: 'Anulată',
  notifNew: 'Nou',
  notifToday: 'Azi',
  notifYesterday: 'Ieri',
  notifEarlier: 'Mai devreme',
  notifGoOffer: 'Vezi oferta',
  notifGoResort: 'Vezi hotelul',
  notifGoBookings: 'Rezervările mele',
  notifGoArticle: 'Citește articolul',
  a11yUnread: 'noutăți necitite',
  departuresNone: 'Nu sunt plecări programate deocamdată.',
  articlesTitle: 'Sfaturi utile',
  articlesEmpty: 'Articolele apar aici curând.',
  articleMinutes: '{n} min de citit',
  articleResort: 'Vezi hotelul',
  tabHome: 'Acasă',
  tabResorts: 'Destinații',
  tabNotif: 'Noutăți',
  tabProfile: 'Profil',
};

/** Traducerea rusă folosește exact aceleași chei ca varianta română. */
const ru: Record<keyof typeof ro, string> = {
  signInTitle: 'Добро пожаловать',
  signInFirstName: 'Имя',
  signInFirstNameEx: 'напр. Иван',
  signInLastName: 'Фамилия',
  signInLastNameEx: 'напр. Попеску',
  signInPhone: 'Номер телефона',
  signInPhoneEx: 'напр. 69 123 456',
  signInContinue: 'Продолжить',
  signInNeedFirst: 'Введите имя',
  signInNeedLast: 'Введите фамилию',
  signInNeedPhone: 'После +373 должно быть 8 цифр',
  signInTagline: 'Термальные курорты Венгрии, выезд из Кишинёва',

  hello: 'Здравствуйте,',
  homeOffer: 'Предложение недели',
  homeResorts: 'Рекомендуемые направления',
  seeAll: 'Все курорты',
  seeOffer: 'Подробнее',
  promoTitle: '{name}, {nights}',
  listTitle: 'Курорты Венгрии',
  hungary: 'Венгрия',
  water: 'Вода у источника',
  stay: 'Поездка',
  fromPrice: 'От',
  perPersonShort: 'Цена / чел.',
  tabDetails: 'Детали',
  gallery: 'Галерея',
  departuresTitle: 'Доступные выезды',
  departuresSeats: 'свободных мест',
  departuresLast: 'Последние места',
  departuresFull: 'Мест больше нет',
  departuresUntil: 'до {date}',
  departuresChosen: 'Выбранный выезд',
  departuresChange: 'Изменить',
  askOffer: 'Хочу предложение',
  notifTitle: 'Уведомления',
  settings: 'Настройки',
  promoLimit: 'Предложение действует до {date}.',
  formTitle: 'Запрос предложения',
  formPerPerson: 'с человека',
  formStepDate: 'Дата выезда',
  formNoDate: 'Пока не знаю',
  formNoDateHint: 'Поможем по телефону',
  formEstimate: 'Ориентировочно',
  formFrom: 'от',
  formStepContact: 'Ваши данные',
  articleCtaTitle: 'Готовы в путь?',
  articleCtaText: 'Отправьте заявку: консультант позвонит и всё расскажет.',
  articleCtaButton: 'Запросить предложение',
  formWho: 'Сколько человек',
  formName: 'Имя и фамилия',
  formNameEx: 'напр. Иван Попеску',
  formPhone: 'Телефон',
  formFine: 'Запрос бесплатный и не обязывает вас бронировать.',
  formSend: 'Отправить запрос',
  bookTitle: 'Мои заявки',
  persons: 'человека',
  profTitle: 'Профиль',
  profNotif: 'Уведомления',
  profLang: 'Язык',
  profSignOut: 'Выйти из аккаунта',
  notifSummary: 'Включено {on} из {all}',
  notifAllOff: 'Все выключены',
  notifSettingsIntro: 'Выберите, о чём хотите узнавать первыми. Изменить можно в любой момент.',
  back: 'Назад',
  a11yPhotosOf: 'Фотографии:',
  a11yPoolPhoto: 'Внутренний термальный бассейн',
  a11yPhotoN: 'Фото {n} из {all}',
  a11yFrom: 'от',
  a11yRating: 'оценка',
  bookEmptyTitle: 'У вас пока нет заявок',
  bookEmptyText: 'Выберите выезд и отправьте заявку — она появится здесь.',
  bookEmptyCta: 'Смотреть выезды',
  bookStatusSaved: 'Сохранена',
  bookStatusSent: 'Отправлена в WhatsApp',
  formSendWa: 'Отправить в WhatsApp',
  waMessage: 'Здравствуйте! Хочу получить предложение: {resort}, выезд {dates}, {party} чел. Имя: {name}, телефон: {phone}.',
  waNoDate: 'дата по договорённости',
  formNeedName: 'Введите имя и фамилию',
  discountLabel: 'Скидка',
  relNow: 'только что',
  relMin: '{n} мин назад',
  relHours: '{n} ч назад',
  relYesterday: 'вчера',
  relDays: '{n} дн. назад',
  notifEmpty: 'Пока нет новостей. Здесь появятся акции и новые выезды.',
  bookStatusSentAgency: 'Отправлена в агентство',
  bookStatusCalled: 'Консультант вам позвонил',
  bookStatusBooked: 'Забронировано',
  bookStatusCancelled: 'Отменена',
  notifNew: 'Новое',
  notifToday: 'Сегодня',
  notifYesterday: 'Вчера',
  notifEarlier: 'Ранее',
  notifGoOffer: 'Смотреть предложение',
  notifGoResort: 'Смотреть отель',
  notifGoBookings: 'Мои заявки',
  notifGoArticle: 'Читать статью',
  a11yUnread: 'непрочитанные новости',
  departuresNone: 'Пока нет запланированных выездов.',
  articlesTitle: 'Полезные советы',
  articlesEmpty: 'Статьи скоро появятся здесь.',
  articleMinutes: '{n} мин чтения',
  articleResort: 'Посмотреть отель',
  tabHome: 'Главная',
  tabResorts: 'Курорты',
  tabNotif: 'Новости',
  tabProfile: 'Профиль',
};

export type Strings = typeof ro;

/**
 * „7 nopți", „1 noapte"; în rusă cele trei forme: „1 ночь", „3 ночи", „7 ночей".
 * Numărul vine din panou, deci forma trebuie să se potrivească oricărei cifre.
 */
/**
 * Câte persoane, cu forma corectă: „1 persoană", „2 persoane", „3+ persoane";
 * în rusă „1 человек", „2 человека", „3+ человек".
 */
export function personsLabel(party: string, lang: Lang) {
  if (lang === 'ro') return party === '1' ? '1 persoană' : `${party} persoane`;
  if (party === '1') return '1 человек';
  if (party === '2') return '2 человека';
  return `${party} человек`;
}

/** „Ultimele 2 locuri", „Ultimul loc"; în rusă „Последние 2 места", „Последнее место". */
export function lastSeatsLabel(n: number, lang: Lang) {
  if (lang === 'ro') return n === 1 ? 'Ultimul loc' : `Ultimele ${n} locuri`;
  if (n === 1) return 'Последнее место';
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'места' : 'мест';
  return `Последние ${n} ${word}`;
}

/** „69123456" → „+373 69 123 456": numărul, așa cum îl citește un om. */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^373/, '');
  if (digits.length !== 8) return phone;
  return `+373 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function nightsLabel(n: number, lang: Lang) {
  if (lang === 'ro') return n === 1 ? '1 noapte' : `${n} nopți`;
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'ночь'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'ночи'
        : 'ночей';
  return `${n} ${word}`;
}

export const strings: Record<Lang, Strings> = { ro, ru };
