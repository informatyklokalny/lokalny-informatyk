# Lokalny Informatyk — formularz bez kluczy API (FormSubmit)

Kompletna, wielostronicowa witryna Cloudflare Pages Direct Upload. Zachowuje wygląd strony głównej, O mnie, Usługi, Kontakt, animacje i linki do Facebooka.

## Gotowa konfiguracja

- Adres odbiorcy: **informatyk.lokalny@gmail.com**.
- Profil Facebook: https://www.facebook.com/profile.php?id=61594955087010
- Formularz na `/kontakt/`: imię i nazwisko, telefon, miejscowość, rodzaj problemu, opis problemu.
- Wiadomość e-mail: temat `Nowe zgłoszenie | Lokalny Informatyk`, pola w **czytelnej tabeli** (FormSubmit `_template=table`).
- Po poprawnej odpowiedzi FormSubmit formularz jest zamieniany na komunikat z podziękowaniem, bez otwierania klientowi e-maila.
- Nie ma Resend, `_worker.js`, kluczy API ani innych wymaganych sekretów.

## Jak uruchomić — 3 kroki

1. W Cloudflare Pages otwórz istniejący projekt `lokalny-informatyk`, wybierz nowy deployment / **Upload assets** (Production), i wrzuć ZIP. W katalogu głównym ZIP znajduje się `index.html`, nie należy dołączać dodatkowego nadrzędnego folderu.
2. Otwórz https://lokalny-informatyk.pages.dev/kontakt/ i wyślij **testowe** zgłoszenie z własnymi, niewrażliwymi danymi. **Pierwsza próba może wyświetlić informację o braku aktywacji.**
3. Wejdź do Gmail `informatyk.lokalny@gmail.com`, znajdź e-mail aktywacyjny od **FormSubmit** (również w Spam i Oferty) i kliknij przycisk/link potwierdzenia. **Następnie wyślij drugi test formularza** i sprawdź, czy pojawia się podziękowanie i wiadomość z danymi.

Ta jednorazowa aktywacja jest obowiązkowa: bez niej e-maile z kolejnych zgłoszeń nie będą normalnie doręczane. Według FormSubmit niepotwierdzone wiadomości są tymczasowo przechowywane, ale nie warto udostępniać formularza klientom przed aktywacją.

## Jak to działa?

Przeglądarka klienta ➜ `POST https://formsubmit.co/ajax/informatyk.lokalny@gmail.com` ➜ FormSubmit ➜ Gmail.

FormSubmit używa **zewnętrznej usługi**, nie wysyła wiadomości bezpośrednio z Cloudflare. Adres odbiorcy jest widoczny w kodzie strony i adresie żądania, co może zwiększać spam. Zastosowano ukryte pole `_honey`, a CAPTCHA FormSubmit wyłączono (`_captcha=false`), aby użytkownik mógł pozostać na stronie przy wysłaniu AJAX. Nie jest to mocne zabezpieczenie przed botami; w przypadku spamu rozważ inną integrację z ochroną serwerową.

**Potwierdzenie wysłania oznacza, że FormSubmit zaakceptował zgłoszenie, nie że wiadomość na pewno znalazła się w skrzynce odbiorczej.** Sprawdź również Spam. Kod celowo sprawdza `result.success === 'true'` (lub `true`), ponieważ FormSubmit potrafi zwrócić odpowiedź HTTP 200 oraz tekstowe `"false"` przy błędzie. Nie wyświetla wtedy fałszywego sukcesu.

Jeśli JavaScript jest wyłączony, formularz korzysta z tradycyjnego `POST` i po prawidłowym wysłaniu może przekierować na `/dziekujemy/`.

## Ważne przed publicznym uruchomieniem

W `prywatnosc/index.html` **wciąż trzeba uzupełnić dane administratora oraz konkretną politykę retencji**. Adres kontaktowy i dostawców zaktualizowano na Gmail/FormSubmit. Ponieważ zbierasz dane osobowe, upewnij się, że treść odpowiada faktycznemu przetwarzaniu danych i obowiązkom RODO. Nie publikuj nieuzupełnionego szablonu jako kompletnej polityki prawnej.

Aby zmienić miejscowość: `assets/js/config.js` → `locality`. Nie musisz ustawiać zmiennych Cloudflare, dodawać backendu ani tworzyć konta Resend.

Aby **zmienić adres odbiorcy**, zaktualizuj zarówno `action` w `kontakt/index.html`, jak i URL `fetch` w `assets/js/main.js`; nowy adres będzie wymagał osobnej aktywacji FormSubmit.

## Podstawowe testy

- Formularz nie przepuszcza pustych wymaganych pól (HTML `required`).
- Przycisk blokuje wielokrotne kliknięcie podczas wysyłania.
- Nie pokazuje sukcesu przy `success: "false"`, np. przed aktywacją lub przy błędzie.
- Dostępna jest wersja mobilna i podstrona `/dziekujemy/`.

Dokumentacja: https://formsubmit.co/documentation i https://formsubmit.co/ajax-documentation
