"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import {
  useCallback,
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { toast } from "@/components/chat/toast";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import {
  analyzePrompt,
  formatBlockMessage,
} from "@/lib/security/analyzer";
import { DEMO_ATTACK_PROMPT } from "@/lib/security/presets";
import type {
  SecurityAnalysisResult,
  SecurityMode,
} from "@/lib/security/types";
import type { ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

type ActiveChatContextValue = {
  chatId: string;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  votes: Vote[] | undefined;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  showOllamaAlert: boolean;
  setShowOllamaAlert: Dispatch<SetStateAction<boolean>>;
  securityMode: SecurityMode;
  setSecurityMode: Dispatch<SetStateAction<SecurityMode>>;
  lastAnalysis: SecurityAnalysisResult | null;
  handleSelectPreset: (prompt: string) => void;
  runDemoAttack: () => Promise<void>;
  runDemoDefense: () => Promise<void>;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = generateUUID();
  }
  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const [currentModelId, setCurrentModelId] = useState(DEFAULT_CHAT_MODEL);
  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const [input, setInput] = useState("");
  const [showOllamaAlert, setShowOllamaAlert] = useState(false);
  const [securityMode, setSecurityMode] = useState<SecurityMode>("vulnerable");
  const [lastAnalysis, setLastAnalysis] =
    useState<SecurityAnalysisResult | null>(null);

  const securityModeRef = useRef(securityMode);
  useEffect(() => {
    securityModeRef.current = securityMode;
  }, [securityMode]);

  const { data: chatData, isLoading } = useSWR(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : (chatData?.messages ?? []);
  const visibility: VisibilityType = isNewChat
    ? "private"
    : (chatData?.visibility ?? "private");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibility,
            securityMode: securityModeRef.current,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (
        error.message?.includes("Ollama") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("offline:ollama")
      ) {
        setShowOllamaAlert(true);
      } else if (error instanceof ChatbotError) {
        toast({ type: "error", description: error.message });
      } else {
        toast({
          type: "error",
          description: error.message || "Oops, an error occurred!",
        });
      }
    },
  });

  const loadedChatIds = useRef(new Set<string>());

  if (isNewChat && !loadedChatIds.current.has(newChatIdRef.current)) {
    loadedChatIds.current.add(newChatIdRef.current);
  }

  useEffect(() => {
    if (loadedChatIds.current.has(chatId)) {
      return;
    }
    if (chatData?.messages) {
      loadedChatIds.current.add(chatId);
      setMessages(chatData.messages);
    }
  }, [chatId, chatData?.messages, setMessages]);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      if (isNewChat) {
        setMessages([]);
      }
    }
  }, [chatId, isNewChat, setMessages]);

  useEffect(() => {
    if (chatData && !isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelId(decodeURIComponent(cookieModel));
      }
    }
  }, [chatData, isNewChat]);

  const hasAppendedQueryRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query && !hasAppendedQueryRef.current) {
      hasAppendedQueryRef.current = true;
      window.history.replaceState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });
    }
  }, [sendMessage, chatId]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isReadonly = isNewChat ? false : (chatData?.isReadonly ?? false);

  /** Extract text content from a message's parts for security analysis. */
  const extractText = useCallback((parts: ChatMessage["parts"] | undefined) => {
    return (
      parts
        ?.filter(
          (p): p is { type: "text"; text: string } => p.type === "text"
        )
        .map((p) => p.text)
        .join(" ") ?? ""
    );
  }, []);

  /**
   * Core send wrapper: analyzes input, blocks in Secure Mode, then forwards
   * to the AI SDK transport if allowed.
   */
  const sendSecureMessage = useCallback<
    UseChatHelpers<ChatMessage>["sendMessage"]
  >(
    async (message, options) => {
      const text = extractText(message.parts);
      const mode = securityModeRef.current;
      const analysis = analyzePrompt(text, mode);
      setLastAnalysis(analysis);

      if (analysis.blocked) {
        const userMsg: ChatMessage = {
          id: generateUUID(),
          role: "user",
          parts: message.parts ?? [{ type: "text", text }],
        };
        const blockMsg: ChatMessage = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text", text: formatBlockMessage(analysis) }],
        };
        setMessages((prev) => [...prev, userMsg, blockMsg]);
        return;
      }

      return sendMessage(message, options);
    },
    [extractText, sendMessage, setMessages]
  );

  /** Populate input with a preset and preview its security analysis. */
  const handleSelectPreset = useCallback(
    (prompt: string) => {
      setInput(prompt);
      setLastAnalysis(analyzePrompt(prompt, securityModeRef.current));
    },
    [setInput]
  );

  /** One-click demo: Vulnerable Mode + auto-send attack prompt. */
  const runDemoAttack = useCallback(async () => {
    setSecurityMode("vulnerable");
    securityModeRef.current = "vulnerable";

    const prompt = DEMO_ATTACK_PROMPT;
    const analysis = analyzePrompt(prompt, "vulnerable");
    setLastAnalysis(analysis);
    setInput("");

    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: prompt }],
    });
  }, [chatId, sendMessage]);

  /** One-click demo: Secure Mode + auto-send same attack (blocked). */
  const runDemoDefense = useCallback(async () => {
    setSecurityMode("secure");
    securityModeRef.current = "secure";

    const prompt = DEMO_ATTACK_PROMPT;
    const analysis = analyzePrompt(prompt, "secure");
    setLastAnalysis(analysis);
    setInput("");

    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    const userMsg: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };
    const blockMsg: ChatMessage = {
      id: generateUUID(),
      role: "assistant",
      parts: [{ type: "text", text: formatBlockMessage(analysis) }],
    };
    setMessages((prev) => [...prev, userMsg, blockMsg]);
  }, [chatId, setMessages]);

  const { data: votes } = useSWR<Vote[]>(
    !isReadonly && messages.length >= 2
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const value = useMemo<ActiveChatContextValue>(
    () => ({
      chatId,
      messages,
      setMessages,
      sendMessage: sendSecureMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      setInput,
      visibilityType: visibility,
      isReadonly,
      isLoading: !isNewChat && isLoading,
      votes,
      currentModelId,
      setCurrentModelId,
      showOllamaAlert,
      setShowOllamaAlert,
      securityMode,
      setSecurityMode,
      lastAnalysis,
      handleSelectPreset,
      runDemoAttack,
      runDemoDefense,
    }),
    [
      chatId,
      messages,
      setMessages,
      sendSecureMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      visibility,
      isReadonly,
      isNewChat,
      isLoading,
      votes,
      currentModelId,
      showOllamaAlert,
      securityMode,
      lastAnalysis,
      handleSelectPreset,
      runDemoAttack,
      runDemoDefense,
    ]
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
