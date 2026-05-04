import { useState } from "react";

export default function AddPersonModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    full_name: "",
    gender_sex: "",
    age: "",
    address: "",
    contact_number: "",
  });

  const [preview, setPreview] = useState(null); 
  const [ocrData, setOcrData] = useState(null);

  if (!isOpen) return null;

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    setTimeout(() => {
      const fakeExtracted = {
        full_name: "Juan Dela Cruz",
        gender_sex: "Male",
        age: "30",
        address: "Davao City",
        contact_number: "09123456789",
      };

      setOcrData(fakeExtracted);
      setForm(fakeExtracted);
    }, 1000);
  };

  // SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("FINAL PERSON DATA:", form);

    // 👉 later: send to backend
    // createPerson(form)

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-xl shadow-lg">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="font-semibold text-lg">Add Person</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* OCR SECTION */}
          <div className="border p-4 rounded-lg bg-gray-50">
            <h4 className="font-medium mb-2">Upload / Scan Document</h4>

            <input type="file" onChange={handleFile} />

            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-3 w-40 border rounded"
              />
            )}

            {ocrData && (
              <div className="mt-3 text-sm text-green-600">
                ✔ OCR data extracted (review before saving)
              </div>
            )}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3">

            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <select
              name="gender_sex"
              value={form.gender_sex}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={form.age}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              type="text"
              name="contact_number"
              placeholder="Contact Number"
              value={form.contact_number}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            {/* FOOTER */}
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save Person
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}