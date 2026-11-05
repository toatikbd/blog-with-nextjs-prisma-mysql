"use client";

import { useActionState, useState } from "react";
import { createPost, type PostFormState } from "@/actions/admin/post";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";
import { PostEditor } from "./post-editor";

type Option = { id: string; name: string };

export function PostForm({ categories, tags }: { categories: Option[]; tags: Option[] }) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(createPost, {});
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  // The slug follows the title until the author edits it by hand.
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(values.slug));
  const shownSlug = slugEdited ? slug : slugify(title);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_18rem]" noValidate>
      <div className="grid min-w-0 content-start gap-5">
        <FormField
          label="Title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          errors={errors.title}
        />
        <FormField
          label="Slug"
          name="slug"
          placeholder="generated-from-the-title"
          value={shownSlug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          errors={errors.slug}
        />
        <TextAreaField
          label="Excerpt"
          name="excerpt"
          hint="A short summary shown in the feed and in search results (up to 300 characters)."
          defaultValue={values.excerpt}
          errors={errors.excerpt}
        />
        <div className="grid gap-2">
          <Label>Content</Label>
          <PostEditor
            name="content"
            defaultValue={values.content}
            invalid={Boolean(errors.content?.length)}
            describedBy={errors.content?.length ? "content-error" : undefined}
          />
          {errors.content?.length ? (
            <p id="content-error" className="text-sm text-destructive">
              {errors.content[0]}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="grid content-start gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Tags</legend>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <div className="grid max-h-48 gap-1.5 overflow-y-auto">
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.id}
                    defaultChecked={values.tagIds?.includes(t.id)}
                    className="size-4 accent-primary"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          )}
          {errors.tagIds?.length ? (
            <p className="text-sm text-destructive">{errors.tagIds[0]}</p>
          ) : null}
        </fieldset>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="grid gap-2 border-t pt-4">
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Saving…" : "Publish"}
          </Button>
          <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
            Save draft
          </Button>
        </div>
      </aside>
    </form>
  );
}

function TextAreaField({
  label,
  name,
  hint,
  errors,
  ...props
}: React.ComponentProps<"textarea"> & {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={3}
        maxLength={300}
        aria-invalid={hasError || undefined}
        aria-describedby={`${name}-hint`}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        {...props}
      />
      <p
        id={`${name}-hint`}
        className={hasError ? "text-sm text-destructive" : "text-xs text-muted-foreground"}
      >
        {hasError ? errors![0] : hint}
      </p>
    </div>
  );
}
