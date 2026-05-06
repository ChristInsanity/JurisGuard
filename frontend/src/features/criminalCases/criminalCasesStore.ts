import { create } from "zustand";
import type { ClientRecord, CriminalCaseRecord } from "../../types";
import type { CaseFormValues, ClientFormValues } from "./schemas";
import { mockCases, mockClients } from "./mockData";

interface CriminalCasesState {
  clients: ClientRecord[];
  cases: CriminalCaseRecord[];
  addClient: (values: ClientFormValues) => ClientRecord;
  addCase: (values: CaseFormValues) => CriminalCaseRecord;
}

const nextClientId = (count: number) => `CL-2026-${String(count + 1).padStart(3, "0")}`;
const nextCaseId = (count: number) => `CASE-2026-${String(count + 1).padStart(3, "0")}`;

export const useCriminalCasesStore = create<CriminalCasesState>((set, get) => ({
  clients: mockClients,
  cases: mockCases,
  addClient: (values) => {
    const client_id = nextClientId(get().clients.length);
    const client: ClientRecord = {
      client_id,
      client: {
        client_id,
        ...values.client,
      },
      client_details: values.client_details,
      client_classification: values.client_classification,
    };

    set((state) => ({ clients: [client, ...state.clients] }));
    return client;
  },
  addCase: (values) => {
    const record: CriminalCaseRecord = {
      case_id: nextCaseId(get().cases.length),
      client_id: values.client_id,
      intake_record: values.intake_record,
      representative: values.representative,
      adverse_party: values.adverse_party,
      cases: values.cases,
      last_updated: new Date().toISOString().slice(0, 10),
    };

    set((state) => ({ cases: [record, ...state.cases] }));
    return record;
  },
}));
