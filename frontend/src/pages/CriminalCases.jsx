import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getCases } from "../services/caseService";
import AddCaseModal from "../components/modals/AddCaseModal";
import AddPersonModal from "../components/modals/AddPersonModal";

export default function CriminalCases() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((err) => console.error(err));
  }, []);

  // 🔍 FILTER LOGIC (frontend version for now)
  const filteredCases = cases.filter((c) => {
    const text = `${c.control_number} ${c.title_of_case} ${c.status}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Criminal Cases
          </h2>

          <div className="text-sm text-gray-500">
            Dashboard / Criminal Cases
          </div>
        </div>

        <div className="flex gap-2">
         <button
  onClick={() => setShowCaseModal(true)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
>
  + Add Case
</button>

<button
  onClick={() => setShowPersonModal(true)}
  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
>
  + Add Client
</button>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl border p-5">

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-4">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-4">

            {/* FILTER DROPDOWN */}
            <select
              className="border px-3 py-2 rounded-lg text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All</option>
              <option>Urban</option>
              <option>Rural</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            {/* COUNT */}
            <div className="text-sm text-gray-600">
              Total:
              <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded">
                {filteredCases.length}
              </span>
            </div>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search case..."
            className="border px-3 py-2 rounded-lg w-64 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2">Control No.</th>
                <th className="text-left py-2">Party Represented</th>
                <th className="text-left py-2">Gender</th>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Person</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-400">
                    No criminal cases found
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">

                    <td className="py-2">{c.control_number}</td>
                    <td>{c.party_represented || "-"}</td>
                    <td>{c.person_gender || "-"}</td>
                    <td>{c.title_of_case}</td>

                    {/* STATUS BADGE */}
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white ${
                          c.status === "Terminated"
                            ? "bg-red-500"
                            : "bg-blue-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td>{c.person_name || "-"}</td>

                    <td className="text-right">
                      <button className="text-blue-600 hover:underline text-sm">
                        View
                      </button>
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
