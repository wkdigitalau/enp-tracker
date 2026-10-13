# ENP recipient-level site activity

This is the static-site half of the Connect first-party campaign tracking proposed in wkdigitalau/wk-event-leads PR #22.

## Scope

- Installed only on the two canonical campaign pages: index.html and aged-care-provider-partnership.html.
- The referral token is removed from the address bar synchronously before GA4 loads, so it is not included in GA4's page_location.
- When explicitly enabled, an opaque token is held in tab-scoped session storage and sent only to the Connect activity endpoint.
- Events contain a pathname and, for selected controls, a static category (callback or book-conversation). No name, email, phone number, query string, fragment or full URL is sent.
- No other links or general browsing behavior are recorded.

## Release gate

The ENP_RECIPIENT_ACTIVITY_ENABLED setting is deliberately false in the HTML. The helper therefore records nothing. Do not change it to true or merge/deploy this branch until:

1. The Connect tracking endpoint and matching redirect implementation are reviewed and deployed.
2. ENP approves and publishes plain-language privacy wording describing recipient-specific link and on-site activity association, purpose, access and retention.
3. A controlled internal end-to-end check confirms the recipient token is absent from GA4 and only expected events appear in the Connect lead timeline.

The email link's initial request is still visible to the ENP web server as an opaque query token before the browser removes it. Do not describe the token as absent from all server logs; confirm the server/CDN log policy and retention as part of the release review. The token and campaign identity are never sent to Google Analytics by this helper.

## Events

- page_view: path only, on each covered page after a campaign referral.
- cta: only clicks on explicitly marked callback or book-conversation controls.

These events indicate browser activity, not verified human attention. Email security tools can request campaign links automatically; Connect labels the first event as a link request for that reason.
