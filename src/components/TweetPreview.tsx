'use client';

import { useState } from 'react';
import { Twitter, Copy, Check, ExternalLink } from 'lucide-react';

function composeTweetText({
  title,
  category,
  address,
  twitterHandle,
  issueUrl,
}: {
  title: string;
  category: string;
  address: string | null;
  twitterHandle?: string;
  issueUrl: string;
}): string {
  const location = address || 'my area';
  const handle = twitterHandle
    ? (twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`)
    : '';
  const mention = handle ? `\n\n${handle} Please look into this urgently.` : '';
  return `🚨 ${category} issue at ${location}\n\n${title}${mention}\n\n${issueUrl}\n#InternsCity #CivicIssue`;
}

interface TweetPreviewProps {
  title: string;
  category: string;
  address: string | null;
  twitterHandle?: string;
  issueUrl: string;
}

export function TweetPreview({ title, category, address, twitterHandle, issueUrl }: TweetPreviewProps) {
  const defaultText = composeTweetText({ title, category, address, twitterHandle, issueUrl });
  const [text, setText] = useState(defaultText);
  const [copied, setCopied] = useState(false);

  const charCount = text.length;
  const overLimit = charCount > 280;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Twitter className="w-3 h-3 text-sky-400" />
        <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
          Tweet this Issue
        </span>
        <span className={`text-[10px] ml-auto ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
          {charCount}/280
        </span>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/30 outline-none resize-none leading-relaxed"
      />

      <div className="flex items-center gap-1.5">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Post on X
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:bg-gray-600/80 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
