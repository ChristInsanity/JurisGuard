import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldPath, UseFormRegisterReturn } from "react-hook-form";
import { FieldStatus } from "../../features/criminalCases/components/FieldStatus";
import { StepIndicator } from "../../features/criminalCases/components/StepIndicator";
import { useCamera } from "../../features/criminalCases/hooks/useCamera";
import { useCriminalCasesStore } from "../../features/criminalCases/criminalCasesStore";
import { runMockClientOcr } from "../../features/criminalCases/mockOcrService";
import { clientFormSchema, type ClientFormValues } from "../../features/criminalCases/schemas";
import type { ExtractionMap, ExtractedClientPayload, IntakeMethod } from "../../types";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: ClientFormValues = {
  client: {
    name: "",
    age: 0,
    sex: "",
    civil_status: "",
    religion: "",
    educational_attainment: "",
    citizenship: "Filipino",
    language_dialect: "",
  },
  client_details: {
    address: "",
    contact_no: "",
    email: "",
    individual_monthly_income: "",
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
    flag_female: false,
    flag_urban: false,
    flag_rural: false,
    flag_drugs: false,
    classification_notes: "",
  },
};

const steps = ["CLIENT", "CLIENT_DETAILS", "CLIENT_CLASSIFICATION"];

const stepFields: Array<Array<FieldPath<ClientFormValues>>> = [
  [
    "client.name",
    "client.age",
    "client.sex",
    "client.civil_status",
    "client.religion",
    "client.educational_attainment",
    "client.citizenship",
    "client.language_dialect",
  ],
  [
    "client_details.address",
    "client_details.contact_no",
    "client_details.email",
    "client_details.individual_monthly_income",
  ],
  [],
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function TextInput({
  label,
  registration,
  error,
  type = "text",
  status,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  status?: ExtractionMap[string];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#111827]/80">
        {label}
        <FieldStatus status={status} />
      </span>
      <input
        type={type}
        {...registration}
        className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
      />
      <FieldError message={error} />
    </label>
  );
}

function SelectInput({
  label,
  registration,
  error,
  status,
  options,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  status?: ExtractionMap[string];
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#111827]/80">
        {label}
        <FieldStatus status={status} />
      </span>
      <select
        {...registration}
        className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2f80ed] focus:ring-2 focus:ring-[#2f80ed]/15"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FieldError message={error} />
    </label>
  );
}

function getPayloadValue(payload: ExtractedClientPayload, path: FieldPath<ClientFormValues>) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, payload);
}

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const addClient = useCriminalCasesStore((state) => state.addClient);
  const [method, setMethod] = useState<IntakeMethod | null>(null);
  const [step, setStep] = useState(0);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentLabel, setDocumentLabel] = useState("");
  const [indicators, setIndicators] = useState<ExtractionMap>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame,
  } = useCamera();
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  if (!isOpen) return null;

  const values = watch();
  const hasOcrResult = Object.keys(indicators).length > 0;

  const closeModal = () => {
    stopCamera();
    reset(defaultValues);
    setMethod(null);
    setStep(0);
    setDocumentPreview(null);
    setDocumentLabel("");
    setIndicators({});
    onClose();
  };

  const applyExtractedPayload = (payload: ExtractedClientPayload) => {
    const fieldPaths = [
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
    ] as Array<FieldPath<ClientFormValues>>;

    fieldPaths.forEach((path) => {
      const current = getValues(path);
      const extracted = getPayloadValue(payload, path);
      const isEmpty = current === "" || current === false || current === 0 || current === undefined;

      if (isEmpty && extracted !== undefined && extracted !== null && extracted !== "") {
        setValue(path, extracted as never, { shouldDirty: true, shouldValidate: true });
      }
    });
  };

  const runOcr = async (preview: string, label: string) => {
    setDocumentPreview(preview);
    setDocumentLabel(label);
    setIsExtracting(true);

    const result = await runMockClientOcr();
    setIndicators(result.indicators);
    applyExtractedPayload(result.extracted);
    setIsExtracting(false);
    setStep(0);
  };

  const handleCapture = async () => {
    const captured = captureFrame() || "";
    await runOcr(captured, "Live camera capture");
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      await runOcr("", file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      await runOcr(String(reader.result), file.name);
    };
    reader.readAsDataURL(file);
  };

  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const onSubmit = (data: ClientFormValues) => {
    addClient(data);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#FFFFFF] shadow-2xl shadow-[#111827]/10">
        <div className="border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#111827]">Add Client</h2>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#111827]/60 transition hover:bg-[#F9FAFB] hover:text-[#111827]/80"
            >
              Close
            </button>
          </div>
        </div>

        {!method ? (
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {[
              ["manual", "Manual Entry", "Encode client details using a guided form."],
              ["camera", "Live Camera OCR", "Start camera, capture a document, then review extracted fields."],
              ["upload", "Upload Document OCR", "Upload an image or PDF and review mock OCR results."],
            ].map(([value, title, description]) => (
              <button
                type="button"
                key={value}
                onClick={() => setMethod(value as IntakeMethod)}
                className="rounded-lg border border-[#e5e7eb] bg-[#FFFFFF] p-5 text-left shadow-sm transition hover:border-[#2f80ed] hover:bg-[#f8f9fa]"
              >
                <p className="text-base font-semibold text-[#111827]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#111827]/60">{description}</p>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[calc(92vh-74px)] flex-col">
            <div className="border-b border-[#e5e7eb] px-6 py-4">
              <StepIndicator steps={steps} currentStep={step} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {method === "camera" && (
                <div className="mb-5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-video w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] object-cover"
                    />
                    <div className="space-y-3">
                      <button type="button" onClick={startCamera} className="w-full rounded-md bg-[#2f80ed] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fd6]">
                        Start Camera
                      </button>
                      <button type="button" onClick={stopCamera} className="w-full rounded-md border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#111827]/80 hover:bg-[#F9FAFB]">
                        Stop Camera
                      </button>
                      <button type="button" disabled={!isCameraActive || isExtracting} onClick={handleCapture} className="w-full rounded-md border border-[#2f80ed] bg-white px-4 py-2 text-sm font-semibold text-[#2f80ed] hover:bg-[#2f80ed] hover:text-white disabled:opacity-50">
                        {isExtracting ? "Extracting..." : "Capture"}
                      </button>
                      {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
                    </div>
                  </div>
                </div>
              )}

              {method === "upload" && (
                <div className="mb-5 rounded-lg border border-dashed border-[#e5e7eb] bg-[#f8f9fa] p-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-[#111827]/80">Upload image or PDF</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      onChange={handleUpload}
                      className="mt-3 block w-full text-sm text-[#111827]/70 file:mr-4 file:rounded-md file:border-0 file:bg-[#2f80ed] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </label>
                </div>
              )}

              {hasOcrResult && (
                <div className="mb-5 grid gap-4 rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-4 lg:grid-cols-[220px_1fr]">
                  <div>
                    {documentPreview ? (
                      <img src={documentPreview} alt="Document preview" className="max-h-40 w-full rounded-md border border-emerald-200 object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-md border border-emerald-200 bg-[#FFFFFF] text-sm font-medium text-emerald-700">
                        {documentLabel || "PDF document"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Review extracted fields before saving.</p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Mock OCR filled empty fields only. Extracted and missing indicators are shown beside labels.
                    </p>
                  </div>
                </div>
              )}

              {step === 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Name" registration={register("client.name")} error={errors.client?.name?.message} status={indicators["client.name"]} />
                  <TextInput label="Age" type="number" registration={register("client.age", { valueAsNumber: true })} error={errors.client?.age?.message} status={indicators["client.age"]} />
                  <SelectInput label="Sex" registration={register("client.sex")} error={errors.client?.sex?.message} status={indicators["client.sex"]} options={["Female", "Male"]} />
                  <TextInput label="Civil Status" registration={register("client.civil_status")} error={errors.client?.civil_status?.message} status={indicators["client.civil_status"]} />
                  <TextInput label="Religion" registration={register("client.religion")} error={errors.client?.religion?.message} status={indicators["client.religion"]} />
                  <TextInput label="Educational Attainment" registration={register("client.educational_attainment")} error={errors.client?.educational_attainment?.message} status={indicators["client.educational_attainment"]} />
                  <TextInput label="Citizenship" registration={register("client.citizenship")} error={errors.client?.citizenship?.message} status={indicators["client.citizenship"]} />
                  <TextInput label="Language / Dialect" registration={register("client.language_dialect")} error={errors.client?.language_dialect?.message} status={indicators["client.language_dialect"]} />
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextInput label="Address" registration={register("client_details.address")} error={errors.client_details?.address?.message} status={indicators["client_details.address"]} />
                  </div>
                  <TextInput label="Contact No." registration={register("client_details.contact_no")} error={errors.client_details?.contact_no?.message} status={indicators["client_details.contact_no"]} />
                  <TextInput label="Email" type="email" registration={register("client_details.email")} error={errors.client_details?.email?.message} status={indicators["client_details.email"]} />
                  <TextInput label="Individual Monthly Income" registration={register("client_details.individual_monthly_income")} error={errors.client_details?.individual_monthly_income?.message} status={indicators["client_details.individual_monthly_income"]} />
                  <TextInput label="Spouse" registration={register("client_details.spouse")} status={indicators["client_details.spouse"]} />
                  <TextInput label="Address of Spouse" registration={register("client_details.address_of_spouse")} status={indicators["client_details.address_of_spouse"]} />
                  <TextInput label="Contact No. of Spouse" registration={register("client_details.contact_no_of_spouse")} status={indicators["client_details.contact_no_of_spouse"]} />
                  <label className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm font-medium text-[#111827]/80">
                    <input type="checkbox" {...register("client_details.detained")} className="h-4 w-4 rounded border-[#E5E7EB] text-brand-600" />
                    Detained
                    <FieldStatus status={indicators["client_details.detained"]} />
                  </label>
                  <TextInput label="Detained Since" type="date" registration={register("client_details.detained_since")} status={indicators["client_details.detained_since"]} />
                  <TextInput label="Place of Detention" registration={register("client_details.place_of_detention")} status={indicators["client_details.place_of_detention"]} />
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                  <h3 className="text-base font-semibold text-[#111827]">Classification</h3>
                    <p className="mt-1 text-sm text-[#111827]/60">Include all classification fields before saving.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["flag_senior", "Senior Citizen"],
                        ["flag_cicl", "Child in Conflict with the Law"],
                        ["flag_female", "Female"],
                        ["flag_urban", "Urban"],
                        ["flag_rural", "Rural"],
                        ["flag_drugs", "Drug-related"],
                      ].map(([name, label]) => (
                        <label key={name} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm font-medium text-[#111827]/80">
                          <input
                            type="checkbox"
                            {...register(`client_classification.${name as keyof ClientFormValues["client_classification"]}`)}
                            className="h-4 w-4 rounded border-[#E5E7EB] text-brand-600"
                          />
                          {label}
                          <FieldStatus status={indicators[`client_classification.${name}`]} />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <TextInput label="Classification Notes" registration={register("client_classification.classification_notes")} status={indicators["client_classification.classification_notes"]} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <h3 className="text-sm font-semibold text-[#111827]">Review client information before saving.</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-[#111827]/60">Client</dt>
                        <dd className="font-medium text-[#111827]">{values.client.name || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#111827]/60">Contact</dt>
                        <dd className="font-medium text-[#111827]">{values.client_details.contact_no || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-[#111827]/60">Address</dt>
                        <dd className="font-medium text-[#111827]">{values.client_details.address || "Not provided"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-between border-t border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
              <button
                type="button"
                onClick={() => (step === 0 ? setMethod(null) : setStep((current) => Math.max(current - 1, 0)))}
                className="rounded-md border border-[#6c757d]/40 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#6c757d] transition hover:bg-[#f8f9fa]"
              >
                Back
              </button>

              {step < steps.length - 1 ? (
                <button type="button" onClick={nextStep} className="rounded-md bg-[#2f80ed] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f6fd6]">
                  Continue
                </button>
              ) : (
                <button type="submit" className="rounded-md bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16a34a]">
                  Save Client
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

