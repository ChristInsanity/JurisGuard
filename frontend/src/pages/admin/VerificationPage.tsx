import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { listApplicants, updateApplicantApproval } from "../../services/adminService";
import type { AdminUserListItem, ApprovalStatus } from "../../types/auth";

const statusLabel: Record<ApprovalStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const statusClass: Record<ApprovalStatus, string> = {
  pending: "bg-[#DBEAFE] text-[#1D4ED8]",
  under_review: "bg-[#FEF3C7] text-[#B45309]",
  approved: "bg-[#DCFCE7] text-[#15803D]",
  rejected: "bg-[#FEE2E2] text-[#B91C1C]",
  suspended: "bg-[#FEE2E2] text-[#B91C1C]",
};

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/[ @.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function VerificationPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [filter, setFilter] = useState<ApprovalStatus | "all">("pending");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const rows = await listApplicants(filter === "all" ? undefined : filter);
        if (!cancelled) setUsers(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load users");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const activeCount = useMemo(() => users.length, [users.length]);

  const changeStatus = async (userId: number, approvalStatus: ApprovalStatus) => {
    setUpdatingId(userId);
    setError("");
    try {
      await updateApplicantApproval(userId, approvalStatus);
      const rows = await listApplicants(filter === "all" ? undefined : filter);
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Admin Verification</h1>
          <nav className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#111827]">Verification</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as ApprovalStatus | "all")}
            className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/15"
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="all">All Users</option>
          </select>
          <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
            {activeCount}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm shadow-[#111827]/5">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-base font-semibold text-[#111827]">User Applications</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Review registrations and update approval status.
          </p>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="divide-y divide-[#E5E7EB]">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-[#6B7280]">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#6B7280]">No users found.</div>
          ) : (
            users.map((user) => (
              <div
                key={user.user_id}
                className="grid gap-4 px-5 py-4 transition hover:bg-[#F9FAFB] lg:grid-cols-[1fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2F80ED] text-sm font-semibold text-white">
                    {initials(user.full_name, user.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {user.full_name || "Profile pending"}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[user.approval_status]}`}>
                        {statusLabel[user.approval_status]}
                      </span>
                      <span className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-xs font-semibold text-[#111827]">
                        {user.role}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[#6B7280]">{user.email}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Registered {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Link
                    to={`/admin/users/${user.user_id}`}
                    className="rounded-md border border-[#2F80ED] bg-white px-3 py-2 text-sm font-semibold text-[#2F80ED] transition hover:bg-[#2F80ED] hover:text-white"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => changeStatus(user.user_id, "approved")}
                    disabled={updatingId === user.user_id}
                    className="rounded-md bg-[#22C55E] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#16A34A] disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => changeStatus(user.user_id, "rejected")}
                    disabled={updatingId === user.user_id}
                    className="rounded-md border border-[#DC3545] bg-white px-3 py-2 text-sm font-semibold text-[#DC3545] transition hover:bg-[#DC3545] hover:text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => changeStatus(user.user_id, "suspended")}
                    disabled={updatingId === user.user_id}
                    className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#F9FAFB] disabled:opacity-60"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </MainLayout>
  );
}
