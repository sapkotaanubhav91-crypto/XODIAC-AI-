import React from 'react';
import CodeBlock from './CodeBlock';

interface MarkdownProps {
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const parts = content.split(/```/g);

  return (
    <div className="text-[#1f2937] leading-7 text-[16px]">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // Code block
          const firstLineEnd = part.indexOf('\n');
          let language = '';
          let code = part;
          if (firstLineEnd > -1) {
            language = part.substring(0, firstLineEnd).trim();
            code = part.substring(firstLineEnd + 1);
          }
          // Remove trailing newline if it exists from the split
          if (code.endsWith('\n')) {
              code = code.slice(0, -1);
          }
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          // Text block
          return <TextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
};

const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // Headers
        if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-semibold mt-6 mb-2 text-gray-900">{formatInline(trimmed.replace(/^### /, ''))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold mt-8 mb-3 text-gray-900">{formatInline(trimmed.replace(/^## /, ''))}</h2>;
        }
        
        // Lists (Bullets)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split(/\n/).map(line => line.trim().replace(/^[-*] /, ''));
            return (
                <ul key={i} className="list-disc pl-5 mb-4 space-y-1 text-gray-800 marker:text-gray-400">
                    {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
                </ul>
            );
        }

        // Numbered Lists
        if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).map(line => line.trim().replace(/^\d+\.\s/, ''));
             return (
                <ol key={i} className="list-decimal pl-5 mb-4 space-y-1 text-gray-800 marker:text-gray-500">
                    {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
                </ol>
            );
        }

        // Regular Paragraph
        return <p key={i} className="mb-4 text-gray-800">{formatInline(trimmed)}</p>;
      })}
    </>
  );
};

// Simple inline formatter for bold and code
const formatInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800 border border-gray-200">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

export default Markdown;