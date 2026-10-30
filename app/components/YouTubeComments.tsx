"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import {
  YouTubeCommentThreadItem,
  YouTubeCommentItem,
} from "@/types/youtube";

interface YouTubeCommentsProps {
  videoId: string;
  videoTitle?: string;
  channelTitle?: string;
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  } catch {
    return "";
  }
}

function formatCount(num?: number): string {
  if (typeof num !== "number" || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

// Clean HTML text received from YouTube API safely
function cleanHtmlText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export default function YouTubeComments({
  videoId,
  channelTitle,
}: YouTubeCommentsProps) {
  const { data: session } = useSession();
  const isGoogleAuthorized = Boolean(session?.hasYouTubeAccess);
  const currentUserName = session?.user?.name || session?.user?.email || "User";
  const currentUserImage = session?.user?.image;

  // Comments state
  const [comments, setComments] = useState<YouTubeCommentThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [totalComments, setTotalComments] = useState<number | undefined>(undefined);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting: relevance (Top comments) or time (Newest first)
  const [order, setOrder] = useState<"relevance" | "time">("relevance");

  // Top level comment form state
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentFormFocused, setCommentFormFocused] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active reply thread ID (which top-level comment has an open reply form)
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Expanded replies state: Set of thread IDs whose replies are visible
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [threadReplies, setThreadReplies] = useState<Record<string, YouTubeCommentItem[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [repliesPageTokens, setRepliesPageTokens] = useState<Record<string, string | undefined>>({});

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments for video
  const fetchComments = useCallback(
    async (token?: string, isAppend = false) => {
      if (!videoId) return;
      try {
        if (isAppend) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await apiClient.getYouTubeComments(videoId, order, token, 20);

        if (res.commentsDisabled) {
          setCommentsDisabled(true);
          setComments([]);
          setTotalComments(0);
          return;
        }

        setCommentsDisabled(false);
        const items = res.items || [];

        if (isAppend) {
          setComments((prev) => [...prev, ...items]);
        } else {
          setComments(items);
        }

        setNextPageToken(res.nextPageToken);
        if (typeof res.totalResults === "number") {
          setTotalComments(res.totalResults);
        }
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : "Failed to load comments.";
        try {
          const parsed = JSON.parse(msg);
          if (parsed.commentsDisabled) {
            setCommentsDisabled(true);
            setComments([]);
            return;
          }
          msg = parsed.error || msg;
        } catch {
          // keep original message
        }
        console.error("[YouTubeComments] Fetch error:", err);
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [videoId, order]
  );

  // Re-fetch comments when videoId or sort order changes
  useEffect(() => {
    setComments([]);
    setNextPageToken(undefined);
    setExpandedThreads({});
    setThreadReplies({});
    setActiveReplyThreadId(null);
    setNewCommentText("");
    setCommentFormFocused(false);
    setActionNotice(null);
    fetchComments();
  }, [fetchComments]);

  // Handle posting a new top-level comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    if (!isGoogleAuthorized) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    try {
      setIsSubmitting(true);
      setActionNotice(null);

      const createdThread = await apiClient.postYouTubeComment(videoId, newCommentText.trim());

      // Prepend to top of comments list immediately
      setComments((prev) => [createdThread, ...prev]);
      setTotalComments((prev) => (prev ? prev + 1 : 1));
      setNewCommentText("");
      setCommentFormFocused(false);

      setActionNotice({
        type: "success",
        text: "Comment posted publicly to YouTube!",
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Failed to post comment.";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.error === "AUTH_REQUIRED" || parsed.error === "TOKEN_EXPIRED") {
          msg = parsed.message || "Your Google authorization expired. Please sign in again.";
        } else {
          msg = parsed.message || parsed.error || msg;
        }
      } catch {
        // keep msg
      }
      setActionNotice({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle replies accordion for a thread
  const handleToggleReplies = async (threadId: string, initialReplies?: YouTubeCommentItem[]) => {
    const isCurrentlyExpanded = !!expandedThreads[threadId];

    if (isCurrentlyExpanded) {
      setExpandedThreads((prev) => ({ ...prev, [threadId]: false }));
      return;
    }

    // Expanding
    setExpandedThreads((prev) => ({ ...prev, [threadId]: true }));

    // If we already have replies stored or embedded, initialize them
    if (!threadReplies[threadId]) {
      if (initialReplies && initialReplies.length > 0) {
        setThreadReplies((prev) => ({ ...prev, [threadId]: initialReplies }));
      } else {
        // Fetch replies via API
        await fetchMoreReplies(threadId);
      }
    }
  };

  // Fetch more replies for a thread
  const fetchMoreReplies = async (threadId: string) => {
    try {
      setLoadingReplies((prev) => ({ ...prev, [threadId]: true }));
      const currentToken = repliesPageTokens[threadId];

      const res = await apiClient.getYouTubeCommentReplies(threadId, currentToken);
      const newReplies = res.items || [];

      setThreadReplies((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), ...newReplies],
      }));
      setRepliesPageTokens((prev) => ({
        ...prev,
        [threadId]: res.nextPageToken,
      }));
    } catch (err) {
      console.warn(`[YouTubeComments] Error fetching replies for ${threadId}:`, err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  // Handle posting an inline reply to a thread
  const handlePostReply = async (threadId: string) => {
    if (!replyText.trim() || isSubmittingReply) return;

    if (!isGoogleAuthorized) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    try {
      setIsSubmittingReply(true);
      setActionNotice(null);

      const createdReply = await apiClient.replyToYouTubeComment(threadId, replyText.trim());

      // Add to local replies list
      setThreadReplies((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), createdReply],
      }));

      // Ensure thread is expanded so user sees their new reply
      setExpandedThreads((prev) => ({ ...prev, [threadId]: true }));

      // Increment reply count on top level comment
      setComments((prev) =>
        prev.map((c) =>
          c.id === threadId
            ? {
                ...c,
                snippet: {
                  ...c.snippet,
                  totalReplyCount: (c.snippet.totalReplyCount || 0) + 1,
                },
              }
            : c
        )
      );

      setReplyText("");
      setActiveReplyThreadId(null);

      setActionNotice({
        type: "success",
        text: "Reply posted publicly to YouTube!",
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Failed to post reply.";
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.message || parsed.error || msg;
      } catch {
        // keep msg
      }
      setActionNotice({ type: "error", text: msg });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <section
      className="mt-8 pt-7 border-t border-[#1b2b3a] space-y-6"
      aria-labelledby="comments-heading"
    >
      {/* 1. COMMENTS HEADER: Title, Count & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-gradient-to-b from-[#E50914] to-rose-600 rounded-full" />
            <h2
              id="comments-heading"
              className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase"
            >
              Comments
            </h2>
          </div>
          {typeof totalComments === "number" && totalComments > 0 && (
            <span className="text-xs font-bold text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-0.5 rounded-full">
              {formatCount(totalComments)}
            </span>
          )}
        </div>

        {/* Sort Controls (Top Comments vs Newest First) */}
        {!commentsDisabled && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-400 font-medium hidden xs:inline">Sort by:</span>
            <div className="inline-flex rounded-lg bg-[#101720] border border-[#1b2b3a] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setOrder("relevance")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  order === "relevance"
                    ? "bg-red-600/25 text-red-400 border border-red-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={order === "relevance"}
              >
                Top Comments
              </button>
              <button
                type="button"
                onClick={() => setOrder("time")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  order === "time"
                    ? "bg-red-600/25 text-red-400 border border-red-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={order === "time"}
              >
                Newest First
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Banner (Success / Error toast) */}
      {actionNotice && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold animate-in fade-in duration-200 ${
            actionNotice.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
              : "bg-red-950/40 text-red-300 border-red-500/40 shadow-lg shadow-red-950/20"
          }`}
        >
          {actionNotice.type === "success" ? (
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* 2. ADD COMMENT FORM OR GOOGLE OAUTH CTA */}
      {!commentsDisabled && (
        <div className="bg-[#101720] border border-[#1b2b3a] rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5">
          {/* Identity & Disclaimer Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              {currentUserImage ? (
                <img
                  src={currentUserImage}
                  alt={currentUserName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-600/30 text-red-400 font-bold flex items-center justify-center text-[11px] ring-1 ring-red-500/40">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
              )}
              {isGoogleAuthorized ? (
                <span className="flex items-center gap-1.5">
                  <span>Commenting publicly as</span>
                  <strong className="text-white font-bold">{currentUserName}</strong>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube
                  </span>
                </span>
              ) : (
                <span className="text-zinc-400">Join the discussion</span>
              )}
            </div>

            <span className="text-[11px] text-zinc-500">
              Published publicly on YouTube
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handlePostComment} className="space-y-3">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onFocus={() => setCommentFormFocused(true)}
                placeholder={
                  isGoogleAuthorized
                    ? "Add a comment on YouTube..."
                    : "Connect with Google to post comments on YouTube..."
                }
                rows={commentFormFocused || newCommentText ? 3 : 1}
                className="w-full bg-[#0a0f16] border border-[#1b2b3a] focus:border-red-500 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none leading-relaxed"
                maxLength={10000}
              />
            </div>

            {/* Bottom Actions Row: Cancel & Post OR Google Connect Button */}
            {(commentFormFocused || newCommentText.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 animate-in fade-in duration-150">
                <span className="text-[11px] text-zinc-500">
                  {newCommentText.length > 0 && `${newCommentText.length} / 10,000 characters`}
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCommentText("");
                      setCommentFormFocused(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  {isGoogleAuthorized ? (
                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Comment</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: window.location.href })}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Authorize with Google to Comment</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 3. COMMENTS DISABLED BANNER */}
      {commentsDisabled && (
        <div
          className="p-5 rounded-xl bg-[#101720] border border-[#1b2b3a] flex items-center gap-3.5 text-zinc-400 text-xs sm:text-sm"
          role="status"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm sm:text-base">Comments are turned off</h4>
            <p className="text-zinc-400 mt-0.5">The creator has disabled comments for this video on YouTube.</p>
          </div>
        </div>
      )}

      {/* 4. ERROR STATE */}
      {error && !commentsDisabled && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs sm:text-sm text-red-300 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchComments()}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 font-bold text-xs transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. LOADING SKELETONS */}
      {loading && (
        <div className="space-y-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#0f1722] border border-[#1b2b3a] animate-pulse flex gap-3.5"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-3.5 bg-zinc-800 rounded w-1/4" />
                <div className="h-3 bg-zinc-800/70 rounded w-3/4" />
                <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. EMPTY COMMENTS STATE */}
      {!loading && !commentsDisabled && !error && comments.length === 0 && (
        <div className="py-12 px-4 rounded-xl bg-[#0d141d] border border-[#1b2b3a] text-center space-y-2">
          <svg
            className="w-10 h-10 mx-auto text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h4 className="text-sm sm:text-base font-bold text-white">No comments yet</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Be the first to share your thoughts on this video!
          </p>
        </div>
      )}

      {/* 7. COMMENTS LIST */}
      {!loading && comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((thread) => {
            const topComment = thread.snippet?.topLevelComment;
            if (!topComment?.snippet) return null;

            const snippet = topComment.snippet;
            const threadId = thread.id;
            const replyCount = thread.snippet.totalReplyCount || 0;
            const isExpanded = !!expandedThreads[threadId];
            const repliesList = threadReplies[threadId] || thread.replies?.comments || [];
            const isThreadLoadingReplies = !!loadingReplies[threadId];
            const isReplyFormOpen = activeReplyThreadId === threadId;
            const isCreator =
              channelTitle &&
              snippet.authorDisplayName &&
              snippet.authorDisplayName.toLowerCase().trim() === channelTitle.toLowerCase().trim();

            return (
              <div
                key={threadId}
                className="group relative bg-[#0e1520] hover:bg-[#111a26] border border-[#1b2b3a] hover:border-[#24394d] rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-sm"
              >
                {/* Comment Header: Author, Badge, Time */}
                <div className="flex items-start gap-3.5">
                  {/* Author Avatar */}
                  {snippet.authorProfileImageUrl ? (
                    <img
                      src={snippet.authorProfileImageUrl}
                      alt={snippet.authorDisplayName || "Author"}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 bg-zinc-800"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {(snippet.authorDisplayName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {snippet.authorChannelUrl ? (
                        <a
                          href={snippet.authorChannelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-bold text-white hover:text-red-400 transition-colors truncate max-w-[200px] sm:max-w-xs"
                        >
                          {snippet.authorDisplayName}
                        </a>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {snippet.authorDisplayName}
                        </span>
                      )}

                      {/* Creator badge if matches video channel title */}
                      {isCreator && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                          Creator
                        </span>
                      )}

                      <span className="text-[11px] text-zinc-500">
                        {formatTimeAgo(snippet.publishedAt)}
                      </span>
                    </div>

                    {/* Comment Body */}
                    <p className="text-xs sm:text-sm text-zinc-200 mt-1.5 leading-relaxed whitespace-pre-line break-words">
                      {cleanHtmlText(snippet.textDisplay || snippet.textOriginal)}
                    </p>

                    {/* Comment Action Bar: Likes & Reply trigger */}
                    <div className="flex items-center gap-4 mt-3 pt-1 text-xs text-zinc-400">
                      {/* Like Count */}
                      <div className="inline-flex items-center gap-1.5 text-zinc-400">
                        <svg
                          className="w-3.5 h-3.5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                        <span className="font-semibold text-[11px]">
                          {formatCount(snippet.likeCount)}
                        </span>
                      </div>

                      {/* Reply Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (activeReplyThreadId === threadId) {
                            setActiveReplyThreadId(null);
                          } else {
                            setActiveReplyThreadId(threadId);
                            setReplyText("");
                          }
                        }}
                        className="font-bold text-zinc-400 hover:text-white transition-colors active:scale-95"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Inline Reply Form */}
                    {isReplyFormOpen && (
                      <div className="mt-3.5 pt-3 border-t border-[#1b2b3a] space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>Replying publicly as</span>
                          <strong className="text-white font-bold">{currentUserName}</strong>
                        </div>

                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Add a reply to this comment..."
                          rows={2}
                          autoFocus
                          className="w-full bg-[#0a0f16] border border-[#1b2b3a] focus:border-red-500 rounded-lg p-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
                          maxLength={10000}
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyThreadId(null);
                              setReplyText("");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>

                          {isGoogleAuthorized ? (
                            <button
                              type="button"
                              onClick={() => handlePostReply(threadId)}
                              disabled={!replyText.trim() || isSubmittingReply}
                              className="px-3.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                            >
                              {isSubmittingReply ? "Posting..." : "Reply"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => signIn("google", { callbackUrl: window.location.href })}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-bold transition-all"
                            >
                              Authorize with Google to Reply
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 8. EXPANDABLE REPLIES THREAD */}
                    {replyCount > 0 && (
                      <div className="mt-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleReplies(threadId, thread.replies?.comments)}
                          className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors py-1"
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>
                            {isExpanded
                              ? `Hide ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                              : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                          </span>
                        </button>

                        {/* Nested Replies List */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3 pl-3 sm:pl-4 border-l-2 border-[#1b2b3a] animate-in fade-in duration-200">
                            {repliesList.map((reply) => {
                              const rSnippet = reply.snippet;
                              if (!rSnippet) return null;

                              const isReplyCreator =
                                channelTitle &&
                                rSnippet.authorDisplayName &&
                                rSnippet.authorDisplayName.toLowerCase().trim() ===
                                  channelTitle.toLowerCase().trim();

                              return (
                                <div key={reply.id} className="flex items-start gap-3 pt-1">
                                  {rSnippet.authorProfileImageUrl ? (
                                    <img
                                      src={rSnippet.authorProfileImageUrl}
                                      alt={rSnippet.authorDisplayName || "Author"}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 bg-zinc-800"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                                      {(rSnippet.authorDisplayName || "U").charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {rSnippet.authorChannelUrl ? (
                                        <a
                                          href={rSnippet.authorChannelUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-white hover:text-red-400 transition-colors truncate max-w-[180px]"
                                        >
                                          {rSnippet.authorDisplayName}
                                        </a>
                                      ) : (
                                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                                          {rSnippet.authorDisplayName}
                                        </span>
                                      )}

                                      {isReplyCreator && (
                                        <span className="px-1 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase">
                                          Creator
                                        </span>
                                      )}

                                      <span className="text-[10px] text-zinc-500">
                                        {formatTimeAgo(rSnippet.publishedAt)}
                                      </span>
                                    </div>

                                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed whitespace-pre-line break-words">
                                      {cleanHtmlText(rSnippet.textDisplay || rSnippet.textOriginal)}
                                    </p>

                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                                      <div className="inline-flex items-center gap-1 text-zinc-400">
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                          />
                                        </svg>
                                        <span>{formatCount(rSnippet.likeCount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Loading more replies indicator */}
                            {isThreadLoadingReplies && (
                              <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                                <svg className="w-3.5 h-3.5 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span>Loading replies...</span>
                              </div>
                            )}

                            {/* Load more replies button if pagination token exists */}
                            {repliesPageTokens[threadId] && !isThreadLoadingReplies && (
                              <button
                                type="button"
                                onClick={() => fetchMoreReplies(threadId)}
                                className="text-xs font-semibold text-teal-400 hover:text-teal-300 py-1"
                              >
                                Show more replies
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 9. PAGINATION: Load More Comments Button */}
      {nextPageToken && !loading && !commentsDisabled && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => fetchComments(nextPageToken, true)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101720] hover:bg-[#15202d] text-zinc-200 hover:text-white border border-[#1b2b3a] hover:border-zinc-600 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <svg className="w-4 h-4 animate-spin text-red-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading more comments...</span>
              </>
            ) : (
              <span>Load More Comments</span>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

