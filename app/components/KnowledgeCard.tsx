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
    <div className="glow-border">
      <div className="bg-app rounded-[calc(1rem-1px)] p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">{entry.title}</h2>
            <span className="mt-1 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
              {entry.category}
            </span>
          </div>
          <button
            className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10"
            onClick={() => handleDelete(entry.id)}
          >
            Delete
          </button>
        </div>
        <p className="mt-3 text-sm font-light leading-relaxed text-gray-300">
          {entry.content}
        </p>
      </div>
    </div>
  );
}
