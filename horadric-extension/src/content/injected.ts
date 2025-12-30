/**
 * Injected script - runs in the PAGE context (not content script sandbox)
 * This allows us to intercept fetch/XHR responses that the page makes
 */

// Store original functions
const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Intercept fetch requests
window.fetch = async function (...args): Promise<Response> {
  const response = await originalFetch.apply(this, args);

  // Check if this is a diablo.trade API request we care about
  const url = args[0]?.toString() || '';
  if (isRelevantRequest(url)) {
    try {
      // Clone response to avoid consuming it
      const clone = response.clone();
      const data = await clone.json();

      // Post to content script
      window.postMessage(
        {
          type: 'HORADRIC_FETCH_INTERCEPT',
          url: url,
          data: data,
        },
        '*'
      );
    } catch {
      // Not JSON or other error, ignore
    }
  }

  return response;
};

// Intercept XHR requests
XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  ...rest: unknown[]
) {
  (this as XMLHttpRequest & { _horadricUrl?: string })._horadricUrl = url.toString();
  return originalXHROpen.apply(this, [method, url, ...rest] as Parameters<typeof originalXHROpen>);
};

XMLHttpRequest.prototype.send = function (...args) {
  const xhr = this as XMLHttpRequest & { _horadricUrl?: string };

  xhr.addEventListener('load', function () {
    if (xhr._horadricUrl && isRelevantRequest(xhr._horadricUrl)) {
      try {
        const data = JSON.parse(xhr.responseText);
        window.postMessage(
          {
            type: 'HORADRIC_XHR_INTERCEPT',
            url: xhr._horadricUrl,
            data: data,
          },
          '*'
        );
      } catch {
        // Not JSON, ignore
      }
    }
  });

  return originalXHRSend.apply(this, args as Parameters<typeof originalXHRSend>);
};

// Check if URL is a diablo.trade API we want to intercept
function isRelevantRequest(url: string): boolean {
  return (
    url.includes('/api/listing') ||
    url.includes('/listings/items') ||
    url.includes('/graphql') ||
    url.includes('trpc')
  );
}

// Log that we're active
console.log('[Horadric Abacus] Price tracking active');
