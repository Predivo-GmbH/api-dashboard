import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Announces route changes to screen readers for SPA navigation.
 */
export function RouteAnnouncer() {
  const location = useLocation()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    // Wait for the page to render and update the document title
    const timer = setTimeout(() => {
      const pageTitle = document.title || 'Page'
      setAnnouncement(`Navigated to ${pageTitle}`)
    }, 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
