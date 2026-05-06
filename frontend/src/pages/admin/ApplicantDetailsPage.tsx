import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { getApplicant, updateApplicantApproval } from "../../services/adminService";
import type { AdminUserDetails, ApprovalStatus } from "../../types/auth";

const statusClass: Record<ApprovalStatus, string> = {
  pending: "bg-[#DBEAFE] text-[#1D4ED8]",
  under_review: "bg-[#FEF3C7] text-[#B45309]",
  approved: "bg-[#DCFCE7] text-[#15803D]",
  rejected: "bg-[#FEE2E2] text-[#B91C1C]",
  suspended: "bg-[#FEE2E2] text-[#B91C1C]",
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#111827]">{value || "Not provided"}</p>
    </div>
  );
}

export default function ApplicantDetailsPage() {
  const { id } = useParams();
  const userId = Number(id);
  const [applicant, setApplicant] = useState<AdminUserDetails | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;
    let cancelled = false;

    async function loadApplicant() {
      try {
        const row = await getApplicant(userId);
        if (!cancelled) setApplicant(row);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load user");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadApplicant();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const changeStatus = async (approvalStatus: ApprovalStatus) => {
    setIsUpdating(true);
    setError("");
    try {
      const updated = await updateApplicantApproval(userId, approvalStatus);
      setApplicant(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Applicant Details</h1>
          <nav className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
            <Link to="/dashboard" className="hover:text-[#2F80ED]">Dashboard</Link>
            <span>/</span>
            <Link to="/admin/verification" className="hover:text-[#2F80ED]">Verification</Link>
            <span>/</span>
            <span className="text-[#111827]">{applicant?.full_name || "Applicant"}</span>
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || !applicant ? (
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-10 text-center text-sm text-[#6B7280]">
          Loading applicant...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
              <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <h2 className="text-base font-semibold text-[#111827]">Account Info</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[applicant.approval_status]}`}>
                  {applicant.approval_status.replace("_", " ")}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" value={applicant.email} />
                <Field label="Role" value={applicant.role} />
                <Field label="Created" value={formatDate(applicant.created_at)} />
                <Field label="Last Login" value={formatDate(applicant.last_login_at)} />
              </div>
            </section>

            <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
              <h2 className="mb-4 border-b border-[#E5E7EB] pb-4 text-base font-semibold text-[#111827]">
                Profile Info
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" value={applicant.profile.full_name} />
                <Field label="Sex" value={applicant.profile.sex} />
                <Field label="Birthdate" value={applicant.profile.birth_date} />
                <Field label="Mobile" value={applicant.profile.mobile_number} />
                <div className="md:col-span-2">
                  <Field label="Address" value={applicant.profile.address} />
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm shadow-[#111827]/5">
            <h2 className="text-base font-semibold text-[#111827]">Actions</h2>
            <div className="mt-4 grid gap-2">
              <button
                onClick={() => changeStatus("approved")}
                disabled={isUpdating}
                className="rounded-md bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16A34A] disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => changeStatus("rejected")}
                disabled={isUpdating}
                className="rounded-md border border-[#DC3545] bg-white px-4 py-2.5 text-sm font-semibold text-[#DC3545] transition hover:bg-[#DC3545] hover:text-white disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => changeStatus("suspended")}
                disabled={isUpdating}
                className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#F9FAFB] disabled:opacity-60"
              >
                Suspend
              </button>
            </div>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
