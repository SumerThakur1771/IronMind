import {
  HISTORY_MAX_CHARS,
  HISTORY_MAX_MESSAGES,
  HISTORY_MAX_MESSAGE_CHARS,
  RETRIEVAL_HISTORY_QUESTIONS,
} from "@/app/lib/constants";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const TRUNCATED = " … [truncated]";

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - TRUNCATED.length) + TRUNCATED;
}

/**
 * Turn a session's stored messages (oldest first) into earlier turns for the
 * model.
 *
 * - Only answered questions are kept, as user → assistant pairs. That drops
 *   questions that never got an answer (a failed request, or the current
 *   question itself) and a reply whose question fell outside the window, so
 *   the turns always alternate, start with "user" and end with "assistant".
 * - The newest pairs are kept first, up to the message and character limits.
 *   Each message is cut to a maximum length first.
 */
export function buildHistory(
  messages: Array<{ role: string; content: string }>,
  limits = {
    maxMessages: HISTORY_MAX_MESSAGES,
    maxChars: HISTORY_MAX_CHARS,
    maxMessageChars: HISTORY_MAX_MESSAGE_CHARS,
  },
): ChatTurn[] {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i + 1 < messages.length; i++) {
    if (messages[i].role === "user" && messages[i + 1].role === "assistant") {
      pairs.push([messages[i].content, messages[i + 1].content]);
      i++;
    }
  }

  const kept: ChatTurn[] = [];
  let chars = 0;
  for (let p = pairs.length - 1; p >= 0; p--) {
    if (kept.length + 2 > limits.maxMessages) break;
    const question = truncate(pairs[p][0], limits.maxMessageChars);
    const answer = truncate(pairs[p][1], limits.maxMessageChars);
    // Stop rather than skip, so the kept history has no gaps.
    if (chars + question.length + answer.length > limits.maxChars) break;
    chars += question.length + answer.length;
    kept.unshift(
      { role: "user", content: question },
      { role: "assistant", content: answer },
    );
  }
  return kept;
}

/**
 * Text for the follow-up knowledge search: the last few earlier questions plus
 * the current one, so "what about on rest days?" still finds the protein
 * entries. Returns null when there's no history.
 */
export function followUpQuery(history: ChatTurn[], question: string): string | null {
  const earlier = history
    .filter((m) => m.role === "user")
    .slice(-RETRIEVAL_HISTORY_QUESTIONS)
    .map((m) => m.content);
  return earlier.length ? [...earlier, question].join("\n") : null;
}
