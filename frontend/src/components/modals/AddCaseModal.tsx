import { CaseWorkflow } from "./CaseWorkflow";
import { useCriminalCasesStore } from "../../features/criminalCases/criminalCasesStore";

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCaseModal({ isOpen, onClose }: AddCaseModalProps) {
  const clients = useCriminalCasesStore((state) => state.clients);
  const addCase = useCriminalCasesStore((state) => state.addCase);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm transition-opacity duration-200">
      <div className="max-h-[92vh] w-full max-w-6xl animate-[modalIn_200ms_ease-out] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-2xl shadow-[#111827]/10">
        <div className="border-b border-[#E5E7EB] bg-[#F3F4F6] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#111827]">Add Criminal Case</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#6B7280] transition duration-200 hover:bg-white hover:text-[#111827]"
            >
              Close
            </button>
          </div>
        </div>

        <CaseWorkflow
          clients={clients}
          onSubmit={(values) => {
            addCase(values);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
