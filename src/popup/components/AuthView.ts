import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sendMessage } from "@/shared/messages";
import { API_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";

@customElement("jsa-auth-view")
export class AuthView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .intro {
      text-align: center;
      margin-bottom: 20px;
    }

    .intro-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--jsa-text-primary);
      margin-bottom: 8px;
    }

    .intro-text {
      font-size: 14px;
      color: var(--jsa-text-secondary);
      line-height: 1.5;
    }

    .auth-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .auth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid var(--jsa-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      background: var(--jsa-bg-subtle);
      color: var(--jsa-text-primary);
    }

    .auth-btn:hover:not(:disabled) {
      background: var(--jsa-bg-hover);
      border-color: var(--jsa-border-hover);
    }

    .auth-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auth-btn-icon {
      width: 20px;
      height: 20px;
    }

    .error {
      margin-top: 16px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 13px;
    }
  `;

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  private authMessageListener: ((message: any) => void) | null = null;

  connectedCallback() {
    super.connectedCallback();

    // Listen for auth success messages from background script
    this.authMessageListener = (message: any) => {
      if (message.type === "AUTH_SUCCESS") {
        this.loading = false;
        this.dispatchEvent(
          new CustomEvent("login", {
            detail: message.data,
          })
        );
      }
    };

    chrome.runtime.onMessage.addListener(this.authMessageListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.authMessageListener) {
      chrome.runtime.onMessage.removeListener(this.authMessageListener);
    }
  }

  private async handleLogin() {
    this.loading = true;
    this.error = null;

    try {
      // Send message to background script to start auth
      const authUrl = `${API_BASE_URL}/auth/login?source=extension`;
      const response = await sendMessage({
        type: "START_AUTH",
        authUrl,
      });

      if (!response.success) {
        this.error = (response as { error: string }).error || t("authLoginFailed");
        this.loading = false;
      }

      // Loading state will be cleared by AUTH_SUCCESS message or timeout
      setTimeout(() => {
        if (this.loading) {
          this.loading = false;
          this.error = t("authLoginTimedOut");
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      this.error = err instanceof Error ? err.message : t("authLoginFailed");
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="intro">
        <div class="intro-title">${t("authTitle")}</div>
        <div class="intro-text">${t("authSubtitle")}</div>
      </div>

      <div class="auth-buttons">
        <button class="auth-btn" @click=${this.handleLogin} ?disabled=${this.loading}>
          ${t("authLoginButton")}
        </button>
      </div>

      ${this.error ? html`<div class="error">${this.error}</div>` : null}
    `;
  }
}
