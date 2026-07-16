"use client";

interface KnowledgeFormProps {
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  handleSubmit: () => void;
}

export default function KnowledgeForm({
  title,
  setTitle,
  content,
  setContent,
  category,
  setCategory,
  handleSubmit,
}: KnowledgeFormProps) {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Title
        </label>
        <input
          type="text"
          placeholder="e.g. Protein Intake"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-styled"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-styled"
        >
          <option value="" className="bg-[#0a0f1e]">
            Select one
          </option>
          <option value="nutrition" className="bg-[#0a0f1e]">
            Nutrition
          </option>
          <option value="training" className="bg-[#0a0f1e]">
            Training
          </option>
          <option value="recovery" className="bg-[#0a0f1e]">
            Recovery
          </option>
          <option value="mindset" className="bg-[#0a0f1e]">
            Mindset
          </option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Principle
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your fitness principle here..."
          rows={4}
          className="input-styled resize-y"
        />
      </div>

      <button onClick={handleSubmit} className="btn-primary mt-2">
        Add principle
      </button>
    </div>
  );
}
