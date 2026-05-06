import type { ExtractedClientPayload, ExtractionMap } from "../../types";

const extractedPayload: ExtractedClientPayload = {
  client: {
    name: "Elena Reyes",
    age: 29,
    sex: "Female",
    civil_status: "Single",
    religion: "Catholic",
    educational_attainment: "College Level",
    citizenship: "Filipino",
    language_dialect: "Cebuano",
  },
  client_details: {
    address: "Mintal, Davao City",
    contact_no: "09184561234",
    email: "elena.reyes@example.com",
    individual_monthly_income: "15000",
    spouse: "",
    address_of_spouse: "",
    contact_no_of_spouse: "",
    detained: false,
    detained_since: "",
    place_of_detention: "",
  },
  client_classification: {
    flag_senior: false,
    flag_cicl: false,
    flag_female: true,
    flag_urban: true,
    flag_rural: false,
    flag_drugs: false,
    classification_notes: "Mock OCR extracted ID and intake sheet values.",
  },
};

const indicatorKeys = [
  "client.name",
  "client.age",
  "client.sex",
  "client.civil_status",
  "client.religion",
  "client.educational_attainment",
  "client.citizenship",
  "client.language_dialect",
  "client_details.address",
  "client_details.contact_no",
  "client_details.email",
  "client_details.individual_monthly_income",
  "client_details.spouse",
  "client_details.address_of_spouse",
  "client_details.contact_no_of_spouse",
  "client_details.detained",
  "client_details.detained_since",
  "client_details.place_of_detention",
  "client_classification.flag_senior",
  "client_classification.flag_cicl",
  "client_classification.flag_female",
  "client_classification.flag_urban",
  "client_classification.flag_rural",
  "client_classification.flag_drugs",
  "client_classification.classification_notes",
];

function getNestedValue(source: ExtractedClientPayload, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

export async function runMockClientOcr(): Promise<{
  extracted: ExtractedClientPayload;
  indicators: ExtractionMap;
}> {
  await new Promise((resolve) => window.setTimeout(resolve, 550));

  const indicators = indicatorKeys.reduce<ExtractionMap>((result, key) => {
    const value = getNestedValue(extractedPayload, key);
    result[key] =
      value === "" || value === undefined || value === null ? "missing" : "extracted";
    return result;
  }, {});

  return {
    extracted: extractedPayload,
    indicators,
  };
}
