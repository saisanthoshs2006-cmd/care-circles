import type { DocHandle } from "@automerge/automerge-repo";
import { newId, nowIso, type BamDoc, type CareRequest, type RosterDoc, type RosterMember } from "../schema.ts";

export interface CareInput {
  title: string;
  category: string;
  neighborhood?: string;
  language?: string;
  availability?: string;
  details?: string;
  consent: boolean;
}

export interface CareMatch {
  peerId: string;
  name: string;
  score: number;
  reasons: string[];
}

function clean(value: string | undefined, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

export function createCareRequest(handle: DocHandle<BamDoc>, input: CareInput, at = nowIso()): CareRequest {
  const title = clean(input.title, 100);
  const category = clean(input.category, 40);
  if (!title || !category) throw new Error("A title and help type are required.");
  if (!input.consent) throw new Error("Confirm that the requester agreed to share these task details with volunteers.");
  const request: CareRequest = {
    id: newId(), title, category,
    neighborhood: clean(input.neighborhood, 80),
    language: clean(input.language, 80),
    availability: clean(input.availability, 100),
    details: clean(input.details, 500),
    status: "Open", declinedBy: [], createdAt: at,
  };
  handle.change((doc) => {
    if (!doc.careRequests) doc.careRequests = {};
    doc.careRequests[request.id] = request;
  });
  return request;
}

export function listCareRequests(doc: BamDoc): CareRequest[] {
  return Object.values(doc.careRequests ?? {}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function activeVolunteer(member: RosterMember): boolean {
  return member.role === "volunteer" && !member.revokedAt;
}

/** Transparent suggestions; never an automatic assignment. */
export function rankCareVolunteers(request: CareRequest, roster: RosterDoc): CareMatch[] {
  if (request.status !== "Open") return [];
  return Object.values(roster.members)
    .filter((member) => activeVolunteer(member) && !request.declinedBy.includes(member.peerId))
    .map((member) => {
      const profile = member.profile;
      const reasons: string[] = [];
      let score = 0;
      if (profile?.skills && profile.skills.toLowerCase().includes(request.category.toLowerCase())) {
        score += 4; reasons.push("help type");
      }
      if (request.neighborhood && profile?.neighborhood &&
          profile.neighborhood.toLowerCase().includes(request.neighborhood.toLowerCase())) {
        score += 3; reasons.push("area");
      }
      if (request.language && profile?.languages?.some((language) => language.toLowerCase() === request.language.toLowerCase())) {
        score += 2; reasons.push("language");
      }
      if (request.availability && profile?.availability?.some((time) => time.toLowerCase().includes(request.availability.toLowerCase()))) {
        score += 2; reasons.push("availability");
      }
      if (/transport|delivery/i.test(request.category) && ["car", "van", "bike"].includes(profile?.vehicle ?? "")) {
        score += 2; reasons.push("transport");
      }
      return { peerId: member.peerId, name: member.name, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function changeRequest(handle: DocHandle<BamDoc>, id: string, update: (request: CareRequest) => void): CareRequest {
  if (!handle.doc().careRequests?.[id]) throw new Error("Help request not found.");
  handle.change((doc) => update(doc.careRequests![id]!));
  return handle.doc().careRequests![id]!;
}

export function offerCareRequest(handle: DocHandle<BamDoc>, roster: RosterDoc, id: string, peerId: string, at = nowIso()): CareRequest {
  const member = roster.members[peerId];
  if (!member || !activeVolunteer(member)) throw new Error("Choose an active volunteer.");
  return changeRequest(handle, id, (request) => {
    if (request.status !== "Open") throw new Error("Only open requests can be offered.");
    if (request.declinedBy.includes(peerId)) throw new Error("This volunteer already declined this request.");
    request.status = "Offered";
    request.offeredTo = peerId;
    request.offeredAt = at;
  });
}

export function respondToCareOffer(handle: DocHandle<BamDoc>, id: string, peerId: string, accept: boolean, at = nowIso()): CareRequest {
  return changeRequest(handle, id, (request) => {
    if (request.status !== "Offered" || request.offeredTo !== peerId) throw new Error("No active offer for this volunteer.");
    if (accept) {
      request.status = "Accepted";
      request.acceptedAt = at;
    } else {
      request.status = "Open";
      request.declinedBy.push(peerId);
      delete request.offeredTo;
      delete request.offeredAt;
    }
  });
}

export function completeCareRequest(handle: DocHandle<BamDoc>, id: string, peerId: string, at = nowIso()): CareRequest {
  return changeRequest(handle, id, (request) => {
    if (request.status !== "Accepted" || request.offeredTo !== peerId) throw new Error("Only the assigned volunteer can complete an accepted request.");
    request.status = "Completed";
    request.completedAt = at;
  });
}

export function reopenCareRequest(handle: DocHandle<BamDoc>, id: string): CareRequest {
  return changeRequest(handle, id, (request) => {
    if (request.status !== "Offered" && request.status !== "Accepted") throw new Error("Only an offered or accepted request can be reopened.");
    request.status = "Open";
    delete request.offeredTo;
    delete request.offeredAt;
    delete request.acceptedAt;
  });
}

export function cancelCareRequest(handle: DocHandle<BamDoc>, id: string, at = nowIso()): CareRequest {
  return changeRequest(handle, id, (request) => {
    if (request.status === "Completed" || request.status === "Cancelled") throw new Error("This request is already closed.");
    request.status = "Cancelled";
    request.cancelledAt = at;
  });
}
