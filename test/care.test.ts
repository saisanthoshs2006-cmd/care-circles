import { describe, expect, it } from "vitest";
import {
  cancelCareRequest,
  completeCareRequest,
  createCareRequest,
  offerCareRequest,
  rankCareVolunteers,
  reopenCareRequest,
  respondToCareOffer,
} from "../src/domain/care.ts";
import type { RosterDoc } from "../src/schema.ts";
import { freshStore, FIXED_NOW } from "./helpers.ts";

const roster: RosterDoc = {
  org: "Care test", createdAt: FIXED_NOW,
  members: {
    ana: { peerId: "ana", name: "Ana", role: "volunteer", addedBy: "admin", addedAt: FIXED_NOW,
      profile: { skills: "Technology and tutoring", neighborhood: "Northside", languages: ["English"], availability: ["Weekends"] } },
    ben: { peerId: "ben", name: "Ben", role: "volunteer", addedBy: "admin", addedAt: FIXED_NOW,
      profile: { skills: "Groceries", neighborhood: "Southside", languages: ["Spanish"] } },
    old: { peerId: "old", name: "Old", role: "volunteer", addedBy: "admin", addedAt: FIXED_NOW, revokedAt: FIXED_NOW },
  },
};

const input = { title: "Set up a laptop", category: "Technology", neighborhood: "Northside",
  language: "English", availability: "Weekends", details: "Help install a video call app", consent: true };

describe("Care Circles", () => {
  it("requires consent and avoids contact details", async () => {
    const store = await freshStore();
    expect(() => createCareRequest(store.base, { ...input, consent: false })).toThrow(/agreed/);
    const request = createCareRequest(store.base, input, FIXED_NOW);
    expect(request.status).toBe("Open");
    expect(store.base.doc().careRequests?.[request.id]?.title).toBe(input.title);
    expect(JSON.stringify(request)).not.toMatch(/phone|email|address/i);
  });

  it("ranks profile fit and excludes revoked or declined volunteers", async () => {
    const store = await freshStore();
    const request = createCareRequest(store.base, input, FIXED_NOW);
    expect(rankCareVolunteers(request, roster).map((match) => match.peerId)).toEqual(["ana", "ben"]);
    expect(rankCareVolunteers(request, roster)[0]?.reasons).toEqual(["help type", "area", "language", "availability"]);
    offerCareRequest(store.base, roster, request.id, "ana", FIXED_NOW);
    respondToCareOffer(store.base, request.id, "ana", false, FIXED_NOW);
    expect(rankCareVolunteers(store.base.doc().careRequests![request.id]!, roster).map((match) => match.peerId)).toEqual(["ben"]);
  });

  it("enforces the offer, acceptance and completion handoff", async () => {
    const store = await freshStore();
    const request = createCareRequest(store.base, input, FIXED_NOW);
    expect(() => offerCareRequest(store.base, roster, request.id, "old")).toThrow(/active/);
    offerCareRequest(store.base, roster, request.id, "ana", FIXED_NOW);
    expect(() => respondToCareOffer(store.base, request.id, "ben", true)).toThrow(/No active offer/);
    expect(() => completeCareRequest(store.base, request.id, "ana")).toThrow(/accepted/);
    respondToCareOffer(store.base, request.id, "ana", true, FIXED_NOW);
    expect(() => completeCareRequest(store.base, request.id, "ben")).toThrow(/assigned/);
    expect(completeCareRequest(store.base, request.id, "ana", FIXED_NOW).status).toBe("Completed");
    expect(() => cancelCareRequest(store.base, request.id)).toThrow(/closed/);
  });

  it("allows a coordinator to reassign or cancel an active request", async () => {
    const store = await freshStore();
    const request = createCareRequest(store.base, input, FIXED_NOW);
    offerCareRequest(store.base, roster, request.id, "ana", FIXED_NOW);
    const reopened = reopenCareRequest(store.base, request.id);
    expect(reopened.status).toBe("Open");
    expect(reopened.offeredTo).toBeUndefined();
    expect(cancelCareRequest(store.base, request.id, FIXED_NOW).status).toBe("Cancelled");
  });
});
