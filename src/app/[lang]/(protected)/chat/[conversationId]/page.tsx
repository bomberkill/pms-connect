"use client";

import { useParams } from "next/navigation";
import ConversationThread from "@/components/chat/ConversationThread";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string; lang: string }>();
  return <ConversationThread conversationId={params.conversationId} />;
}
