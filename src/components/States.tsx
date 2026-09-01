export function LoadingState({ message = "Analyzing..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in" role="status" aria-live="polite">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border-subtle" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent-blue" />
      </div>
      <p className="mt-4 text-sm text-text-secondary animate-pulse-subtle">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="sentinel-card border border-risk-high/30 animate-fade-in" role="alert">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-risk-high/15">
          <span className="text-risk-high text-sm font-bold">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-risk-high">Error</p>
          <p className="mt-1 text-sm text-text-secondary">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="sentinel-btn-secondary mt-3 text-sm">
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
