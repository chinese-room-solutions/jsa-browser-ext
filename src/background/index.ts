import type {
  ExtensionMessage,
  ExtensionResponse,
  ErrorResponse,
  AuthSuccessMessage,
  LoginResponse,
} from "@/shared/messages";
import * as api from "./api";
import { getJobMatches } from "./cache";
import {
  clearAuthState,
  getAuthState,
  setAuthState,
  setResumeId,
  clearMatchCache,
} from "./storage";

// Fetch existing resumes and store the first successfully processed one
async function fetchAndStoreExistingResume(jwt: string): Promise<void> {
  try {
    const { resumes } = await api.listResumes(jwt);
    // Find the first resume that has been successfully processed
    const processedResume = resumes.find(r => r.status === "PROCESSING_SUCCEEDED");
    if (processedResume) {
      await setResumeId(processedResume.id);
    }
  } catch {
    // Don't fail login if we can't fetch resumes
  }
}

// Messages that come from the background script itself (not handled in switch)
type InternalMessage = AuthSuccessMessage;
type HandledMessage = Exclude<ExtensionMessage, InternalMessage>;

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    // Skip AUTH_SUCCESS messages - they're sent from this script, not handled here
    if (message.type === "AUTH_SUCCESS") {
      return false;
    }

    handleMessage(message as HandledMessage)
      .then(sendResponse)
      .catch((error) => {
        console.error("Message handler error:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        } as ErrorResponse);
      });

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: HandledMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_AUTH_STATE": {
      const authState = await getAuthState();
      return { success: true, data: authState };
    }

    case "CHECK_SESSION": {
      // Check if user has an existing session on the website
      const session = await api.checkSession();
      if (session.authenticated && session.jwt && session.user) {
        // Store the session data
        await setAuthState(session.jwt, session.user);
        await clearMatchCache();
        // Fetch existing resumes
        await fetchAndStoreExistingResume(session.jwt);
        return {
          success: true,
          data: { authenticated: true, jwt: session.jwt, user: session.user },
        };
      }
      return { success: true, data: { authenticated: false } };
    }

    case "START_AUTH": {
      // Open auth page and track the tab
      const tab = await chrome.tabs.create({ url: message.authUrl });
      authTabId = tab.id ?? null;
      return { success: true, data: { tabId: authTabId } };
    }

    case "LOGIN_GOOGLE": {
      const response = await api.authenticateWithGoogle(message.idToken);
      await setAuthState(response.jwt, response.user);
      // Clear match cache on login (new user might have different matches)
      await clearMatchCache();
      // Fetch existing resumes and store the first processed one
      await fetchAndStoreExistingResume(response.jwt);
      return {
        success: true,
        data: { jwt: response.jwt, user: response.user },
      };
    }

    case "LOGIN_MICROSOFT": {
      const response = await api.authenticateWithMicrosoft(
        message.authCode,
        message.redirectUri
      );
      await setAuthState(response.jwt, response.user);
      await clearMatchCache();
      // Fetch existing resumes and store the first processed one
      await fetchAndStoreExistingResume(response.jwt);
      return {
        success: true,
        data: { jwt: response.jwt, user: response.user },
      };
    }

    case "LOGOUT": {
      await clearAuthState();
      return { success: true, data: { jwt: null, user: null, resumeId: null } };
    }

    case "UPLOAD_RESUME": {
      console.log("JSA Background: Processing UPLOAD_RESUME");
      const authState = await getAuthState();
      if (!authState.jwt) {
        console.error("JSA Background: Not authenticated for upload");
        return { success: false, error: "Not authenticated" };
      }

      console.log("JSA Background: Uploading file:", message.file.name);
      const response = await api.uploadResume(authState.jwt, message.file);
      console.log("JSA Background: Upload complete, resumeId:", response.resumeId);
      await setResumeId(response.resumeId);
      // Clear match cache since new resume needs new matches
      await clearMatchCache();
      return { success: true, data: { resumeId: response.resumeId } };
    }

    case "GET_RESUME_STATUS": {
      const authState = await getAuthState();
      if (!authState.jwt) {
        return { success: false, error: "Not authenticated" };
      }

      const resume = await api.getResumeStatus(authState.jwt, message.resumeId);
      return { success: true, data: resume };
    }

    case "LIST_RESUMES": {
      const authState = await getAuthState();
      if (!authState.jwt) {
        return { success: false, error: "Not authenticated" };
      }

      const { resumes } = await api.listResumes(authState.jwt);
      return { success: true, data: { resumes } };
    }

    case "SET_ACTIVE_RESUME": {
      await setResumeId(message.resumeId);
      // Clear match cache since different resume may have different matches
      await clearMatchCache();
      return { success: true, data: { resumeId: message.resumeId } };
    }

    case "CHECK_JOB_MATCHES": {
      const matches = await getJobMatches(message.minScore, message.platformSource);
      return { success: true, data: { matches } };
    }

    case "SUBMIT_LINKS": {
      const authState = await getAuthState();
      if (!authState.jwt) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await api.submitLinks(authState.jwt, message.urls);
      return { success: true, data: response };
    }
  }
}

// Handle OAuth callback detection
let authTabId: number | null = null;

chrome.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
  // Only process our auth tab
  if (tabId !== authTabId || !tab.url) return;

  const url = tab.url;

  // Check if we've reached the extension callback page
  if (url.includes("/auth/extension-callback")) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      const idToken = urlParams.get("id_token");
      const jwt = urlParams.get("jwt");
      const authCode = urlParams.get("code");
      const provider = urlParams.get("provider");
      const error = urlParams.get("error");

      // Clear the auth tab tracking (tab will redirect to dashboard on its own)
      authTabId = null;

      if (error) {
        console.error("Auth error:", error);
        return;
      }

      // Handle already-authenticated user (JWT passed directly)
      if (jwt) {
        api.getUserInfo(jwt)
          .then(async (user) => {
            await setAuthState(jwt, user);
            // Fetch existing resumes
            await fetchAndStoreExistingResume(jwt);
            chrome.runtime.sendMessage({ type: "AUTH_SUCCESS", data: { jwt, user } })
              .catch(() => {});
          })
          .catch((err) => {
            console.error("Failed to get user info:", err);
          });
        return;
      }

      // Handle Google authentication (id_token)
      if (idToken) {
        handleMessage({ type: "LOGIN_GOOGLE", idToken })
          .then((response) => {
            if (response.success) {
              const loginResponse = response as LoginResponse;
              chrome.runtime.sendMessage({ type: "AUTH_SUCCESS", data: loginResponse.data })
                .catch(() => {});
            }
          })
          .catch((err) => {
            console.error("Google login failed:", err);
          });
        return;
      }

      // Handle Microsoft authentication (code)
      if (authCode && provider === "microsoft") {
        // Build callback URL from current environment
        const callbackUrl = new URL(url).origin + "/auth/extension-callback";

        handleMessage({ type: "LOGIN_MICROSOFT", authCode, redirectUri: callbackUrl })
          .then((response) => {
            if (response.success) {
              const loginResponse = response as LoginResponse;
              chrome.runtime.sendMessage({ type: "AUTH_SUCCESS", data: loginResponse.data })
                .catch(() => {});
            }
          })
          .catch((err) => {
            console.error("Microsoft login failed:", err);
          });
        return;
      }
    } catch (err) {
      console.error("Error processing auth callback:", err);
    }
  }
});
