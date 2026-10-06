import React from 'react';

/**
 * Parses inline Markdown such as **bold**, *italic*, `code`, and currency ₹ amounts
 */
function renderInline(text) {
  if (!text) return null;

  // Split text by tokens: **bold**, *italic*, `code`
  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex to match **bold**, *italic*, `code`
  const inlineRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(remaining)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`text-${keyIdx++}`}>{remaining.substring(lastIndex, match.index)}</React.Fragment>);
    }

    if (match[2]) {
      // Bold **text**
      parts.push(<strong key={`bold-${keyIdx++}`} className="font-bold text-slate-900 dark:text-white">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic *text*
      parts.push(<em key={`italic-${keyIdx++}`} className="italic">{match[3]}</em>);
    } else if (match[4]) {
      // Inline `code`
      parts.push(
        <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 font-mono text-xs">
          {match[4]}
        </code>
      );
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push(<React.Fragment key={`text-end-${keyIdx++}`}>{remaining.substring(lastIndex)}</React.Fragment>);
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Safe, lightweight, zero-dependency Markdown renderer for My Pocket AI messages.
 * Handles headings (###, ##, #), bullet lists (- or *), numbered lists (1.), and paragraphs.
 */
export function SafeMarkdown({ content }) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2.5 space-y-1.5 pl-5 list-disc text-slate-700 dark:text-slate-300">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
    } else if (currentList.type === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2.5 space-y-1.5 pl-5 list-decimal text-slate-700 dark:text-slate-300">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5">
          {renderInline(trimmed.substring(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-2">
          {renderInline(trimmed.substring(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
          {renderInline(trimmed.substring(2))}
        </h2>
      );
      continue;
    }

    // Bullet points (- or *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list (1. item)
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-2 leading-relaxed text-slate-700 dark:text-slate-300">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 text-sm leading-relaxed">{elements}</div>;
}

export default SafeMarkdown;
