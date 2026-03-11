'use client'

import ReactMarkdown from 'react-markdown'

type Props = {
  content: string
}

export default function MarkdownBio({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-300 prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50 prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'br', 'code']}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
