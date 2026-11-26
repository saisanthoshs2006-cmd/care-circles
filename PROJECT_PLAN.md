# Project plan: Care Circles

## Source and ownership

This workspace is a derivative of [Bread Cooperative's mutualaid.fun](https://github.com/BreadchainCoop/mutualaid.fun), cloned at commit `689e880` on 26 November 2026. The original application, its distribution workflow, and its offline storage/sync code belong to the original contributors. Keep `LICENSE` and credit the original project in any public repository, demo, and submission. This plan does not make the existing implementation original work.

The source is MIT licensed. The app now uses a Care Circles header, theme, and system fonts. Original brand and font files remain in the source tree but are not imported by the main app build; review their separate rights before publishing any other build target that includes them.

## Original product direction

Care Circles aims to connect a person asking for practical help with an enrolled local volunteer, then show whether the help actually happened. The existing toolkit is an organization-facing distribution console.

**Implemented locally:** a coordinator-created task form with a consent checkbox and no contact fields; a transparent volunteer ranking using help type, area, language, availability, and transport; an offer/accept/decline flow; coordinator reassignment and cancellation; volunteer completion; active/completed counts; a Care Circles screen and default branding. The workflow has domain tests and a local browser check with fictional data. These changes have not been published.

**Still to build or validate:** a participant-facing form and private status lookup, two-device testing through an independently configured relay, volunteer screening, notifications, a fuller impact dashboard, and real-world privacy/data-retention review. The current matcher uses volunteer self-described profiles; it does not verify skills or location.

1. **Participant request flow.** A simple, accessible form for a person or trusted intermediary to request a task, state a preferred time and language, and choose exactly what contact details may be shared. Give the requester a private status code rather than exposing a public profile. The current version is coordinator-only.
2. **Volunteer offer and matching.** Existing volunteer profiles contain skills, availability, languages, and area. The new matcher ranks suggestions and shows the reasons; a coordinator chooses whom to offer the task to. Distance is not calculated.
3. **Warm handoff.** A coordinator offers the task; the volunteer accepts or declines. Cancellation, reassignment, and completion are implemented. Contact details are never shared by this flow. A safety escalation path remains to be built.
4. **Impact view.** Active and completed counts are shown. Time to first response and category trends remain to be built. Any sample content must be clearly marked fictional.

## Suggested implementation order

1. Test the existing offer/accept/complete flow on two devices with fictional data and a relay you control.
2. Add participant-facing requests and private status lookup, with abuse prevention and consent review.
3. Polish mobile and keyboard accessibility, reduce the large JavaScript bundle, and capture a short demo.
4. If real users are involved, review consent, data retention, volunteer vetting, and relay security before collecting contact details.

## Deployment

`vercel.json` sets Vercel to run the existing Vite build and serve `dist`. The site itself is static. Organization data is stored on devices; cross-device sharing relies on a separate relay and must be configured and evaluated before claiming a multi-user production service. Vercel CLI is currently logged out on this Mac, so no Vercel project or live URL exists yet.

## Competition disclosure

The [CSC Winter Sparkathon rules](https://csc-winter-sparkathon.devpost.com/rules) require high school participants aged 13–18, substantial development during the event, and disclosure of pre-existing code and AI work. The user's earlier chat stated age 20, so eligibility has not been established. Do not submit this project to that event or claim prize eligibility without organizer confirmation.
