import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Split content by block-level elements: code blocks, display math, tables, paragraphs
    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushParagraph = (keyPrefix: string) => {
      if (currentParagraph.length === 0) return;
      const text = currentParagraph.join('\n');
      nodes.push(
        <div key={`${keyPrefix}-${nodes.length}`} className="my-2 leading-relaxed text-slate-800 text-sm">
          {renderInlineMathAndFormatting(text)}
        </div>
      );
      currentParagraph = [];
    };

    const flushTable = (keyPrefix: string) => {
      if (tableRows.length === 0) return;
      const [headerRow, ...bodyRows] = tableRows.filter((row) => !row.every((cell) => /^[-:| ]+$/.test(cell)));
      if (headerRow) {
        nodes.push(
          <div key={`${keyPrefix}-table-${nodes.length}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-semibold border-b border-slate-200">
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                      {renderInlineMathAndFormatting(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 border-r border-slate-200 last:border-r-0 text-slate-700">
                        {renderInlineMathAndFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // 1. Display Math Block: $$ ... $$
      if (line.trim().startsWith('$$')) {
        flushParagraph(`para-${i}`);
        flushTable(`tbl-${i}`);
        let mathContent = line.trim().slice(2);
        if (mathContent.endsWith('$$') && mathContent.length > 2) {
          mathContent = mathContent.slice(0, -2);
          nodes.push(renderDisplayMath(mathContent, `math-${i}`));
          i++;
          continue;
        } else {
          // Multiline display math
          const mathLines: string[] = [];
          if (mathContent) mathLines.push(mathContent);
          i++;
          while (i < lines.length && !lines[i].includes('$$')) {
            mathLines.push(lines[i]);
            i++;
          }
          if (i < lines.length) {
            const endPart = lines[i].replace('$$', '');
            if (endPart) mathLines.push(endPart);
          }
          nodes.push(renderDisplayMath(mathLines.join('\n'), `math-${i}`));
          i++;
          continue;
        }
      }

      // 2. Markdown Table Detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        flushParagraph(`para-${i}`);
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
        i++;
        continue;
      } else if (inTable) {
        flushTable(`tbl-${i}`);
      }

      // 3. Section Headings (e.g. ### Understanding the Question)
      if (line.startsWith('### ')) {
        flushParagraph(`para-${i}`);
        nodes.push(
          <h4
            key={`h3-${i}`}
            className="text-xs font-heading font-extrabold tracking-wider uppercase text-blue-800 mt-4 mb-1.5 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            {line.replace('### ', '')}
          </h4>
        );
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        flushParagraph(`para-${i}`);
        nodes.push(
          <h3
            key={`h2-${i}`}
            className="text-sm font-heading font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200"
          >
            {line.replace('## ', '')}
          </h3>
        );
        i++;
        continue;
      }

      // 4. Bullet / Numbered Lists
      if (/^(\*|-|\d+\.)\s/.test(line.trim())) {
        flushParagraph(`para-${i}`);
        const isNumbered = /^\d+\.\s/.test(line.trim());
        const listText = line.trim().replace(/^(\*|-|\d+\.)\s/, '');
        nodes.push(
          <div key={`li-${i}`} className="flex items-start gap-2 my-1.5 text-xs sm:text-sm text-slate-800">
            <span className="shrink-0 font-bold text-blue-700 text-xs mt-0.5">
              {isNumbered ? line.trim().match(/^\d+\./)?.[0] : '•'}
            </span>
            <div className="flex-1 leading-relaxed">
              {renderInlineMathAndFormatting(listText)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 5. Empty line -> Paragraph separator
      if (!line.trim()) {
        flushParagraph(`para-${i}`);
        i++;
        continue;
      }

      // Default: Accumulate paragraph
      currentParagraph.push(line);
      i++;
    }

    flushParagraph('final');
    flushTable('final');

    return nodes;
  }, [content]);

  return <div className={`math-content font-sans ${className}`}>{renderedElements}</div>;
};

/**
 * Render display LaTeX formula using KaTeX
 */
function renderDisplayMath(latex: string, key: string): React.ReactNode {
  try {
    const html = katex.renderToString(latex.trim(), {
      displayMode: true,
      throwOnError: false,
    });
    return (
      <div
        key={key}
        className="my-3 py-2 px-3 overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/90 text-center shadow-2xs"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (err) {
    return (
      <div key={key} className="my-2 p-2 bg-slate-100 rounded font-mono text-xs overflow-x-auto">
        {latex}
      </div>
    );
  }
}

/**
 * Render inline text with KaTeX `$..$` or `\(..\)` formulas, bold, and code
 */
function renderInlineMathAndFormatting(text: string): React.ReactNode[] {
  // Regex to split by inline math ($...$), bold (**...**), and inline code (`...`)
  const tokens = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)|\*\*[^*]+?\*\*|`[^`]+?`)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;

    // Display math embedded inline ($$...$$)
    if (token.startsWith('$$') && token.endsWith('$$') && token.length > 2) {
      const latex = token.slice(2, -2);
      try {
        const html = katex.renderToString(latex, { displayMode: true, throwOnError: false });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <code key={idx} className="font-mono text-xs">{latex}</code>;
      }
    }

    // Inline math ($...$ or \(...\))
    if ((token.startsWith('$') && token.endsWith('$') && token.length > 1) ||
        (token.startsWith('\\(') && token.endsWith('\\)'))) {
      const latex = token.startsWith('$') ? token.slice(1, -1) : token.slice(2, -2);
      try {
        const html = katex.renderToString(latex, { displayMode: false, throwOnError: false });
        return <span key={idx} className="inline-math mx-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <code key={idx} className="font-mono text-xs px-1 bg-slate-100 rounded">{latex}</code>;
      }
    }

    // Bold text (**...**)
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }

    // Inline code (`...`)
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={idx} className="bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
          {token.slice(1, -1)}
        </code>
      );
    }

    // Plain text
    return <span key={idx}>{token}</span>;
  });
}
