import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sendMessage } from "@/shared/messages";
import { t } from "@/shared/i18n";

type UploadMode = "upload" | "text";

@customElement("jsa-resume-upload")
export class ResumeUpload extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .wrapper {
      display: flex;
      flex-direction: column;
    }

    .form-container {
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--jsa-text-primary);
      margin-bottom: 8px;
      text-align: center;
    }

    .subtitle {
      font-size: 14px;
      color: var(--jsa-text-secondary);
      margin-bottom: 12px;
      text-align: center;
    }

    .mode-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .mode-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--jsa-text-secondary);
      background: var(--jsa-bg-subtle);
      border: 1px solid var(--jsa-border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mode-tab:hover {
      background: var(--jsa-bg-hover);
    }

    .mode-tab.active {
      color: var(--jsa-link-color);
      background: rgba(34, 211, 238, 0.15);
      border-color: var(--jsa-accent);
    }

    .mode-tab svg {
      width: 16px;
      height: 16px;
    }

    .upload-zone {
      border: 2px dashed var(--jsa-border-color);
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .upload-zone:hover,
    .upload-zone.drag-over {
      border-color: var(--jsa-accent);
      background: rgba(34, 211, 238, 0.1);
    }

    .upload-zone.drag-over {
      border-style: solid;
      background: rgba(34, 211, 238, 0.15);
    }

    .upload-zone:focus {
      outline: none;
      border-color: var(--jsa-accent);
      box-shadow: 0 0 0 3px var(--jsa-accent-focus-ring);
    }

    .upload-zone-icon {
      width: 36px;
      height: 36px;
      margin: 0 auto 8px;
      color: var(--jsa-text-dimmed);
    }

    .upload-zone-text {
      font-size: 14px;
      color: var(--jsa-text-primary);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .upload-zone-hint {
      font-size: 12px;
      color: var(--jsa-text-muted);
      line-height: 1.4;
    }

    .upload-zone-hint strong {
      color: var(--jsa-text-secondary);
    }

    .file-input {
      display: none;
    }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: var(--jsa-bg-subtle);
      border-radius: 8px;
      margin-top: 12px;
    }

    .selected-file-icon {
      width: 32px;
      height: 32px;
      color: var(--jsa-accent);
    }

    .selected-file-info {
      flex: 1;
      min-width: 0;
    }

    .selected-file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--jsa-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .selected-file-size {
      font-size: 12px;
      color: var(--jsa-text-muted);
    }

    .remove-file {
      padding: 4px;
      color: var(--jsa-text-muted);
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .remove-file:hover {
      background: var(--jsa-bg-subtle);
      color: var(--jsa-text-primary);
    }

    .text-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .text-title-input {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      color: var(--jsa-text-primary);
      background: var(--jsa-input-bg);
      border: 1px solid var(--jsa-border-color);
      border-radius: 6px;
      box-sizing: border-box;
      transition: all 0.15s;
    }

    .text-title-input:hover {
      background: var(--jsa-input-bg-hover);
      border-color: var(--jsa-border-hover);
    }

    .text-title-input:focus {
      outline: none;
      background: var(--jsa-input-bg-focus);
      border-color: var(--jsa-input-border-focus);
      box-shadow: 0 0 0 3px var(--jsa-accent-focus-ring);
    }

    .text-title-input::placeholder {
      color: var(--jsa-text-dimmed);
    }

    .text-content-textarea {
      width: 100%;
      height: 200px;
      padding: 10px 12px;
      font-size: 13px;
      font-family: inherit;
      line-height: 1.5;
      color: var(--jsa-text-primary);
      background: var(--jsa-input-bg);
      border: 1px solid var(--jsa-border-color);
      border-radius: 6px;
      resize: none;
      box-sizing: border-box;
      transition: all 0.15s;
      overflow-y: auto;
    }

    .text-content-textarea:hover {
      background: var(--jsa-input-bg-hover);
      border-color: var(--jsa-border-hover);
    }

    .text-content-textarea:focus {
      outline: none;
      background: var(--jsa-input-bg-focus);
      border-color: var(--jsa-input-border-focus);
      box-shadow: 0 0 0 3px var(--jsa-accent-focus-ring);
    }

    .text-content-textarea::placeholder {
      color: var(--jsa-text-dimmed);
    }

    .text-hint {
      font-size: 12px;
      color: var(--jsa-text-muted);
    }

    .char-count {
      font-size: 12px;
      color: var(--jsa-text-dimmed);
      text-align: right;
    }

    .char-count.warning {
      color: #fca5a5;
    }

    .upload-btn {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background: var(--jsa-accent);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .upload-btn:hover:not(:disabled) {
      filter: brightness(0.9);
    }

    .upload-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .upload-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .error {
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 13px;
    }
  `;

  @property({ type: String })
  error: string | null = null;

  @state()
  private mode: UploadMode = "upload";

  @state()
  private selectedFile: File | null = null;

  @state()
  private uploading = false;

  @state()
  private uploadError: string | null = null;

  @state()
  private textTitle = "";

  @state()
  private resumeText = "";

  @state()
  private isDragOver = false;

  private static readonly MIN_TEXT_LENGTH = 15;
  private static readonly MAX_TEXT_LENGTH = 10000;

  connectedCallback() {
    super.connectedCallback();
    // Listen for paste events on the document
    document.addEventListener("paste", this.handlePaste);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("paste", this.handlePaste);
  }

  private handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          this.selectFile(file);
          return;
        }
      }
    }
  };

  private handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectFile(file);
    }
  }

  private selectFile(file: File) {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const validExtensions = [".pdf", ".docx", ".txt"];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      this.uploadError = t("uploadErrorInvalidType");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = t("uploadErrorTooLarge");
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;

    // Auto-start upload after file selection for smoother UX
    this.handleUpload();
  }

  private removeFile() {
    this.selectedFile = null;
    this.uploadError = null;
  }

  private async handleUpload() {
    if (!this.selectedFile || this.uploading) return;

    this.uploading = true;
    this.uploadError = null;

    try {
      console.log("JSA: Starting upload for", this.selectedFile.name);

      // Read file as base64
      const base64 = await this.fileToBase64(this.selectedFile);
      console.log("JSA: File converted to base64, size:", base64.length);

      const response = await sendMessage({
        type: "UPLOAD_RESUME",
        file: {
          name: this.selectedFile.name,
          type: this.selectedFile.type || "application/octet-stream",
          data: base64,
        },
      });

      console.log("JSA: Upload response:", response);

      if (response.success) {
        const data = response.data as { resumeId: string };
        console.log("JSA: Upload successful, resumeId:", data.resumeId);
        this.dispatchEvent(
          new CustomEvent("upload-complete", {
            detail: { resumeId: data.resumeId },
          })
        );
      } else {
        const errorMsg = (response as { error: string }).error || t("uploadErrorFailed");
        console.error("JSA: Upload failed:", errorMsg);
        this.uploadError = errorMsg;
      }
    } catch (err) {
      console.error("JSA: Upload exception:", err);
      this.uploadError = err instanceof Error ? err.message : t("uploadErrorFailed");
    } finally {
      this.uploading = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error(t("uploadErrorFailed")));
      reader.readAsDataURL(file);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async handleTextSubmit() {
    if (this.resumeText.length < ResumeUpload.MIN_TEXT_LENGTH || this.resumeText.length > ResumeUpload.MAX_TEXT_LENGTH || this.uploading) return;

    this.uploading = true;
    this.uploadError = null;

    try {
      // Generate filename from title or use default
      let filename = "My CV.txt";
      if (this.textTitle.trim()) {
        // Sanitize filename - remove invalid characters
        const invalidChars = ["/", "\\", ":", "*", "?", '"', "|", "<", ">"];
        let sanitized = this.textTitle;
        for (const char of invalidChars) {
          sanitized = sanitized.replaceAll(char, "");
        }
        sanitized = sanitized.trim().substring(0, 100);
        if (sanitized) {
          filename = sanitized + ".txt";
        }
      }

      // Create text file as base64
      const content = this.resumeText;
      const base64 = btoa(unescape(encodeURIComponent(content)));

      console.log("JSA: Starting text upload as", filename);

      const response = await sendMessage({
        type: "UPLOAD_RESUME",
        file: {
          name: filename,
          type: "text/plain",
          data: base64,
        },
      });

      console.log("JSA: Upload response:", response);

      if (response.success) {
        const data = response.data as { resumeId: string };
        console.log("JSA: Upload successful, resumeId:", data.resumeId);
        this.dispatchEvent(
          new CustomEvent("upload-complete", {
            detail: { resumeId: data.resumeId },
          })
        );
      } else {
        const errorMsg = (response as { error: string }).error || t("uploadErrorFailed");
        console.error("JSA: Upload failed:", errorMsg);
        this.uploadError = errorMsg;
      }
    } catch (err) {
      console.error("JSA: Upload exception:", err);
      this.uploadError = err instanceof Error ? err.message : t("uploadErrorFailed");
    } finally {
      this.uploading = false;
    }
  }

  private setMode(mode: UploadMode) {
    this.mode = mode;
    this.uploadError = null;
  }

  private openFileDialog() {
    const input = this.shadowRoot?.querySelector<HTMLInputElement>(".file-input");
    input?.click();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.openFileDialog();
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      this.selectFile(file);
    }
  }

  private renderUploadMode() {
    return html`
      <div
        class="upload-zone ${this.isDragOver ? "drag-over" : ""}"
        tabindex="0"
        @click=${this.openFileDialog}
        @keydown=${this.handleKeyDown}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        <svg class="upload-zone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div class="upload-zone-text">${t("uploadDropzoneText")}</div>
        <div class="upload-zone-hint">${t("uploadDropzoneHint")}</div>
        <div class="upload-zone-hint">${t("uploadDropzoneFormats")}</div>
      </div>

      <input
        type="file"
        class="file-input"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        @change=${this.handleFileSelect}
      />

      ${this.selectedFile
        ? html`
            <div class="selected-file">
              <svg class="selected-file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="selected-file-info">
                <div class="selected-file-name">${this.selectedFile.name}</div>
                <div class="selected-file-size">${this.formatFileSize(this.selectedFile.size)}</div>
              </div>
              <button class="remove-file" @click=${this.removeFile} ?disabled=${this.uploading}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          `
        : null}

      <button
        class="upload-btn"
        @click=${this.handleUpload}
        ?disabled=${!this.selectedFile || this.uploading}
      >
        ${this.uploading
          ? html`<span class="upload-spinner"></span> ${t("uploadButtonUploading")}`
          : t("uploadButton")}
      </button>
    `;
  }

  private renderTextMode() {
    const charCount = this.resumeText.length;
    const isTooShort = charCount < ResumeUpload.MIN_TEXT_LENGTH;
    const isTooLong = charCount > ResumeUpload.MAX_TEXT_LENGTH;
    const isValid = !isTooShort && !isTooLong;

    return html`
      <div class="text-form">
        <input
          type="text"
          class="text-title-input"
          placeholder=${t("uploadTextTitlePlaceholder")}
          maxlength="100"
          .value=${this.textTitle}
          @input=${(e: Event) => {
            this.textTitle = (e.target as HTMLInputElement).value;
          }}
        />
        <div class="text-hint">${t("uploadTextTitleHint")}</div>

        <textarea
          class="text-content-textarea"
          placeholder=${t("uploadTextPlaceholder")}
          maxlength="${ResumeUpload.MAX_TEXT_LENGTH}"
          .value=${this.resumeText}
          @input=${(e: Event) => {
            this.resumeText = (e.target as HTMLTextAreaElement).value;
          }}
        ></textarea>
        <div class="text-hint">${t("uploadTextContentHint")}</div>
        <div class="char-count ${(isTooShort || isTooLong) && charCount > 0 ? "warning" : ""}">
          ${isTooShort && charCount > 0
            ? t("uploadTextMinChars", [String(charCount), String(ResumeUpload.MIN_TEXT_LENGTH)])
            : `${charCount.toLocaleString()} / ${ResumeUpload.MAX_TEXT_LENGTH.toLocaleString()}`}
        </div>
      </div>

      <button
        class="upload-btn"
        @click=${this.handleTextSubmit}
        ?disabled=${!isValid || this.uploading}
      >
        ${this.uploading
          ? html`<span class="upload-spinner"></span> ${t("uploadButtonUploading")}`
          : t("uploadSubmitButton")}
      </button>
    `;
  }

  render() {
    // Show uploadError if present, otherwise show previous error from parent
    const displayError = this.uploadError || this.error;

    return html`
      <div class="wrapper">
        <div class="title">${t("uploadTitle")}</div>
        <div class="subtitle">${t("uploadSubtitle")}</div>

        <div class="mode-tabs">
          <button
            class="mode-tab ${this.mode === "upload" ? "active" : ""}"
            @click=${() => this.setMode("upload")}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            ${t("uploadFileTab")}
          </button>
          <button
            class="mode-tab ${this.mode === "text" ? "active" : ""}"
            @click=${() => this.setMode("text")}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            ${t("uploadTextTab")}
          </button>
        </div>

        ${displayError
          ? html`<div class="error">${displayError}</div>`
          : null}

        <div class="form-container">
          ${this.mode === "upload" ? this.renderUploadMode() : this.renderTextMode()}
        </div>
      </div>
    `;
  }
}
