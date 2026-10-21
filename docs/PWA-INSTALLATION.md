# Install the Companion as an app

QuestKeeper can be installed directly from its HTTPS Companion website. The
installed version gets its own launcher icon and opens in a dedicated window;
the campaign remains the same self-hosted website and requires no store account.

## Chrome and Edge

1. Open the deployed Companion and enter any campaign.
2. When **Install** appears in the top command bar, select it.
3. Confirm the browser-owned prompt.

The control is deliberately hidden until the browser confirms that the current
site is installable. The browser menu or address-bar install icon remains an
equivalent path.

## iPhone and iPad

Open the Companion, use the browser **Share** menu, choose **Add to Home Screen**
and enable **Open as Web App** when offered. iOS does not expose the custom
install prompt used by the in-app button.

## What this first PWA step guarantees

- QuestKeeper has a standalone identity, launcher icons and a hosting-safe
  start address.
- Production builds register the QuestKeeper app shell service worker.
- Development builds do not register a service worker, avoiding stale local
  code while authors work.
- Normal browser use remains available when installation is unsupported.

Installation alone does **not mean every campaign page is available offline**.
Before game night, open the campaign's **Offline pack**, choose the public
profiles you need and prepare the latest recaps. The
[offline game-night guide](OFFLINE-GAME-NIGHT.md) describes the exact boundary.

Technical background: [MDN's installability guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
and [Apple's web-app instructions](https://support.apple.com/guide/iphone/iphea86e5236/ios).

---

## Installare il Companion come app

Apri il Companion pubblicato in HTTPS. Su Chrome o Edge usa **Installa** nella
barra superiore e conferma la finestra del browser. Su iPhone o iPad usa
**Condividi → Aggiungi alla schermata Home** e, quando disponibile, abilita
**Apri come app web**.

Il pulsante interno compare solo se il browser può davvero installare l'app.
L'installazione non salva automaticamente tutta la campagna: prima della
sessione apri **Kit offline**, scegli i profili pubblici e prepara i recap
recenti.
