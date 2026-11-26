# Care Circles (work in progress)

Care Circles is a derivative of [mutualaid.fun](https://github.com/BreadchainCoop/mutualaid.fun) by the Bread Cooperative and Decentral Park. The source below this note is the original toolkit and remains credited to its contributors. The MIT copyright notice is preserved in [LICENSE](LICENSE).

This adaptation adds a coordinator-created help request, consent confirmation, explainable volunteer suggestions, volunteer accept/decline, reassignment, and completion tracking. It also changes the visible app name and default theme. The existing distribution, offline storage, and sync features come from upstream. See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the exact implementation status and remaining work. Use fictional data in demos; the new flow does not collect contact details.

Development disclosure: OpenAI Codex assisted with repository comparison, implementation, dependency updates, and testing of this adaptation. The project owner should review and be able to explain all shipped behavior.

To run locally: `npm ci`, then `npm run dev`. For Vercel, the project root is this directory and `vercel.json` builds the static `dist` site. Cross-device use needs a separately configured relay.

---

# Original mutualaid.fun documentation

**Practical tools for working people to run their own mutual aid.**

Your community, your data, your rules — no company in the middle. It runs on
your own devices, works offline, and every line is open source. A joint project
by the [Bread Cooperative](https://breadchain.xyz) and
[Decentral Park](https://github.com/decentralparknyc), free for any community to
use, change, and deploy as their own.

> This is what solidarity looks like in practice. Real people, building real
> tools, for real community benefit.

---

## What it is

A ready-to-run console for the everyday work of a mutual-aid distribution:

- **Intake** — people ask for what they need, in their own language.
- **Check-in** — at the distribution, look someone up by the last 4 digits of
  their phone, mark what they received (delivered), what they no longer need
  (timed out), and check them in.
- **Outreach** — build a call list and send everyone a message in the language
  they speak.
- **Distros & no-shows** — schedule events, handle appointments and misses.
- **Dashboard** — see what your community needs, at a glance.

Every part is yours to rename, recolor, and reshape. The request types, the
languages, the branding — all set by you when you start your org, and shared to
every device on your team.

## Why we built it this way

- **You own it.** Whoever deploys this owns their copy. There's no account to
  sign up for and no company that can turn it off. Fork it, host it, change it.
- **Your data lives with you.** It's stored on your own devices, not on someone
  else's server. To work across a phone and a laptop, your devices talk to each
  other directly (see [running as a team](docs/invite-and-manage.md)).
- **It works when other things don't.** Offline at a distribution with no
  signal? It still runs. Resilient enough for real life.
- **Private by default.** Only people you add can see or change your
  community's data. Everyone else is turned away.
- **Don't trust — verify.** It's all here. Read the code, check the build.

## Try it

The hosted demo is a full, working copy you can start using right now:

**→ https://breadchaincoop.github.io/mutual-aid-toolkit/**

Open it, click **Create a new org**, and you're the first admin of your own
community. Nothing you do there touches anyone else — it's your copy, on your
device.

## Guides

- **[Make it your own](docs/make-it-your-own.md)** — set your name, colors,
  logo, and the goods/services/languages you actually hand out.
- **[Invite people & manage your team](docs/invite-and-manage.md)** — add
  volunteers with a QR code, and manage who can do what (admins, volunteers,
  removing access).
- **[Run a distribution](docs/run-a-distribution.md)** — intake, check-in,
  outreach, and distros, start to finish.

## Run your own copy

You don't need us to host it. Two ways to put your own copy online:

**1. Fork and deploy (recommended)**

1. Fork this repo to your own org or account.
2. In your fork: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
3. Push (or use **Actions → Deploy → Run workflow**). Your copy goes live at
   `https://<you>.github.io/mutual-aid-toolkit/`.

**2. Build it yourself**

```bash
npm install
npm run build:single      # → dist-single/index.html — the whole app, one file
```

`dist-single/index.html` is completely self-contained (fonts, code, everything
inlined). Drop it on any static host — GitHub Pages, a USB stick, your own
laptop. No backend required.

### Develop

```bash
npm install
npm run dev        # local dev server
npm test           # the test suite
npm run typecheck
```

Requires Node ≥ 22.13.

## Working across more than one device

The app works fully on a single device with no server at all. To share one
org's data across a phone and a laptop (or between volunteers), the devices
sync directly through a small relay. You can point at a shared community relay
or run your own — details in
[Invite people & manage your team](docs/invite-and-manage.md). Nothing
sensitive should be routed through a relay you don't trust; run your own for
anything private.

## Credits & license

The distribution workflow began as
[Bushwick Ayuda Mutua](https://bushwickayudamutua.com)'s field-tested system.
This toolkit generalizes it so any community can make it their own. Branding
and typeface (Pogaca) from the Bread Cooperative
[UI kit](https://github.com/BreadchainCoop/bread-ui-kit), with
[Decentral Park](https://github.com/decentralparknyc/decentralpark-ui-kit) as a
co-creating partner.

MIT licensed. Built together, owned together.
