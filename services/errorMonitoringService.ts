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
  // In a real implementation, you would send this data to your monitoring service.
  // Example: Sentry.captureException(error, { extra: context });
  
  console.error("[Error Monitoring Service]", {
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    },
    context,
    timestamp: new Date().toISOString()
  });
};