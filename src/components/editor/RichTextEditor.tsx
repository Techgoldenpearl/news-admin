"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon,
  Image as ImageIcon, Play, AlignLeft, AlignCenter,
  AlignRight, Heading1, Heading2, Heading3, Pilcrow, RemoveFormatting,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition ${
        active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing your article..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full mx-auto" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  const addImage = () => {
    const url = prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = prompt("Link URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = prompt("YouTube URL:");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const s = 16;

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph"><Pilcrow size={s} /></ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code"><Code size={s} /></ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left"><AlignLeft size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center"><AlignCenter size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right"><AlignRight size={s} /></ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><List size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List"><ListOrdered size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={s} /></ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add Link"><LinkIcon size={s} /></ToolbarButton>
        <ToolbarButton onClick={addImage} title="Add Image"><ImageIcon size={s} /></ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="Add YouTube"><Play size={s} /></ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting"><RemoveFormatting size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={s} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={s} /></ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
