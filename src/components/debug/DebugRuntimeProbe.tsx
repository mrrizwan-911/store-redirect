'use client'

import { useEffect } from 'react'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7668/ingest/2b712e1c-2036-4764-9d93-0324dd8ffeeb'

function sendDebugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '072827',
    },
    body: JSON.stringify({
      sessionId: '072827',
      runId: 'initial-repro',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

export function DebugRuntimeProbe() {
  useEffect(() => {
    const mainElement = document.querySelector('main')
    const bodyStyle = window.getComputedStyle(document.body)
    const mainStyle = mainElement ? window.getComputedStyle(mainElement) : null

    sendDebugLog('H1', 'DebugRuntimeProbe.tsx:31', 'runtime-mounted', {
      href: window.location.href,
      readyState: document.readyState,
      userAgent: navigator.userAgent.slice(0, 120),
      hasServiceWorkerAPI: 'serviceWorker' in navigator,
      hasController: Boolean(navigator.serviceWorker?.controller),
      bodyClass: document.body.className,
      mainExists: Boolean(mainElement),
    })

    sendDebugLog('H3', 'DebugRuntimeProbe.tsx:42', 'render-visibility-snapshot', {
      bodyDisplay: bodyStyle.display,
      bodyOpacity: bodyStyle.opacity,
      bodyVisibility: bodyStyle.visibility,
      bodyBackground: bodyStyle.backgroundColor,
      mainDisplay: mainStyle?.display ?? 'missing',
      mainOpacity: mainStyle?.opacity ?? 'missing',
      mainVisibility: mainStyle?.visibility ?? 'missing',
      mainTextLength: mainElement?.textContent?.trim().length ?? 0,
    })

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        sendDebugLog('H2', 'DebugRuntimeProbe.tsx:56', 'service-worker-registrations', {
          registrationCount: registrations.length,
          scopes: registrations.map((registration) => registration.scope),
        })
      }).catch((error: unknown) => {
        sendDebugLog('H2', 'DebugRuntimeProbe.tsx:61', 'service-worker-query-failed', {
          error: error instanceof Error ? error.message : 'unknown-error',
        })
      })
    }

    const onRuntimeError = (event: ErrorEvent) => {
      sendDebugLog('H4', 'DebugRuntimeProbe.tsx:69', 'window-error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      sendDebugLog('H4', 'DebugRuntimeProbe.tsx:79', 'unhandled-rejection', {
        reason: typeof event.reason === 'string' ? event.reason : 'non-string-reason',
      })
    }

    window.addEventListener('error', onRuntimeError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onRuntimeError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
