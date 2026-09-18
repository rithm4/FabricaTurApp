# Panoul operatorului

Site web separat de aplicația mobilă, pentru angajații agenției:

- **Cereri** — cererile de ofertă din aplicație, cu starea lor
- **Notificări** — scrierea și trimiterea notificărilor, în română și rusă
- **Oferte** — prețuri, reduceri, detaliile hotelurilor
- **Plecări** — datele de plecare și locurile rămase, pe hotel

Publicat automat la `rithm4.github.io/FabricaTurApp/admin/`, la fiecare push pe `main`.

## Rulare locală

```
cd admin
npm install
npm run dev
```

Se deschide la `http://localhost:5174`.

## Starea actuală: date de probă

Panoul ține datele în memoria browserului (`localStorage`), deci modificările nu ajung încă
în aplicație și nu sunt văzute de alți operatori. Butonul „Readu datele inițiale" din meniu
le resetează.

Tot ce ține de date trece prin **`src/api.ts`**. La conectarea serverului (Supabase), și
mai târziu a CRM-ului, se rescrie doar acel fișier; ecranele rămân neschimbate.

## Securitate, înainte de date reale

Pagina e publică. Cât timp conține doar date de probă, nu e o problemă. Înainte de a o
conecta la date reale — telefoanele clienților — trebuie adăugată autentificarea
operatorilor, iar datele trebuie protejate pe server, nu doar ascunse în interfață.
