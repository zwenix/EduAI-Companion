/**
 * Utility to parse network-level request errors, detect client-side ad-blockers,
 * and dispatch global notifications.
 */

export interface ApiBlockedEventDetail {
  provider: string;
  url?: string;
  isBlockedByClient: boolean;
  message: string;
}

export function isClientSideBlock(error: any): boolean {
  if (!error) return false;

  const errMsg = String(error.message || error).toLowerCase();
  const errCode = String(error.code || "").toLowerCase();

  // Common browser/network signals when an adblocker (e.g. uBlock Origin, Brave Shield) blocks a client-side network request
  if (
    errCode.includes("err_blocked_by_client") ||
    errCode.includes("blocked_by_client") ||
    errMsg.includes("blocked_by_client") ||
    errMsg.includes("err_blocked_by_client") ||
    errMsg.includes("failed to fetch") ||
    errMsg.includes("load failed") ||
    errMsg.includes("network error")
  ) {
    return true;
  }

  // Axios or fetch network level error checking
  if (error.isAxiosError && !error.response) {
    // If it's an Axios error and there's no response from the server at all,
    // it's a network-level failure or client-side cancellation/block.
    return true;
  }

  return false;
}

export function checkAndReportApiError(error: any, provider: string, targetUrl?: string) {
  const isBlocked = isClientSideBlock(error);
  
  let friendlyMsg = "";
  if (isBlocked) {
    friendlyMsg = `Network request to the ${provider} API was blocked or failed at the client level. This is commonly caused by an active Ad Blocker (like uBlock Origin or Brave Shield) or restrictive network filters. Please try disabling your Ad Blocker or allow connections to ${targetUrl || 'the API domain'}.`;
  } else {
    friendlyMsg = `The ${provider} API is currently unreachable or returned a network error. Please try again later or check your internet connection.`;
  }

  console.error(`[API Network Guard] Detected issue with ${provider}:`, error);

  // Dispatch a global custom event
  const event = new CustomEvent("api-blocked-or-unreachable", {
    detail: {
      provider,
      url: targetUrl,
      isBlockedByClient: isBlocked,
      message: friendlyMsg,
    } as ApiBlockedEventDetail,
  });
  window.dispatchEvent(event);
}
