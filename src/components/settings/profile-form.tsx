"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fileTypeFromBuffer } from "file-type";
import {
  profileSchema,
  avatarSchema,
  ALLOWED_AVATAR_TYPES,
  AVATAR_FORMAT_ERROR,
  type ProfileInput,
} from "@/lib/validations/user";
import { updateProfile, removeAvatar, type ActionResult } from "@/lib/actions/user-actions";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  name,
  email,
  image,
  hasPassword,
}: {
  name: string;
  email: string;
  image: string | null;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [state, setState] = useState<ActionResult | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasImage, setHasImage] = useState(image !== null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email },
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [isCheckingFile, setIsCheckingFile] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    // Cheap checks first (size, declared type) before touching the file's
    // bytes.
    const result = avatarSchema.safeParse(file);
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "That image can't be used.");
      input.value = "";
      return;
    }

    // A renamed file (e.g. a HEIC or arbitrary file with its extension
    // swapped to .png) still passes the check above, since File.type is
    // just the browser's guess from the extension. Sniff the real magic
    // bytes here so a spoofed file never leaves the browser — this mirrors
    // the authoritative check the server repeats in user-actions.ts, since
    // this client check is UX only and can't be trusted as the real gate.
    setIsCheckingFile(true);
    const buffer = new Uint8Array(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    setIsCheckingFile(false);

    if (!detected || !ALLOWED_AVATAR_TYPES.includes(detected.mime)) {
      setFileError(AVATAR_FORMAT_ERROR);
      input.value = "";
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasImage(true);
  };

  const onRemovePhoto = () => {
    startRemoveTransition(async () => {
      const result = await removeAvatar();
      setState(result);
      if (result.ok) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setHasImage(false);
        toast.success("Photo removed");
        router.refresh();
      }
    });
  };

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    if (selectedFile) formData.set("avatar", selectedFile);

    startTransition(async () => {
      const result = await updateProfile(undefined, formData);
      setState(result);
      if (result.ok) {
        toast.success("Profile updated");
        // revalidatePath alone doesn't re-render already-mounted Server
        // Components on the current page (e.g. the navbar's avatar/name) —
        // only the next navigation would pick up the fresh session. This
        // forces that refresh immediately.
        router.refresh();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar name={name} image={previewUrl ?? image} size="lg" />
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCheckingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {isCheckingFile ? "Checking…" : "Change photo"}
            </Button>
            {hasImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isRemoving}
                onClick={onRemovePhoto}
              >
                {isRemoving ? "Removing…" : "Remove photo"}
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
          <p className="text-muted-foreground text-xs">PNG, JPEG, or WebP. Max 2MB.</p>
          {fileError && <p className="text-destructive text-xs">{fileError}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" disabled={!hasPassword} {...form.register("email")} />
        {!hasPassword && (
          <p className="text-muted-foreground text-xs">Managed by your Google account.</p>
        )}
        {form.formState.errors.email && (
          <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
