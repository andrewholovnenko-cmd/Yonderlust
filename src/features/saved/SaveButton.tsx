'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { TripIdea } from '@/services/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { savedService } from '@/services';
import { Button } from '@/components/ui/Button';

export function SaveButton({
  idea,
  className,
  size = 'md',
}: {
  idea: TripIdea;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { user, status, signIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let active = true;
    savedService.isSaved(user.id, idea.id).then((s) => {
      if (active) setSaved(s);
    });
    return () => {
      active = false;
    };
  }, [user, idea.id]);

  async function toggle() {
    if (!user) {
      await signIn();
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        const list = await savedService.list(user.id);
        const entry = list.find((s) => s.idea.id === idea.id);
        if (entry) await savedService.remove(user.id, entry.id);
        setSaved(false);
      } else {
        await savedService.add(user.id, idea);
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={saved ? 'secondary' : 'outline'}
      size={size}
      onClick={() => void toggle()}
      disabled={busy || status === 'loading'}
      className={className}
    >
      {saved ? (
        <>
          <BookmarkCheck className="size-4" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="size-4" />
          Save trip
        </>
      )}
    </Button>
  );
}
