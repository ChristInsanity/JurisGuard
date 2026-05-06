import { useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import AddCaseModal from "../components/modals/AddCaseModal";
import AddClientModal from "../components/modals/AddClientModal";
import { StatusBadge } from "../features/criminalCases/components/StatusBadge";
import { useCriminalCasesStore } from "../features/criminalCases/criminalCasesStore";
import type { CaseStatus, ClientRecord, CriminalCaseRecord } from "../types";

const accordionBorderClass: Record<CaseStatus, string> = {
  Pending: "border-l-[#2f80ed]",
  Ongoing: "border-l-[#2f80ed]",
  Terminated: "border-l-[#dc3545]",
};

type CaseFilter = "all" | "urban" | "rural" | "male" | "female" | "terminated";

const filterOptions: Array<{ value: CaseFilter; label: string }> = [
  { value: "all", label: "All Cases" },
  { value: "urban", label: "Urban" },
  { value: "rural", label: "Rural" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "terminated", label: "Terminated" },
];

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M9 3h2v6h6v2h-6v6H9v-6H3V9h6V3Z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M8 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0 2c3.3 0 6 1.6 6 3.5V17H2v-1.5C2 13.6 4.7 12 8 12Zm7-6h2v3h3v2h-3v3h-2v-3h-3V9h3V6Z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M3 5h8v2H3V5Zm10-1h2v1h2v2h-2v1h-2V4ZM3 13h2v-1h2v4H5v-1H3v-2Zm6 0h8v2H9v-2Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M10 4C5.8 4 2.7 7.1 1.5 10c1.2 2.9 4.3 6 8.5 6s7.3-3.1 8.5-6C17.3 7.1 14.2 4 10 4Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.1a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
    </svg>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-[#FFFFFF] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[#111827]/60">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111827]">{value || "-"}</p>
    </div>
  );
}

function CaseFilterSelect({
  value,
  onChange,
}: {
  value: CaseFilter;
  onChange: (value: CaseFilter) => void;
}) {
  const selected = filterOptions.find((option) => option.value === value) ?? filterOptions[0];

  return (
    <div className="flex h-10 items-center gap-2 rounded-md border border-[#212529] bg-white px-3 text-[#111827]">
      <SlidersIcon />
      <select
        className="h-8 min-w-32 bg-white text-sm font-medium text-[#111827] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value as CaseFilter)}
        aria-label="Filter criminal cases"
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="hidden rounded-full bg-[#f1f1f1] px-2 py-0.5 text-xs font-medium text-[#6b7280] lg:inline-flex">
        {selected.label}
      </span>
    </div>
  );
}

