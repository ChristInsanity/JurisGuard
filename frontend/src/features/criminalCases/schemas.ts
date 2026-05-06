import { z } from "zod";

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);
const optionalText = z.string().trim();

export const clientFormSchema = z.object({
  client: z.object({
    name: requiredText("Name"),
    age: z.number().int().min(0, "Age must be 0 or higher"),
    sex: requiredText("Sex"),
    civil_status: requiredText("Civil status"),
    religion: requiredText("Religion"),
    educational_attainment: requiredText("Educational attainment"),
    citizenship: requiredText("Citizenship"),
    language_dialect: requiredText("Language / dialect"),
  }),
  client_details: z.object({
    address: requiredText("Address"),
    contact_no: requiredText("Contact number"),
    email: z.string().trim().email("Enter a valid email").or(z.literal("")),
    individual_monthly_income: requiredText("Individual monthly income"),
    spouse: optionalText,
    address_of_spouse: optionalText,
    contact_no_of_spouse: optionalText,
    detained: z.boolean(),
    detained_since: optionalText,
    place_of_detention: optionalText,
  }),
  client_classification: z.object({
    flag_senior: z.boolean(),
    flag_cicl: z.boolean(),
    flag_female: z.boolean(),
    flag_urban: z.boolean(),
    flag_rural: z.boolean(),
    flag_drugs: z.boolean(),
    classification_notes: optionalText,
  }),
});

export const caseFormSchema = z.object({
  client_id: requiredText("Client"),
  intake_record: z.object({
    control_no: requiredText("Control number"),
    form_date: requiredText("Form date"),
    region: requiredText("Region"),
    district_office: requiredText("District office"),
    party_represented: requiredText("Party represented"),
    nature_of_request: requiredText("Nature of request"),
    nature_of_case: requiredText("Nature of case"),
  }),
  representative: z.object({
    rep_name: requiredText("Representative name"),
    rep_age: z.number().int().min(0, "Age must be 0 or higher"),
    rep_sex: requiredText("Representative sex"),
    civil_status: requiredText("Civil status"),
    rep_address: requiredText("Representative address"),
    rep_contact_no: requiredText("Representative contact number"),
    relationship_to_applicant: requiredText("Relationship to applicant"),
  }),
  adverse_party: z.object({
    name: requiredText("Adverse party name"),
    address: requiredText("Adverse party address"),
  }),
  cases: z.object({
    title_of_case: requiredText("Title of case"),
    case_no: requiredText("Case number"),
    court_body: requiredText("Court body"),
    status_of_case: z.enum(["Pending", "Ongoing", "Terminated"]),
    last_action_taken: requiredText("Last action taken"),
    date_of_confinement: optionalText,
    place_of_detention: optionalText,
    location_type: z.enum(["Urban", "Rural", ""]),
    cause_of_action: requiredText("Cause of action"),
    cause_of_termination: optionalText,
    date_of_termination: optionalText,
  }),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type CaseFormValues = z.infer<typeof caseFormSchema>;
