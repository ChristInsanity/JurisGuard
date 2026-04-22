import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import AddCaseModal from "../components/modals/AddCaseModal";
import AddPersonModal from "../components/modals/AddPersonModal";

export default function CriminalCases() {
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Cases");

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Criminal Cases</h2>
          <p className="text-sm text-gray-500">Dashboard / Criminal Cases</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCaseModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Case
          </button>

          <button
            onClick={() => setShowPersonModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            + Add Person
          </button>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-white p-5 rounded-xl border">

        {/* FILTER + SEARCH */}
        <div className="flex justify-between mb-4">

          <div className="flex items-center gap-3">
            <select
              className="border px-3 py-2 rounded"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All Cases</option>
              <option>Urban</option>
              <option>Rural</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <span className="text-sm text-gray-500">
              Total: <span className="bg-blue-500 text-white px-2 py-1 rounded">0</span>
            </span>
          </div>

          <input
            type="text"
            placeholder="Search case..."
            className="border px-3 py-2 rounded w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Control No.</th>
              <th className="text-left py-2">Party</th>
              <th className="text-left py-2">Gender</th>
              <th className="text-left py-2">Title</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Person</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-400">
                No criminal cases found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      <AddCaseModal
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
      />

      <AddPersonModal
        isOpen={showPersonModal}
        onClose={() => setShowPersonModal(false)}
      />
    </MainLayout>
  );
}