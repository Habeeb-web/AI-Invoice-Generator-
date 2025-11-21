{/* Before - using TextareaField */}
<TextareaField
  value={notes}
  onChange={handleNotesChange}
  placeholder="Enter your notes"
/>

{/* After - plain textarea */}
<textarea
  value={notes}
  onChange={handleNotesChange}
  placeholder="Enter your notes"
  rows={4}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
