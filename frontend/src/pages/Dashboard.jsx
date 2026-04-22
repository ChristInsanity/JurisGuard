import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getCases } from "../services/caseService";

export default function Dashboard() {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(console.error);
  }, []);

  return (
    <MainLayout>

      {/* HEADER */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Overview
      </h2>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-xl border">
          <p className="text-gray-500 text-sm">Total Criminal Cases</p>
          <h2 className="text-xl font-bold mt-2">{cases.length}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border">
          <p className="text-gray-500 text-sm">Ongoing Cases</p>
          <h2 className="text-xl font-bold mt-2">0</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border">
          <p className="text-gray-500 text-sm">Terminated Cases</p>
          <h2 className="text-xl font-bold mt-2">0</h2>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white p-5 rounded-xl border">
        <h5 className="mb-4 font-semibold">Recent Criminal Cases</h5>

        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Control No.</th>
              <th className="text-left py-2">Title</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-400">
                  No criminal cases recorded yet.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.control_number}</td>
                  <td>{c.title_of_case}</td>
                  <td>{c.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </MainLayout>
  );
}