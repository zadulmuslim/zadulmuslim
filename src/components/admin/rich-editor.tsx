"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Minus, Quote, Redo2, Undo2,
} from "lucide-react";
import { uploadFile } from "@/lib/storage/client-upload";
import type { MediaCategory } from "@/lib/storage/categories";
import { PROSE_CLASSES } from "@/components/content/markdown";
import { cn } from "@/lib/utils";

/** Empty paragraphs serialize as "&nbsp;"; drop them and collapse extra blank lines. */
function cleanMarkdown(md: string): string {
  return md
    .split("\n")
    .filter((line) => line.trim() !== "&nbsp;")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * WYSIWYG editor: formatting and images appear exactly as readers will see
 * them. Content is stored as Markdown (same as before), so existing posts keep
 * working and rendering stays safe (no raw HTML is ever stored or rendered).
 * Images can be added from the toolbar, pasted or dropped; they are compressed
 * in the browser and uploaded to Cloudflare R2.
 */
export function RichEditor({
  name,
  defaultValue = "",
  imageCategory,
  onMediaUploaded,
  placeholder = "এখানে লিখুন…",
  id,
  minHeight = 320,
}: {
  name: string;
  defaultValue?: string;
  imageCategory?: MediaCategory;
  onMediaUploaded?: (mediaId: string) => void;
  placeholder?: string;
  id?: string;
  minHeight?: number;
}) {
  const [markdown, setMarkdown] = useState(defaultValue);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const upload = useCallback(
    async (files: File[]) => {
      const editor = editorRef.current;
      if (!editor || !imageCategory) return;
      setError(null);
      for (const file of files.filter((f) => f.type.startsWith("image/"))) {
        setUploading(0);
        try {
          const media = await uploadFile(file, { category: imageCategory, onProgress: setUploading });
          onMediaUploaded?.(media.id);
          editor.chain().focus().setImage({ src: media.url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
        } catch (e) {
          setError(e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে।");
        }
      }
      setUploading(null);
    },
    [imageCategory, onMediaUploaded],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false, // not representable in Markdown
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: defaultValue,
    contentType: "markdown",
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: cn(PROSE_CLASSES, "px-5 py-4 text-[15px] focus:outline-none"),
        style: `min-height:${minHeight}px`,
        "aria-label": "লেখার জায়গা",
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length || !imageCategory) return false;
        void upload(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length || !imageCategory) return false;
        event.preventDefault();
        void upload(files);
        return true;
      },
    },
    onUpdate: ({ editor }) => setMarkdown(cleanMarkdown(editor.getMarkdown())),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("লিংক (URL) দিন — মুছতে খালি রাখুন", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const Btn = ({ on, active, label, children, disabled }: { on: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      disabled={disabled || !editor}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-35",
        active ? "bg-primary text-white" : "text-foreground/70 hover:bg-secondary hover:text-primary",
      )}
    >
      {children}
    </button>
  );
  const Sep = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />;

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
      <input type="hidden" name={name} value={markdown} />
      <div className="sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b bg-secondary/60 px-2 py-1 backdrop-blur" role="toolbar" aria-label="লেখার টুলবার">
        <Btn label="গাঢ়" active={state?.bold} on={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
        <Btn label="বাঁকা" active={state?.italic} on={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
        <Sep />
        <Btn label="উপশিরোনাম" active={state?.h2} on={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
        <Btn label="ছোট উপশিরোনাম" active={state?.h3} on={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
        <Sep />
        <Btn label="বুলেট তালিকা" active={state?.bullet} on={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
        <Btn label="ক্রমিক তালিকা" active={state?.ordered} on={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
        <Btn label="উদ্ধৃতি / দলীল" active={state?.quote} on={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
        <Btn label="বিভাজক রেখা" on={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Btn>
        <Btn label="লিংক" active={state?.link} on={setLink}><Link2 className="size-4" /></Btn>
        {imageCategory && (
          <>
            <Sep />
            <Btn label="ছবি যোগ করুন" on={() => fileInput.current?.click()} disabled={uploading !== null}>
              {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            </Btn>
            {uploading !== null && <span className="shrink-0 px-1 text-xs text-muted-foreground">{uploading}%</span>}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void upload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </>
        )}
        <span className="ml-auto flex shrink-0 items-center">
          <Btn label="পূর্বাবস্থা" disabled={!state?.canUndo} on={() => editor?.chain().focus().undo().run()}><Undo2 className="size-4" /></Btn>
          <Btn label="পুনরায়" disabled={!state?.canRedo} on={() => editor?.chain().focus().redo().run()}><Redo2 className="size-4" /></Btn>
        </span>
      </div>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="px-5 py-4 text-sm text-muted-foreground" style={{ minHeight }}>
          লোড হচ্ছে…
        </div>
      )}
      {error && <p className="border-t px-4 py-2 text-xs text-destructive">{error}</p>}
      <style>{`.ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:var(--muted-foreground);float:left;height:0;pointer-events:none}.ProseMirror img.ProseMirror-selectednode{outline:3px solid var(--accent)}`}</style>
    </div>
  );
}
