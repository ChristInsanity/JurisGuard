import MainLayout from "../layouts/MainLayout";
import { StatusBadge } from "../features/criminalCases/components/StatusBadge";
import { useCriminalCasesStore } from "../features/criminalCases/criminalCasesStore";

const isTerminated = (status: string) => status.toLowerCase() === "terminated";

export default function Dashboard() {
  const cases = useCriminalCasesStore((state) => state.cases);

  const terminatedCases = cases.filter((item) => isTerminated(item.cases.status_of_case)).length;
  const ongoingCases = cases.length - terminatedCases;

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1D4ED8]">Overview</p>
          <h2 className="text-2xl font-bold text-[#111827]">Case Dashboard</h2>
        </div>
        <p className="text-sm text-[#111827]/60">Frontend mock data while backend integration is pending</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
          <p className="text-sm text-[#111827]/60">Total Criminal Cases</p>
          <h3 className="mt-2 text-3xl font-bold text-[#111827]">{cases.length}</h3>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
          <p className="text-sm text-[#111827]/60">Ongoing Cases</p>
          <h3 className="mt-2 text-3xl font-bold text-[#111827]">{ongoingCases}</h3>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
          <p className="text-sm text-[#111827]/60">Terminated Cases</p>
          <h3 className="mt-2 text-3xl font-bold text-[#111827]">{terminatedCases}</h3>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm shadow-[#111827]/5">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="font-semibold text-[#111827]">Recent Criminal Cases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#111827]/60">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Control No.</th>
                <th className="px-5 py-3 text-left font-medium">Title</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-[#111827]/50">
                    No criminal cases recorded yet.
                  </td>
                </tr>
              ) : (
                cases.slice(0, 8).map((item) => (
                  <tr key={item.case_id} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-medium text-[#111827]">{item.intake_record.control_no}</td>
                    <td className="px-5 py-3 text-[#111827]/80">{item.cases.title_of_case}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.cases.status_of_case} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