function CaseAccordion({ record }: { record: CriminalCaseRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-[10px] border border-l-4 border-[#e5e7eb] bg-white ${accordionBorderClass[record.cases.status_of_case]}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#f8f9fa]"
      >
        <div>
          <p className="text-sm font-semibold text-[#111827]">{record.intake_record.control_no}</p>
          <p className="mt-1 text-xs text-[#111827]/60">{record.cases.title_of_case}</p>
        </div>
        <StatusBadge status={record.cases.status_of_case} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-[#e5e7eb] px-4 py-4">
          <section>
            <h4 className="text-sm font-semibold text-[#111827]">Case Identification</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InfoTile label="Case No" value={record.cases.case_no} />
              <InfoTile label="Court" value={record.cases.court_body} />
              <InfoTile label="Title" value={record.cases.title_of_case} />
              <InfoTile label="Cause of Action" value={record.cases.cause_of_action} />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[#111827]">Detention & Location</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <InfoTile label="Urban/Rural" value={record.cases.location_type} />
              <InfoTile label="Date Confined" value={record.cases.date_of_confinement} />
              <InfoTile label="Place of Detention" value={record.cases.place_of_detention} />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-[#111827]">Case Status</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InfoTile label="Last Action Taken" value={record.cases.last_action_taken} />
              {record.cases.status_of_case === "Terminated" && (
                <>
                  <InfoTile label="Cause of Termination" value={record.cases.cause_of_termination} />
                  <InfoTile label="Date of Termination" value={record.cases.date_of_termination} />
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ClientRecordModal({
  client,
  cases,
  mode,
  onClose,
}: {
  client: ClientRecord | null;
  cases: CriminalCaseRecord[];
  mode: "view" | "edit";
  onClose: () => void;
}) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-2xl shadow-[#111827]/10">
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              {mode === "view" ? "Criminal Case Record" : "Edit Record"}
            </h2>
            <nav className="mt-1 flex items-center gap-2 text-sm text-[#6b7280]">
              <span>Dashboard</span>
              <span>/</span>
              <span>Criminal Cases</span>
              <span>/</span>
              <span className="text-[#111827]">{client.client.name}</span>
            </nav>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[#111827]/60 transition hover:bg-[#F9FAFB] hover:text-[#111827]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-90px)] overflow-y-auto px-6 py-5">
          <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm shadow-[#111827]/5">
            <h3 className="text-base font-semibold text-[#111827]">Person Information</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <InfoTile label="Full Name" value={client.client.name} />
              <InfoTile label="Gender" value={client.client.sex} />
              <InfoTile label="Age" value={client.client.age} />
              <InfoTile label="Contact" value={client.client_details.contact_no} />
              <InfoTile label="Address" value={client.client_details.address} />
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Criminal Cases</h3>
              <p className="text-sm text-[#111827]/60">{cases.length} records</p>
            </div>

            <div className="space-y-3">
              {cases.map((record) => (
                <CaseAccordion key={record.case_id} record={record} />
              ))}
            </div>
          </section>

          {mode === "edit" && (
            <div className="mt-5 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827]/70">
              Edit UI is represented as a frontend state placeholder. No backend, API, or database changes are performed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CriminalCasesPage() {
  const clients = useCriminalCasesStore((state) => state.clients);
  const cases = useCriminalCasesStore((state) => state.cases);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CaseFilter>("all");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<"view" | "edit">("view");

  const rows = useMemo(
    () =>
      cases.map((record) => {
        const client = clients.find((item) => item.client_id === record.client_id);
        return {
          record,
          client,
          clientName: client?.client.name ?? "Unknown client",
        };
      }),
    [cases, clients]
  );

  const filteredRows = useMemo(() => {
    const normalized = search.toLowerCase();
    return rows.filter(({ record, clientName, client }) => {
      const matchesSearch = [
        clientName,
        record.intake_record.control_no,
        record.cases.title_of_case,
        record.cases.case_no,
        record.cases.status_of_case,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);

      const matchesFilter =
        filter === "all" ||
        (filter === "urban" && record.cases.location_type === "Urban") ||
        (filter === "rural" && record.cases.location_type === "Rural") ||
        (filter === "male" && client?.client.sex === "Male") ||
        (filter === "female" && client?.client.sex === "Female") ||
        (filter === "terminated" && record.cases.status_of_case === "Terminated");

      return matchesSearch && matchesFilter;
    });
  }, [filter, rows, search]);

  const activeClient = clients.find((client) => client.client_id === activeClientId) ?? null;
  const activeCases = cases.filter((record) => record.client_id === activeClientId);

  const openRecord = (record: CriminalCaseRecord, mode: "view" | "edit") => {
    setActiveClientId(record.client_id);
    setActionMode(mode);
  };

  return (
    <MainLayout>
      <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#111827]">Criminal Cases</h2>
          <nav className="mt-1 flex items-center gap-2 text-sm text-[#6b7280]">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#111827]">Criminal Cases</span>
          </nav>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setShowCaseModal(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#2f80ed] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f6fd6]"
          >
            <PlusIcon />
            Add Case
          </button>
          <button
            type="button"
            onClick={() => setShowClientModal(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#22c55e] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16a34a]"
          >
            <UserPlusIcon />
            Add Client
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CaseFilterSelect value={filter} onChange={setFilter} />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#6b7280]">Total:</span>
              <span className="rounded-md bg-[#2f80ed] px-2.5 py-1 text-base font-semibold leading-none text-white">
                {filteredRows.length}
              </span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search case..."
            className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] outline-none transition placeholder:text-[#6b7280] focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15 lg:w-1/4"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-[#e5e7eb] text-[0.85rem] text-[#6b7280]">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Control No.</th>
                <th className="px-3 py-3 text-left font-semibold">Party Represented</th>
                <th className="px-3 py-3 text-left font-semibold">Gender / Sex</th>
                <th className="px-3 py-3 text-left font-semibold">Title</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-left font-semibold">Person</th>
                <th className="px-3 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#111827]/50">
                    No criminal cases found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ record, client, clientName }) => (
                  <tr key={record.case_id} className="transition hover:bg-[#F9FAFB]">
                    <td className="px-3 py-4 text-[#111827]">{record.intake_record.control_no}</td>
                    <td className="px-3 py-4 text-[#111827]/80">{record.intake_record.party_represented}</td>
                    <td className="px-3 py-4 text-[#111827]/80">{client?.client.sex ?? "-"}</td>
                    <td className="px-3 py-4 text-[#111827]/80">{record.cases.title_of_case}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={record.cases.status_of_case} />
                    </td>
                    <td className="px-3 py-4 text-[#111827]/80">{clientName}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openRecord(record, "view")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#2f80ed] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f80ed] transition hover:bg-[#2f80ed] hover:text-white"
                        >
                          <EyeIcon />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openRecord(record, "edit")}
                          className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f1f1f1]"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} />
      <AddCaseModal isOpen={showCaseModal} onClose={() => setShowCaseModal(false)} />
      <ClientRecordModal
        mode={actionMode}
        client={activeClient}
        cases={activeCases}
        onClose={() => setActiveClientId(null)}
      />
    </MainLayout>
  );
}
