export type CaseStatus = "Pending" | "Ongoing" | "Terminated";
export type IntakeMethod = "manual" | "camera" | "upload";
export type ExtractionStatus = "extracted" | "missing";

export interface Client {
  client_id: string;
  name: string;
  age: number;
  sex: string;
  civil_status: string;
  religion: string;
  educational_attainment: string;
  citizenship: string;
  language_dialect: string;
}

export interface ClientDetails {
  address: string;
  contact_no: string;
  email: string;
  individual_monthly_income: string;
  spouse: string;
  address_of_spouse: string;
  contact_no_of_spouse: string;
  detained: boolean;
  detained_since: string;
  place_of_detention: string;
}

export interface ClientClassification {
  flag_senior: boolean;
  flag_cicl: boolean;
  flag_female: boolean;
  flag_urban: boolean;
  flag_rural: boolean;
  flag_drugs: boolean;
  classification_notes: string;
}

export interface ClientRecord {
  client_id: string;
  client: Client;
  client_details: ClientDetails;
  client_classification: ClientClassification;
}

export interface IntakeRecord {
  control_no: string;
  form_date: string;
  region: string;
  district_office: string;
  party_represented: string;
  nature_of_request: string;
  nature_of_case: string;
}

export interface Representative {
  rep_name: string;
  rep_age: number;
  rep_sex: string;
  civil_status: string;
  rep_address: string;
  rep_contact_no: string;
  relationship_to_applicant: string;
}

export interface AdverseParty {
  name: string;
  address: string;
}

export interface CaseDetails {
  title_of_case: string;
  case_no: string;
  court_body: string;
  status_of_case: CaseStatus;
  last_action_taken: string;
  date_of_confinement: string;
  place_of_detention: string;
  location_type: "Urban" | "Rural" | "";
  cause_of_action: string;
  cause_of_termination: string;
  date_of_termination: string;
}

export interface CriminalCaseRecord {
  case_id: string;
  client_id: string;
  intake_record: IntakeRecord;
  representative: Representative;
  adverse_party: AdverseParty;
  cases: CaseDetails;
  last_updated: string;
}

export interface ExtractedClientPayload {
  client: Partial<Omit<Client, "client_id">>;
  client_details: Partial<ClientDetails>;
  client_classification: Partial<ClientClassification>;
}

export type ExtractionMap = Record<string, ExtractionStatus>;

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
