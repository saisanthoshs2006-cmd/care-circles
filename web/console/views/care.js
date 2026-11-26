/* Care Circles: small, consented help requests with a human handoff. */
(function () {
  "use strict";
  const { h, clear, toast, api } = window.BAM;

  function field(label, control) {
    const id = `care-${Math.random().toString(36).slice(2)}`;
    control.id = id;
    return h("div", { class: "field" }, h("label", { class: "label", for: id }, label), control);
  }

  function render(container) {
    const admin = !!window.BAM.access?.isAdmin?.();
    const people = window.BAM.access?.members?.() || [];
    const me = window.BAM.access?.myPeerId;
    clear(container);
    container.append(
      h("div", { class: "view-heading" },
        h("h1", {}, "Care Circles"),
        h("p", { class: "muted" }, "A small request, a suitable volunteer, and a clear follow-through."))
    );

    if (admin) container.append(createForm());
    const region = h("div", { class: "stack" });
    container.append(region);
    void load();

    async function load() {
      clear(region);
      region.append(h("p", { class: "muted" }, "Loading help requests…"));
      try {
        const rows = await api.careList();
        clear(region);
        const active = rows.filter((row) => !["Completed", "Cancelled"].includes(row.status));
        region.append(
          h("div", { class: "row row--between" },
            h("h2", {}, admin ? "Community requests" : "Requests offered to you"),
            h("button", { type: "button", class: "btn btn-secondary", onclick: load }, "Refresh"))
        );
        if (admin) {
          const completed = rows.filter((row) => row.status === "Completed").length;
          region.append(h("p", { class: "muted" }, `${active.length} active · ${completed} completed. Counts reflect only requests recorded here.`));
        }
        if (!rows.length) {
          region.append(h("div", { class: "card empty-state" }, admin
            ? "No requests yet. Create one above using fictional details for a demo."
            : "Nothing has been offered to you yet."));
        } else {
          active.concat(rows.filter((row) => ["Completed", "Cancelled"].includes(row.status)))
            .forEach((row) => region.append(requestCard(row)));
        }
      } catch (error) {
        clear(region);
        region.append(h("div", { class: "card empty-state" }, error?.detail || "Could not load requests."));
      }
    }

    function createForm() {
      const form = h("form", { class: "card stack" });
      const title = h("input", { class: "input", required: true, maxlength: "100", placeholder: "e.g. Help setting up a laptop" });
      const category = h("select", { class: "input", required: true },
        ["Technology", "Tutoring", "Groceries", "Transport", "Companionship", "Other"].map((name) => h("option", { value: name }, name)));
      const neighborhood = h("input", { class: "input", maxlength: "80", placeholder: "Optional area only" });
      const language = h("select", { class: "input" },
        h("option", { value: "" }, "No language preference"),
        (window.BAM.LANGUAGES || []).map((name) => h("option", { value: name }, name)));
      const availability = h("input", { class: "input", maxlength: "100", placeholder: "e.g. Weekends" });
      const details = h("textarea", { class: "input", maxlength: "500", rows: "3", placeholder: "Task details only. Do not enter phone numbers, addresses, or private information." });
      const consent = h("input", { type: "checkbox", required: true });
      const submit = h("button", { class: "btn btn-primary", type: "submit" }, "Create request");
      form.append(
        h("h2", { class: "card__title" }, "Ask for help"),
        h("p", { class: "muted" }, "A coordinator records the task. The requester must agree before volunteers can see these details."),
        field("What help is needed?", title), field("Help type", category),
        field("Neighborhood or area", neighborhood), field("Preferred language", language),
        field("Availability", availability), field("Details", details),
        h("label", { class: "row" }, consent, "I confirm the requester agreed to share these task details with enrolled volunteers."),
        submit
      );
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submit.disabled = true;
        try {
          await api.careCreate({ title: title.value, category: category.value,
            neighborhood: neighborhood.value, language: language.value,
            availability: availability.value, details: details.value, consent: consent.checked });
          toast("Request created.", "success");
          form.reset();
          await load();
        } catch (error) {
          toast(error?.detail || "Could not create request.", "error");
        } finally { submit.disabled = false; }
      });
      return form;
    }

    function requestCard(row) {
      const assigned = people.find((member) => member.peerId === row.offeredTo);
      const card = h("article", { class: "card stack" },
        h("div", { class: "row row--between" },
          h("h3", { class: "card__title", style: { margin: "0" } }, row.title),
          h("span", { class: "badge badge-open" }, row.status)),
        h("p", { class: "muted", style: { margin: "0" } },
          [row.category, row.neighborhood, row.language && window.BAM.langShort(row.language), row.availability].filter(Boolean).join(" · ")),
        row.details ? h("p", {}, row.details) : null,
        assigned ? h("p", { class: "muted" }, `Volunteer: ${assigned.name}`) : null
      );
      const actions = h("div", { class: "row", style: { flexWrap: "wrap" } });
      card.append(actions);
      if (admin && row.status === "Open") {
        const matches = h("div", { class: "stack" });
        actions.append(h("button", { class: "btn btn-primary", type: "button", onclick: async () => {
          clear(matches);
          try {
            const suggestions = await api.careMatches(row.id);
            if (!suggestions.length) matches.append(h("p", { class: "muted" }, "No available enrolled volunteers. Invite one from Volunteers."));
            suggestions.forEach((candidate) => matches.append(
              h("div", { class: "row row--between" },
                h("span", {}, `${candidate.name} · ${candidate.reasons.length ? candidate.reasons.join(", ") : "profile fit unknown"}`),
                h("button", { class: "btn btn-secondary", type: "button", onclick: () => act(() => api.careOffer(row.id, candidate.peerId), "Offer sent") }, "Offer task"))));
          } catch (error) { toast(error?.detail || "Could not find volunteers.", "error"); }
        } }, "Find volunteers"));
        card.append(matches);
      }
      if (!admin && row.status === "Offered" && row.offeredTo === me) {
        actions.append(
          h("button", { class: "btn btn-primary", type: "button", onclick: () => act(() => api.careRespond(row.id, true), "Task accepted") }, "I can help"),
          h("button", { class: "btn btn-secondary", type: "button", onclick: () => act(() => api.careRespond(row.id, false), "Offer declined") }, "I can't help"));
      }
      if (!admin && row.status === "Accepted" && row.offeredTo === me) {
        actions.append(h("button", { class: "btn btn-primary", type: "button", onclick: () => act(() => api.careComplete(row.id), "Task completed") }, "Mark completed"));
      }
      if (admin && ["Offered", "Accepted"].includes(row.status)) {
        actions.append(h("button", { class: "btn btn-secondary", type: "button", onclick: () => act(() => api.careReopen(row.id), "Request reopened") }, "Reassign"));
      }
      if (admin && !["Completed", "Cancelled"].includes(row.status)) {
        actions.append(h("button", { class: "btn btn-ghost", type: "button", onclick: () => act(() => api.careCancel(row.id), "Request cancelled") }, "Cancel"));
      }
      return card;
    }

    async function act(operation, success) {
      try { await operation(); toast(success, "success"); await load(); }
      catch (error) { toast(error?.detail || "Could not update request.", "error"); }
    }
  }

  window.BAM.registerView("care", { title: "Care Circles", icon: "♥", render });
})();
