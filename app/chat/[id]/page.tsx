import ChatShell from "@/app/components/ChatShell";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatShell sessionId={id} />;
}
