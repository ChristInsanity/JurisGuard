import { useState, useEffect } from "react"; // can still call it clients
import AddPersonModal from "./AddPersonModal"; // backend still person
import { getClients } from "../../services/api";


export default function AddCaseModal({ isOpen, onClose }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [status, setStatus] = useState("");
  const [showPersonModal, setShowPersonModal] = useState(false);

  useEffect(() => {
    getClients().then(setClients).catch(console.error);
  }, []);

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

      <div className="bg-white p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto">

        <h2 className="text-lg font-bold mb-4">Add Criminal Case</h2>

        {/* 🔥 LABEL ONLY CHANGED */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Select Client</label>

          <div className="flex gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded w-full"
              />

              {search && (
                <div className="absolute bg-white border w-full mt-1 max-h-40 overflow-y-auto">
                  {filtered.map((c) => (
                    <div
                      key={c.person_id} // 🔥 STILL PERSON ID
                      onClick={() => {
                        setSelectedClient(c);
                        setSearch(c.full_name);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {c.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPersonModal(true)}
              className="bg-green-600 text-white px-3 rounded"
            >
              +
            </button>
          </div>

          {selectedClient && (
            <p className="text-green-600 text-sm mt-1">
              Selected: {selectedClient.full_name}
            </p>
          )}
        </div>

        {/* CASE FORM */}
        <div className="grid grid-cols-2 gap-3">

          <input placeholder="Control No." className="border p-2 rounded" />
          <input placeholder="Party Represented" className="border p-2 rounded" />

          <input placeholder="Title of Case" className="border p-2 rounded" />
          <input placeholder="Court Body" className="border p-2 rounded" />

          <input placeholder="Case No." className="border p-2 rounded" />
          <input placeholder="Cause of Action" className="border p-2 rounded" />

          <select
            className="border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="Terminated">Terminated</option>
          </select>

          <textarea
            placeholder="Last Action"
            className="border p-2 rounded col-span-2"
          />
        </div>

        {status === "Terminated" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <textarea placeholder="Cause of Termination" className="border p-2 rounded" />
            <input type="date" className="border p-2 rounded" />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Save Case
          </button>
        </div>

      </div>

      {/* 🔥 STILL PERSON MODAL */}
      <AddPersonModal
        isOpen={showPersonModal}
        onClose={() => setShowPersonModal(false)}
      />

    </div>
  );
}