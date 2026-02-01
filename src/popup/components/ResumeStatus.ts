import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sendMessage } from "@/shared/messages";
import type { ResumeData } from "@/shared/types";
import { t } from "@/shared/i18n";

@customElement("jsa-resume-status")
export class ResumeStatus extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      text-align: center;
      padding: 0;
    }

    .spinner-container {
      margin-bottom: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--jsa-spinner-bg);
      border-top-color: var(--jsa-accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--jsa-text-primary);
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: var(--jsa-text-secondary);
      line-height: 1.5;
    }

    .progress-steps {
      margin-top: 24px;
      text-align: left;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      font-size: 14px;
      color: var(--jsa-text-muted);
    }

    .step.active {
      color: var(--jsa-text-primary);
    }

    .step.completed {
      color: #6ee7b7;
    }

    .step-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .step-icon.pending {
      background: var(--jsa-bg-subtle);
      color: var(--jsa-text-dimmed);
    }

    .step-icon.active {
      background: var(--jsa-accent);
      color: white;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .step-icon.completed {
      background: #10b981;
      color: white;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
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

  @property({ type: String })
  resumeId: string | null = null;

  @state()
  private step = 0;

  @state()
  private error: string | null = null;

  private pollInterval: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopPolling();
  }

  private startPolling() {
    // Initial check
    this.checkStatus();

    // Poll every 2 seconds
    this.pollInterval = window.setInterval(() => {
      this.checkStatus();
    }, 2000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async checkStatus() {
    if (!this.resumeId) return;

    try {
      const response = await sendMessage({
        type: "GET_RESUME_STATUS",
        resumeId: this.resumeId,
      });

      if (!response.success) {
        this.error = (response as { error: string }).error || t("processingStatusError");
        return;
      }

      const resume = response.data as ResumeData;

      // Update step based on time elapsed (simulated progress)
      const elapsed = Date.now() - new Date(resume.createdAt).getTime();
      if (elapsed < 3000) {
        this.step = 0; // Uploading
      } else {
        this.step = 1; // Indexing
      }

      if (resume.status === "PROCESSING_SUCCEEDED") {
        this.stopPolling();
        this.step = 2; // Done
        this.dispatchEvent(
          new CustomEvent("processing-complete", {
            detail: { resume },
          })
        );
      } else if (resume.status === "PROCESSING_FAILED") {
        this.stopPolling();
        this.error = resume.statusReason || t("processingFailed");
        this.dispatchEvent(
          new CustomEvent("processing-complete", {
            detail: { resume },
          })
        );
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : t("processingStatusError");
    }
  }

  private renderStepIcon(stepIndex: number) {
    if (stepIndex < this.step) {
      return html`<span class="step-icon completed">&#10003;</span>`;
    } else if (stepIndex === this.step) {
      return html`<span class="step-icon active">&#8226;</span>`;
    } else {
      return html`<span class="step-icon pending">&#8226;</span>`;
    }
  }

  render() {
    const steps = [
      t("processingStepUploading"),
      t("processingStepIndexing"),
    ];

    return html`
      <div class="container">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>

        <div class="title">${t("processingTitle")}</div>
        <div class="subtitle">${t("processingSubtitle")}</div>

        <div class="progress-steps">
          ${steps.map(
            (label, index) => html`
              <div
                class="step ${index < this.step
                  ? "completed"
                  : index === this.step
                    ? "active"
                    : ""}"
              >
                ${this.renderStepIcon(index)}
                <span>${label}</span>
              </div>
            `
          )}
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : null}
      </div>
    `;
  }
}
