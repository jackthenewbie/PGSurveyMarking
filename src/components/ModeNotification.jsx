export function ModeNotification({ notification }) {
  if (!notification) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mode-notification"
      style={{
        left: `${notification.x}px`,
        top: `${notification.y}px`,
      }}
    >
      {notification.message}
    </div>
  )
}
