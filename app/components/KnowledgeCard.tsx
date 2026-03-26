"use client";

interface KnowledgeEntry {
  id: number;
  title: string;
  category: string;
  content: string;
}

interface KnowledgeCardProps {
  entry: KnowledgeEntry;
  handleDelete: (id: number) => void;
}

export default function KnowledgeCard({
  entry,
  handleDelete,
}: KnowledgeCardProps) {
  return (
    <>
      <div
        className="mt-4 rounded border border-gray-700 p-4 text-left"
      >
        <h2 className="text-lg font-bold">{entry.title}</h2>
        <p className="text-sm text-blue-400">{entry.category}</p>
        <p className="mt-2 text-gray-300">{entry.content}</p>
        <button
          className="bg-red-500 px-2.5 rounded-md m-2"
          onClick={() => handleDelete(entry.id)}
        >
          Delete
        </button>
      </div>
    </>
  );
}
