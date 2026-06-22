import { cn } from '@/lib/utils';

interface OrbitLoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Brand loader: a 3D wireframe globe spinning on its axis (CSS 3D — perspective
 * + preserve-3d). Used on first load and as the "AI is finding trips" state.
 */
export function OrbitLoader({ size = 96, className, label }: OrbitLoaderProps) {
  return (
    <div
      className={cn('inline-flex flex-col items-center gap-4', className)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <div className="yl-globe" style={{ width: size, height: size }}>
        <div className="yl-globe__sphere">
          <span className="yl-globe__ring" />
          <span className="yl-globe__ring" />
          <span className="yl-globe__ring" />
          <span className="yl-globe__ring yl-globe__ring--equator" />
          <span className="yl-globe__core" />
        </div>
      </div>
      {label ? <p className="text-sm text-ink-2">{label}</p> : null}
    </div>
  );
}
