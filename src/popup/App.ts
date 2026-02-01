import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import {
  sendMessage,
  type CheckSessionResponse,
  type ListResumesResponse,
} from "@/shared/messages";
import type { AuthState, ResumeData, ThemePreference } from "@/shared/types";
import { STORAGE_KEYS } from "@/shared/constants";
import { t } from "@/shared/i18n";

type View = "loading" | "auth" | "upload" | "processing" | "ready";

const VIEW_HEIGHTS: Record<View, number> = {
  loading: 400,
  auth: 295,
  upload: 580, // Upload view height (scrolls when content doesn't fit)
  processing: 400,
  ready: 460,
};

@customElement("jsa-app")
export class JsaApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 16px;
      background: transparent;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--jsa-border-color);
    }

    .logo {
      display: flex;
      align-items: center;
    }

    .logo-img {
      height: 20px;
      width: auto;
    }

    .logo-img path {
      fill: var(--jsa-text-primary);
    }

    .header-center {
      display: flex;
      justify-content: center;
    }

    .header-right {
      display: flex;
      justify-content: flex-end;
    }

    .user-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .user-email {
      font-size: 12px;
      color: var(--jsa-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .logout-btn {
      padding: 4px 8px;
      font-size: 12px;
      color: var(--jsa-text-secondary);
      background: var(--jsa-bg-subtle);
      border: 1px solid var(--jsa-border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }

    .logout-btn:hover {
      background: var(--jsa-bg-hover);
      color: var(--jsa-text-primary);
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--jsa-spinner-bg);
      border-top-color: var(--jsa-accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .status-ready {
      padding: 16px;
      padding-top: 8px;
      background: var(--jsa-bg-subtle);
      border: 1px solid var(--jsa-border-color);
      border-radius: 8px;
      text-align: center;
    }

    .status-ready-icon {
      font-size: 32px;
      margin-bottom: 8px;
      color: #6ee7b7;
    }

    .status-ready-title {
      font-weight: 600;
      color: #6ee7b7;
      margin-bottom: 4px;
    }

    .status-ready-text {
      font-size: 14px;
      color: #a7f3d0;
    }

    .status-ready-resume {
      font-size: 12px;
      color: var(--jsa-text-muted);
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--jsa-border-color);
    }

    .supported-sites {
      font-size: 11px;
      color: var(--jsa-text-dimmed);
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--jsa-border-color);
    }

    .resume-selector {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--jsa-border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .resume-selector label {
      font-size: 12px;
      color: var(--jsa-text-secondary);
    }

    .custom-select {
      position: relative;
      max-width: 180px;
    }

    .custom-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      padding: 6px 10px;
      border: 1px solid var(--jsa-border-color);
      border-radius: 4px;
      background: var(--jsa-input-bg);
      color: var(--jsa-text-primary);
      cursor: pointer;
      transition: all 0.15s;
      min-width: 140px;
    }

    .custom-select-trigger:hover {
      border-color: var(--jsa-border-hover);
      background-color: var(--jsa-input-bg-hover);
    }

    .custom-select-trigger.open {
      border-color: var(--jsa-input-border-focus);
      background-color: var(--jsa-input-bg-focus);
      box-shadow: 0 0 0 3px var(--jsa-accent-focus-ring);
    }

    .custom-select-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.15s;
      flex-shrink: 0;
    }

    .custom-select-arrow.open {
      transform: rotate(180deg);
    }

    .custom-select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: rgb(20, 40, 80);
      border: 1px solid var(--jsa-border-color);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
    }

    .custom-select-option {
      padding: 4px 10px;
      font-size: 12px;
      color: var(--jsa-text-primary);
      cursor: pointer;
      transition: all 0.15s;
    }

    .custom-select-option:hover {
      background: var(--jsa-bg-hover);
    }

    .custom-select-option.selected {
      background: var(--jsa-accent);
      color: white;
    }

    .footer {
      margin-top: auto;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: var(--jsa-text-muted);
      flex-shrink: 0;
    }

    .footer a {
      color: var(--jsa-link-color);
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    .theme-toggle {
      display: inline-flex;
      gap: 2px;
      background: var(--jsa-bg-subtle);
      border-radius: 6px;
      padding: 2px;
    }

    .theme-btn {
      padding: 3px 8px;
      font-size: 10px;
      color: var(--jsa-text-muted);
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .theme-btn:hover {
      color: var(--jsa-text-primary);
      background: var(--jsa-bg-hover);
    }

    .theme-btn.active {
      color: var(--jsa-text-primary);
      background: var(--jsa-bg-active);
    }
  `;

  @state()
  private view: View = "loading";

  private setView(newView: View) {
    this.view = newView;
    const height = VIEW_HEIGHTS[newView];
    document.documentElement.style.height = `${height}px`;
    document.body.style.height = `${height}px`;
  }

  @state()
  private authState: AuthState | null = null;

  @state()
  private resumeData: ResumeData | null = null;

  @state()
  private allResumes: ResumeData[] = [];

  @state()
  private theme: ThemePreference = "system";

  @state()
  private dropdownOpen = false;

  connectedCallback() {
    super.connectedCallback();
    // Set initial height for loading view
    const height = VIEW_HEIGHTS[this.view];
    document.documentElement.style.height = `${height}px`;
    document.body.style.height = `${height}px`;

    this.loadTheme();
    this.loadAuthState();

    // Listen for auth success messages from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "AUTH_SUCCESS") {
        this.loadAuthState();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (e: Event) => {
    const path = e.composedPath();
    const clickedInside = path.some((el) => {
      if (el instanceof HTMLElement) {
        return el.classList?.contains('custom-select');
      }
      return false;
    });

    if (this.dropdownOpen && !clickedInside) {
      this.dropdownOpen = false;
    }
  };

  private async loadTheme() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
    this.theme = (result[STORAGE_KEYS.THEME] as ThemePreference) || "system";
    this.applyTheme();
  }

  private applyTheme() {
    // Set on document root for CSS variable inheritance
    document.documentElement.setAttribute("data-theme", this.theme);
  }

  private async handleThemeChange(newTheme: ThemePreference) {
    this.theme = newTheme;
    await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: newTheme });
    this.applyTheme();
  }

  private async loadAuthState() {
    try {
      const response = await sendMessage({ type: "GET_AUTH_STATE" });
      if (response.success) {
        this.authState = response.data as AuthState;

        // If not authenticated in extension, check if there's a website session
        if (!this.authState?.jwt) {
          await this.checkWebsiteSession();
          return;
        }

        this.determineView();
      } else {
        this.setView("auth");
      }
    } catch {
      this.setView("auth");
    }
  }

  private async checkWebsiteSession() {
    try {
      const response = await sendMessage({ type: "CHECK_SESSION" });
      if (response.success) {
        const sessionData = (response as CheckSessionResponse).data;
        if (sessionData.authenticated) {
          // Session found, reload auth state
          const authResponse = await sendMessage({ type: "GET_AUTH_STATE" });
          if (authResponse.success) {
            this.authState = authResponse.data as AuthState;
            this.determineView();
            return;
          }
        }
      }
    } catch {
      // Ignore session check errors
    }
    this.setView("auth");
  }

  private determineView() {
    if (!this.authState?.jwt) {
      this.setView("auth");
    } else if (!this.authState.resumeId) {
      this.setView("upload");
    } else {
      // Check resume status
      this.checkResumeStatus();
    }
  }

  private async checkResumeStatus() {
    if (!this.authState?.resumeId) {
      this.setView("upload");
      return;
    }

    try {
      // Load all resumes and current resume status in parallel
      const [statusResponse, listResponse] = await Promise.all([
        sendMessage({
          type: "GET_RESUME_STATUS",
          resumeId: this.authState.resumeId,
        }),
        sendMessage({ type: "LIST_RESUMES" }),
      ]);

      if (listResponse.success) {
        const data = (listResponse as ListResumesResponse).data;
        // Only show successfully processed resumes in the selector
        this.allResumes = data.resumes.filter(r => r.status === "PROCESSING_SUCCEEDED");
      }

      if (statusResponse.success) {
        this.resumeData = statusResponse.data as ResumeData;

        if (this.resumeData.status === "PROCESSING") {
          this.setView("processing");
        } else if (this.resumeData.status === "PROCESSING_SUCCEEDED") {
          this.setView("ready");
        } else {
          // Failed, allow re-upload
          this.setView("upload");
        }
      } else {
        this.setView("upload");
      }
    } catch {
      this.setView("upload");
    }
  }

  private async handleLogin(event: CustomEvent<{ jwt: string; user: AuthState["user"] }>) {
    this.authState = {
      jwt: event.detail.jwt,
      user: event.detail.user,
      resumeId: null,
    };
    this.setView("upload");
  }

  private async handleLogout() {
    await sendMessage({ type: "LOGOUT" });
    this.authState = null;
    this.resumeData = null;
    this.setView("auth");
  }

  private handleUploadComplete(event: CustomEvent<{ resumeId: string }>) {
    if (this.authState) {
      this.authState = { ...this.authState, resumeId: event.detail.resumeId };
    }
    this.setView("processing");
  }

  private handleProcessingComplete(event: CustomEvent<{ resume: ResumeData }>) {
    this.resumeData = event.detail.resume;
    if (this.resumeData.status === "PROCESSING_SUCCEEDED") {
      this.setView("ready");
    } else {
      this.setView("upload");
    }
  }


  private renderThemeToggle() {
    return html`
      <div class="theme-toggle">
        <button
          class="theme-btn ${this.theme === "system" ? "active" : ""}"
          @click=${() => this.handleThemeChange("system")}
          title="${t("themeSystem")}"
        >
          ${t("themeSystem")}
        </button>
        <button
          class="theme-btn ${this.theme === "light" ? "active" : ""}"
          @click=${() => this.handleThemeChange("light")}
          title="${t("themeLight")}"
        >
          ${t("themeLight")}
        </button>
        <button
          class="theme-btn ${this.theme === "dark" ? "active" : ""}"
          @click=${() => this.handleThemeChange("dark")}
          title="${t("themeDark")}"
        >
          ${t("themeDark")}
        </button>
      </div>
    `;
  }

  render() {
    const logoSvg = html`
      <svg class="logo-img" viewBox="0 0 249 87" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.32 67.08C7.84 77.56 14.64 82.8 24.72 82.8C31.52 82.8 36.24 80.88 38.88 77.04C41.6 73.12 42.96 67.76 42.96 60.96V1.2H46.56V60.96C46.56 77.92 39.28 86.4 24.72 86.4C17.84 86.4 12.52 84.68 8.76 81.24C5.08 77.8 2.16 73.08 0 67.08H4.32Z" fill="black"/>
        <path d="M97.4287 21.96C97.4287 14.2 99.3888 8.6 103.309 5.16C107.229 1.72 113.589 0 122.389 0C128.549 0 133.509 1.6 137.269 4.8C141.029 8 143.749 12.88 145.429 19.44L134.269 27.84H128.389L141.349 18.12C139.669 12.76 137.229 9 134.029 6.84C130.909 4.68 127.029 3.6 122.389 3.6C119.189 3.6 116.469 3.8 114.229 4.2C112.069 4.6 109.869 5.4 107.629 6.6C105.469 7.72 103.829 9.56 102.709 12.12C101.589 14.68 101.029 17.96 101.029 21.96C101.029 25.48 102.629 28.6 105.829 31.32C109.109 34.04 113.069 36.36 117.709 38.28C122.349 40.2 126.989 42.16 131.629 44.16C136.349 46.16 140.309 48.72 143.509 51.84C146.789 54.96 148.429 58.56 148.429 62.64C148.429 70.64 146.429 76.6 142.429 80.52C138.509 84.44 131.749 86.4 122.149 86.4C114.309 86.4 108.149 84.84 103.669 81.72C99.1888 78.52 96.1087 73.6 94.4287 66.96L97.7887 65.52C99.3887 72 102.109 76.52 105.949 79.08C109.869 81.56 115.269 82.8 122.149 82.8C129.829 82.8 135.509 81.32 139.189 78.36C142.949 75.4 144.829 70.16 144.829 62.64C144.829 59.12 143.189 56 139.909 53.28C136.709 50.56 132.749 48.24 128.029 46.32C123.389 44.4 118.749 42.44 114.109 40.44C109.469 38.44 105.509 35.88 102.229 32.76C99.0288 29.64 97.4287 26.04 97.4287 21.96Z" fill="black"/>
        <path d="M199.374 81.6H243.534L218.094 11.64L191.334 85.2H187.494L218.094 1.08L248.694 85.2H199.374V81.6Z" fill="black"/>
      </svg>
    `;

    return html`
      <div class="header">
        <div class="logo">${logoSvg}</div>
        <div class="header-center">
          ${this.authState?.user
            ? html`<span class="user-email">${this.authState.user.email}</span>`
            : null}
        </div>
        <div class="header-right">
          ${this.authState?.user
            ? html`<button class="logout-btn" @click=${this.handleLogout}>${t("logout")}</button>`
            : this.renderThemeToggle()}
        </div>
      </div>
      ${this.authState?.user
        ? html`
            <div class="user-bar">
              ${this.renderThemeToggle()}
            </div>
          `
        : null}
      <div class="content">
        ${this.renderContent()}
      </div>
      <div class="footer">
        ${t("footerText")}<br/>
        ${unsafeHTML(t("footerCTA"))}
      </div>
    `;
  }

  private renderContent() {
    switch (this.view) {
      case "loading":
        return html`
          <div class="loading">
            <div class="spinner"></div>
          </div>
        `;

      case "auth":
        return html` <jsa-auth-view @login=${this.handleLogin}></jsa-auth-view> `;

      case "upload":
        return html`
          <jsa-resume-upload
            .error=${this.resumeData?.status === "PROCESSING_FAILED"
              ? this.resumeData.statusReason
              : null}
            @upload-complete=${this.handleUploadComplete}
          ></jsa-resume-upload>
        `;

      case "processing":
        return html`
          <jsa-resume-status
            .resumeId=${this.authState?.resumeId}
            @processing-complete=${this.handleProcessingComplete}
          ></jsa-resume-status>
        `;

      case "ready":
        return html`
          <div class="status-ready">
            <div class="status-ready-icon">&#10003;</div>
            <div class="status-ready-title">${t("readyTitle")}</div>
            <div class="status-ready-text">${t("readySubtitle")}</div>
            <div class="supported-sites">${t("readySupportedSites")}</div>
            ${this.allResumes.length > 1
              ? html`
                  <div class="resume-selector">
                    <label>${t("readyUsingCV")}</label>
                    ${this.renderCustomSelect()}
                  </div>
                `
              : this.resumeData?.name
                ? html`<div class="status-ready-resume">${t("readyUsing", this.resumeData.name)}</div>`
                : null}
          </div>
        `;
    }
  }

  private toggleDropdown(e: Event) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  private async selectResume(e: Event, resumeId: string) {
    e.stopPropagation();
    this.dropdownOpen = false;

    if (resumeId && resumeId !== this.authState?.resumeId) {
      const response = await sendMessage({ type: "SET_ACTIVE_RESUME", resumeId });
      if (response.success && this.authState) {
        this.authState = { ...this.authState, resumeId };
        // Update resumeData to show the new name
        const selectedResume = this.allResumes.find(r => r.id === resumeId);
        if (selectedResume) {
          this.resumeData = selectedResume;
        }
      }
    }
  }

  private renderCustomSelect() {
    const selectedResume = this.allResumes.find(r => r.id === this.authState?.resumeId);
    const arrowSvg = html`
      <svg class="custom-select-arrow ${this.dropdownOpen ? 'open' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    return html`
      <div class="custom-select">
        <div
          class="custom-select-trigger ${this.dropdownOpen ? 'open' : ''}"
          @click=${(e: Event) => this.toggleDropdown(e)}
        >
          <span>${selectedResume?.name || ''}</span>
          ${arrowSvg}
        </div>
        ${this.dropdownOpen ? html`
          <div class="custom-select-dropdown">
            ${this.allResumes.map(resume => html`
              <div
                class="custom-select-option ${resume.id === this.authState?.resumeId ? 'selected' : ''}"
                @click=${(e: Event) => this.selectResume(e, resume.id)}
              >
                ${resume.name}
              </div>
            `)}
          </div>
        ` : null}
      </div>
    `;
  }
}
