import { useState } from "react";

export default function AddCaseModal({ isOpen, onClose }) {
  const [status, setStatus] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

      <div className="bg-white p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto">

        <h2 className="text-lg font-bold mb-4">Add Criminal Case</h2>

        <div className="grid grid-cols-2 gap-3">

          <input placeholder="Control No." className="border p-2 rounded" />
          <input placeholder="Party Represented" className="border p-2 rounded" />
          <input placeholder="Title of Case" className="border p-2 rounded" />
          <input placeholder="Court Body" className="border p-2 rounded" />

          <input placeholder="Case No." className="border p-2 rounded" />
          <input placeholder="Cause of Action" className="border p-2 rounded" />

          <select
            className="border p-2 rounded"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Select Status</option>
            <option>Pending</option>
            <option>Terminated</option>
          </select>

          <textarea placeholder="Last Action" className="border p-2 rounded col-span-2" />

        </div>

        {/* CONDITIONAL FIELD */}
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

    </div>
  );
}