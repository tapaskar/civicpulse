export function composeTweetUrl({
  title,
  category,
  address,
  twitterHandle,
  issueUrl,
}: {
  title: string;
  category: string;
  address: string | null;
  twitterHandle: string;
  issueUrl: string;
}): string {
  const location = address || 'reported location';
  const handle = twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`;
  const text = `🚨 ${category} issue at ${location}\n\n${title}\n\n${handle} Please look into this.\n\n${issueUrl}\n#InternsCity`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
