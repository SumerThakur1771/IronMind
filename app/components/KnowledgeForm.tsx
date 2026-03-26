"use client"

 interface KnowledgeFormProps{
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  handleSubmit: () => void;
 }

export default function KnowledgeForm({title, setTitle, content, setContent, category, setCategory, handleSubmit}:KnowledgeFormProps){
return(
    <>
     <input
          type="text"
          placeholder="Enter your title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-4 rounded border border-gray-700 bg-black px-4 py-2 text-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        >
          <option value="">select one</option>
          <option value="nutrition">Nutrition</option>
          <option value="training">Training</option>
          <option value="recovery">Recovery</option>
          <option value="mindset">Mindset</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your fitness principle here..."
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        ></textarea>
        <button onClick={handleSubmit} className="bg-blue-500 p-1.5 rounded-md">Submit</button>
    </>
)
}