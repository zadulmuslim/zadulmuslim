import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders stored Markdown (answers, articles). Raw HTML is NOT rendered,
 * so stored content cannot inject scripts.
 */
/** Shared typography for rendered content AND the rich-text editor (WYSIWYG parity). */
export const PROSE_CLASSES = cn(
  "space-y-4 leading-[1.9] [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:bg-secondary/50 [&_blockquote]:px-4 [&_blockquote]:py-2",
  "[&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold",
  "[&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1",
  "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-secondary [&_th]:p-2 [&_hr]:my-6 [&_hr]:border-accent/40",
);

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn(PROSE_CLASSES, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
