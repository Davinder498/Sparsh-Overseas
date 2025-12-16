/**
 * A mock error monitoring service. In a real production app, this would
 * integrate with a service like Sentry, LogRocket, or Datadog to
 * report client-side errors for proactive debugging.
 */

// A simple in-memory flag to prevent duplicate initializations.
let isInitialized = false;

/**
 * Initializes the global error handlers to capture unhandled exceptions
 * and promise rejections. This should be called once when the app starts.
 */
export const initErrorMonitoring = (): void => {
  if (isInitialized) {
    console.warn("Error monitoring is already initialized.");
    return;
  }

  // Capture unhandled exceptions
  window.onerror = (message, source, lineno, colno, error) => {
    console.log("[Error Monitoring] Unhandled Exception Caught:");
    captureError(error || new Error(message as string), {
      source: `${source}:${lineno}:${colno}`,
      type: "window.onerror"
    });
    // Let the default browser error handler run as well
    return false;
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = (event) => {
    console.log("[Error Monitoring] Unhandled Promise Rejection Caught:");
    captureError(event.reason, { type: "unhandledrejection" });
  };

  isInitialized = true;
  console.log("Client-side error monitoring initialized.");
};

/**
 * Reports an error. This is the function you'd call from your try/catch
 * blocks to manually report errors with more context.
 *
 * @param error The error object to report.
 * @param context Additional key-value pairs to provide context.
 */
export const captureError = (error: any, context?: Record<string, any>): void => {
  const errorMessage = error?.message || 'Unknown error';
  const errorStack = error?.stack || 'No stack trace available';
  const errorName = error?.name || 'Error';

  // Log error details in a more explicit, readable format
  console.error(
    `[Error Monitoring Service] ${errorName}: ${errorMessage}`,
    `Stack: ${errorStack}`,
    `Context: ${JSON.stringify(context, null, 2)}`, // Stringify context for clear output
    'Original Error Object:', error, // Also pass the original error object for browser dev tools to inspect
    'Timestamp:', new Date().toISOString()
  );
};