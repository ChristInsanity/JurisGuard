import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { StepIndicator } from "../../features/criminalCases/components/StepIndicator";
import { useCriminalCasesStore } from "../../features/criminalCases/criminalCasesStore";
import { caseFormSchema, type CaseFormValues } from "../../features/criminalCases/schemas";

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: CaseFormValues = {
  client_id: "",
  intake_record: {
    control_no: "",
    form_date: new Date().toISOString().slice(0, 10),
    region: "",
    district_office: "",
    party_represented: "",
    nature_of_request: "",
    nature_of_case: "",
  },
  representative: {
    rep_name: "",
    rep_age: 0,
    rep_sex: "",
    civil_status: "",
    rep_address: "",
    rep_contact_no: "",
    relationship_to_applicant: "",
  },
  adverse_party: {
    name: "",
    address: "",
  },
  cases: {
    title_of_case: "",
    case_no: "",
    court_body: "",
    status_of_case: "Pending",
    last_action_taken: "",
    date_of_confinement: "",
    place_of_detention: "",
    location_type: "",
    cause_of_action: "",
    cause_of_termination: "",
    date_of_termination: "",
  },
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function TextInput({
  label,
  registration,
  error,
  type = "text",
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#111827]/80">{label}</span>
      <input
        type={type}
        {...registration}
        className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
      />
      <FieldError message={error} />
    </label>
  );
}

export default function AddCaseModal({ isOpen, onClose }: AddCaseModalProps) {
  const clients = useCriminalCasesStore((state) => state.clients);
  const addCase = useCriminalCasesStore((state) => state.addCase);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const selectedClientId = watch("client_id");
  const selectedClient = clients.find((client) => client.client_id === selectedClientId);
  const status = watch("cases.status_of_case");
  const filteredClients = useMemo(() => {
    const normalized = query.toLowerCase();
    return clients.filter((client) =>
      `${client.client_id} ${client.client.name}`.toLowerCase().includes(normalized)
    );
  }, [clients, query]);

  if (!isOpen) return null;

  const closeModal = () => {
    reset(defaultValues);
    setQuery("");
    setStep(0);
    onClose();
  };

  const continueToForm = async () => {
    const valid = await trigger("client_id");
    if (!valid) return;
    setStep(1);
  };

  const onSubmit = (values: CaseFormValues) => {
    addCase(values);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#FFFFFF] shadow-2xl shadow-[#111827]/10">
        <div className="border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#111827]">Add Criminal Case</h2>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#111827]/60 transition hover:bg-[#F9FAFB] hover:text-[#111827]/80"
            >
              Close
            </button>
          </div>

          <div className="mt-4">
            <StepIndicator steps={["Search Existing Client", "Case Forms"]} currentStep={step} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[calc(92vh-138px)] flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 0 && (
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <label className="block">
                    <span className="text-sm font-medium text-[#111827]/80">
                      Search existing client
                    </span>
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by name or client id"
                      className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
                    />
                  </label>
                  <FieldError message={errors.client_id?.message} />

                  {selectedClient && (
                    <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4 text-sm">
                      <p className="font-semibold text-[#111827]">{selectedClient.client.name}</p>
                      <p className="mt-1 text-[#2f80ed]">{selectedClient.client_id}</p>
                      <p className="mt-2 text-[#6b7280]">
                        This case will attach to the selected client. Client details will not be encoded again.
                      </p>
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                  <div className="border-b border-[#e5e7eb] bg-[#f8f9fa] px-4 py-3 text-sm font-semibold text-[#111827]/80">
                    Existing Clients
                  </div>
                  <div className="max-h-80 divide-y divide-[#E5E7EB] overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        type="button"
                        key={client.client_id}
                        onClick={() => {
                          setValue("client_id", client.client_id, { shouldValidate: true });
                          setQuery(client.client.name);
                        }}
                        className={`block w-full px-4 py-3 text-left transition ${
                          selectedClientId === client.client_id
                            ? "bg-brand-50"
                            : "bg-[#FFFFFF] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">{client.client.name}</p>
                            <p className="mt-1 text-xs text-[#111827]/60">{client.client_id}</p>
                          </div>
                          <span className="text-xs font-medium text-[#111827]/60">
                            {client.client.sex}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <section className="border-t border-[#e5e7eb] pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-sm font-semibold text-[#111827]">Case Identification</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TextInput label="Control No." registration={register("intake_record.control_no")} error={errors.intake_record?.control_no?.message} />
                    <TextInput label="Form Date" type="date" registration={register("intake_record.form_date")} error={errors.intake_record?.form_date?.message} />
                    <TextInput label="Region" registration={register("intake_record.region")} error={errors.intake_record?.region?.message} />
                    <TextInput label="District Office" registration={register("intake_record.district_office")} error={errors.intake_record?.district_office?.message} />
                    <TextInput label="Party Represented" registration={register("intake_record.party_represented")} error={errors.intake_record?.party_represented?.message} />
                    <TextInput label="Nature of Request" registration={register("intake_record.nature_of_request")} error={errors.intake_record?.nature_of_request?.message} />
                    <TextInput label="Nature of Case" registration={register("intake_record.nature_of_case")} error={errors.intake_record?.nature_of_case?.message} />
                  </div>
                </section>

                <section className="border-t border-[#e5e7eb] pt-4">
                  <h3 className="text-sm font-semibold text-[#111827]">Representative</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TextInput label="Representative Name" registration={register("representative.rep_name")} error={errors.representative?.rep_name?.message} />
                    <TextInput label="Representative Age" type="number" registration={register("representative.rep_age", { valueAsNumber: true })} error={errors.representative?.rep_age?.message} />
                    <TextInput label="Representative Sex" registration={register("representative.rep_sex")} error={errors.representative?.rep_sex?.message} />
                    <TextInput label="Civil Status" registration={register("representative.civil_status")} error={errors.representative?.civil_status?.message} />
                    <TextInput label="Representative Address" registration={register("representative.rep_address")} error={errors.representative?.rep_address?.message} />
                    <TextInput label="Representative Contact No." registration={register("representative.rep_contact_no")} error={errors.representative?.rep_contact_no?.message} />
                    <TextInput label="Relationship to Applicant" registration={register("representative.relationship_to_applicant")} error={errors.representative?.relationship_to_applicant?.message} />
                  </div>
                </section>

                <section className="border-t border-[#e5e7eb] pt-4">
                  <h3 className="text-sm font-semibold text-[#111827]">Adverse Party</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <TextInput label="Name" registration={register("adverse_party.name")} error={errors.adverse_party?.name?.message} />
                    <TextInput label="Address" registration={register("adverse_party.address")} error={errors.adverse_party?.address?.message} />
                  </div>
                </section>

                <section className="border-t border-[#e5e7eb] pt-4">
                  <h3 className="text-sm font-semibold text-[#111827]">Case Status</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TextInput label="Title of Case" registration={register("cases.title_of_case")} error={errors.cases?.title_of_case?.message} />
                    <TextInput label="Case No." registration={register("cases.case_no")} error={errors.cases?.case_no?.message} />
                    <TextInput label="Court Body" registration={register("cases.court_body")} error={errors.cases?.court_body?.message} />
                    <label className="block">
                      <span className="text-sm font-medium text-[#111827]/80">Status of Case</span>
                      <select
                        {...register("cases.status_of_case")}
                        className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
                      >
                        <option>Pending</option>
                        <option>Ongoing</option>
                        <option>Terminated</option>
                      </select>
                    </label>
                    <TextInput label="Last Action Taken" registration={register("cases.last_action_taken")} error={errors.cases?.last_action_taken?.message} />
                    <TextInput label="Date of Confinement" type="date" registration={register("cases.date_of_confinement")} />
                    <TextInput label="Place of Detention" registration={register("cases.place_of_detention")} />
                    <label className="block">
                      <span className="text-sm font-medium text-[#111827]/80">Location Type</span>
                      <select
                        {...register("cases.location_type")}
                        className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
                      >
                        <option value="">Select</option>
                        <option>Urban</option>
                        <option>Rural</option>
                      </select>
                    </label>
                    <TextInput label="Cause of Action" registration={register("cases.cause_of_action")} error={errors.cases?.cause_of_action?.message} />
                    {status === "Terminated" && (
                      <>
                        <TextInput label="Cause of Termination" registration={register("cases.cause_of_termination")} />
                        <TextInput label="Date of Termination" type="date" registration={register("cases.date_of_termination")} />
                      </>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-between border-t border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
            <button
              type="button"
              onClick={() => setStep(0)}
              disabled={step === 0}
              className="rounded-md border border-[#6c757d]/40 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#6c757d] transition hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            {step === 0 ? (
              <button type="button" onClick={continueToForm} className="rounded-md bg-[#2f80ed] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f6fd6]">
                Continue
              </button>
            ) : (
              <button type="submit" className="rounded-md bg-[#2f80ed] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f6fd6]">
                Save Case
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

