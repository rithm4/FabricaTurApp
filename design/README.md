# Sursele de design ale aplicației

> **Începe cu [`nou/`](nou/).** Restul acestui folder este istoric.

## De ce există avertismentul de mai sus

Designul aplicației a trecut prin trei generații în 17 septembrie 2026, în aproximativ două ore.
Doar prima a ajuns să fie scrisă în cod. Cine citește doar `prototype/` construiește generația
greșită — s-a întâmplat deja o dată.

| Oră | Generație | Unde trăiește | Semnătură |
| --- | --- | --- | --- |
| ~11:18 | Teal | `prototype/*.dc.html` | verde-pin `#0E4C45` + portocaliu, preluat de la site |
| 12:42–13:13 | Albastru / navy | doar imagini în `../../uploads/` | paleta logo-ului; tab-uri Acasă · Stațiuni · Salvate · Profil |
| după 13:13 | Curentă | **nicăieri salvat** | filtre pe ecranul principal, preț magenta, tab-uri Acasă · Destinații · Noutăți · Profil |

Structura însă a rezistat peste toate trei: aceleași nouă ecrane, aceeași cerință RO/RU.
Se schimbă doar pielea.

## Paleta de brand

Prelevată din pixelii logo-ului (`../../uploads/pasted-1789648954112-0.png`), nu estimată din ochi.
Aceste trei culori nu s-au schimbat între generații și sunt în `src/theme.ts`:

| | |
| --- | --- |
| cyan | `#0597F2` |
| bleumarin | `#29458A` |
| magenta | `#C4007D` |

## Sistemul vizual

Totul trăiește în `src/theme.ts`. Ecranele nu conțin nicio culoare scrisă direct.

**Pragul.** Publicul are 50+ ani, deci textul țintește **7:1 (WCAG AAA)**, nu minimul de 4,5:1,
iar nimic destinat citirii nu coboară sub **15px**. Culorile de text nu sunt alese din ochi: sunt
rezultatul căutării celei mai apropiate variante mai închise care atinge raportul, păstrând nuanța.

| Rol | Valoare | Pe alb |
| --- | --- | --- |
| `ink` — titluri, prețuri | `#141A33` | 17,1:1 |
| `body` — text pe carduri | `#2B3557` | 12,0:1 |
| `muted` — text secundar | `#454E71` | 8,1:1 |
| `link` — acțiuni text | `#145C95` | 7,0:1 |
| `magentaText` — magenta citibil | `#AC006D` | 7,1:1 |

**Scara tipografică:** `display` 28 · `title` 22 · `heading` 18 · `body` 17 · `small` 15 · `micro` 14.
`micro` e rezervat badge-urilor și etichetelor cu majuscule — nu se folosește pentru fraze.

**Ținta de atingere:** constanta `TOUCH = 48`. WCAG cere 44; mergem mai sus pentru mâini mai puțin sigure.

**Separarea se face cu spațiu, nu cu linii.** O linie care ar trece pragul de 3:1 ar arăta ca un
tabel. Liniile rămân discrete și decorative; grupurile se despart prin scara `space`.

**Excepție asumată:** badge-ul de reducere are 5,76:1 (alb pe magenta de brand). Trece AA, dar nu
AAA. Păstrăm culoarea de brand aici, pentru că sensul e purtat și de text, și de poziție.

## Capcană: site-ul nu e aplicația

Majoritatea capturilor românești din `../../uploads/` sunt site-ul `statiunibalneare.md`, nu
aplicația. Au aceleași texte, aceleași fotografii și același hotel, dar altă identitate vizuală:
verde-pin cu portocaliu și titluri cu serife. Sunt ușor de confundat.

## Conținutul folderului

### nou/
Designul curent. Vezi `nou/CITESTE-MA.md`.

### prototype/
Generația teal, păstrată ca istoric. `App-Fabrica-Tur-Ungaria-v2.dc.html` este cea mai completă
dintre ele — toate cele nouă ecrane, RO + RU — dar **nu** este designul curent.
Fișierele `.dc.html` depind de `support.js` din același folder, deci trebuie să rămână împreună.

### variante/
Trei explorări de stil pentru cardul de ofertă. Varianta „Bilet" a intrat în aplicație,
în `src/components/TicketCard.tsx`.

### screenshots/
Capturi ale prototipului teal în rama de telefon.

## Note de portare valabile în continuare

- Iconurile Lucide nu există în React Native; `src/components/Icon.tsx` le mapează pe
  echivalentele Feather / MaterialCommunityIcons.
- Prototipul e desenat în Inter Tight. Fontul vine ca familii separate per grosime, așa că
  `src/components/Text.tsx` alege fișierul după `fontWeight` și apoi îl șterge, altfel Android
  ar îngroșa sintetic peste un font deja bold.
- Fotografiile se încarcă de pe CDN-ul Tilda — vezi `photos` din `src/theme.ts`.
- Ecranul de cerere ofertă are câmpuri reale, nu machetă statică.
