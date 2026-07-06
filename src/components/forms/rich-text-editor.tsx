"use client";

import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { cn } from "@lib/utils";
import { uploadNewsImage } from "@server/actions/news";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useTransition } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-7 px-2",
        active && "border-primary bg-primary/10 text-primary",
      )}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();

  function handleImageSelected(file: File) {
    const formData = new FormData();
    formData.set("image", file);
    startUpload(async () => {
      const result = await uploadNewsImage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const url = result.data?.url;
      if (url)
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Icons.Editor.Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Icons.Editor.Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Icons.Editor.Underline size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Icons.Editor.Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Icons.Editor.Code size={14} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Icons.Editor.H1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Icons.Editor.H2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Icons.Editor.H3 size={14} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Icons.Editor.Quote size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Icons.Editor.BulletList size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Icons.Editor.OrderedList size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Icons.Editor.HorizontalRule size={14} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Add link"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) {
            editor
              .chain()
              .focus()
              .setLink({
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
              })
              .run();
          }
        }}
      >
        <Icons.Editor.Link size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Icons.Editor.Unlink size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Insert image"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Icons.Editor.Image size={14} />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleImageSelected(file);
        }}
      />

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Icons.Editor.Undo size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Icons.Editor.Redo size={14} />
      </ToolbarButton>
    </div>
  );
}

export function FormRichText<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RichTextField
          label={label}
          description={description}
          disabled={disabled}
          invalid={fieldState.invalid}
          value={field.value ?? ""}
          onChange={field.onChange}
          fieldName={field.name}
          error={fieldState.error}
        />
      )}
    />
  );
}

function RichTextField({
  label,
  description,
  disabled,
  invalid,
  value,
  onChange,
  fieldName,
  error,
}: {
  label: string;
  description?: string;
  disabled?: boolean;
  invalid: boolean;
  value: string;
  onChange: (value: string) => void;
  fieldName: string;
  error: { message?: string } | undefined;
}) {
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link,
      Image,
      Placeholder.configure({ placeholder: "Write your news post…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        id: fieldName,
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-40 px-3 py-2 focus:outline-none",
      },
    },
  });

  // Sync external value changes (e.g. form reset/draft restore) into the editor,
  // without fighting our own onUpdate echoes.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(value);
    lastEmitted.current = value;
  }, [value, editor]);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={fieldName}>{label}</FieldLabel>
      <div className="rounded-md border border-input">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}
