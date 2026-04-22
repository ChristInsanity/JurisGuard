export default function AddPersonModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Add Person</h2>

        <div className="space-y-3">
          <input placeholder="Full Name" className="w-full border p-2 rounded" />
          
          <select className="w-full border p-2 rounded">
            <option>Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          <input placeholder="Age" className="w-full border p-2 rounded" />
          <input placeholder="Address" className="w-full border p-2 rounded" />
          <input placeholder="Contact Number" className="w-full border p-2 rounded" />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </div>

    </div>
  );
}