/**
 * EmailConfigSection.tsx
 * Admin — manage inbound/outbound email configuration.
 * Routes: POST /admin/email-config/, GET /admin/email-config/,
 *         GET /admin/email-config/active, PATCH /admin/email-config/:id,
 *         DELETE /admin/email-config/:id
 */

import React, { useCallback, useEffect, useState } from "react";
import { ApiClient } from "../hooks/useApi";
import {
  Spinner,
  ActivePill,
  ConfirmDlg,
  Modal,
  Field,
  Input,
} from "../components/Shared";
import {
  PlusIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
} from "../components/Icons";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface EmailConfig {
  id: number;
  name: string;
  smtp_from_name: string;
  imap_folder: string;
  poll_interval_secs: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailConfigFormData {
  name: string;
  password: string;
  smtp_from_name: string;
  imap_folder: string;
  poll_interval_secs: number | string;
  is_active?: boolean;
}

/* ── EmailConfigForm ─────────────────────────────────────────────────────── */
const EmailConfigForm: React.FC<{
  initial?: EmailConfig;
  onSave: (d: EmailConfigFormData) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ initial, onSave, onClose, saving }) => {
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [smtpFromName, setSmtpFromName] = useState(
    initial?.smtp_from_name ?? "Support Team"
  );
  const [imapFolder, setImapFolder] = useState(
    initial?.imap_folder ?? "INBOX"
  );
  const [pollInterval, setPollInterval] = useState(
    String(initial?.poll_interval_secs ?? 60)
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [showPass, setShowPass] = useState(false);

  const pollN = parseInt(pollInterval, 10);
  const valid =
    name.trim().length >= 2 &&
    (!isEdit ? password.trim().length > 0 : true) &&
    smtpFromName.trim().length > 0 &&
    imapFolder.trim().length > 0 &&
    !isNaN(pollN) &&
    pollN >= 10 &&
    pollN <= 3600;

  const handleSubmit = () => {
    const payload: EmailConfigFormData = {
      name: name.trim(),
      password: password,
      smtp_from_name: smtpFromName.trim(),
      imap_folder: imapFolder.trim(),
      poll_interval_secs: pollN,
    };
    if (isEdit) {
      payload.is_active = isActive;
      if (!password) delete (payload as any).password;
    }
    onSave(payload);
  };

  return (
    <div className="adm-form">
      {/* Info banner */}
      <div className="email-cfg-info-banner">
        <span className="email-cfg-info-icon">ℹ</span>
        <span>
          This config controls both <strong>SMTP (outbound)</strong> and{" "}
          <strong>IMAP (inbound)</strong> email for the support inbox. Only one
          config can be active at a time.
        </span>
      </div>

      <div className="adm-form-row">
        <Field label="Config name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Primary Support Inbox"
          />
        </Field>
        <Field
          label={isEdit ? "App password (leave blank to keep)" : "App password"}
          required={!isEdit}
        >
          <div style={{ position: "relative" }}>
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "••••••••" : "Gmail / Outlook app password"}
              style={{ paddingRight: 68 }}
            />
            <button
              type="button"
              className="email-cfg-pass-toggle"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
      </div>

      <div className="adm-form-row">
        <Field label="SMTP from name" required>
          <Input
            type="text"
            value={smtpFromName}
            onChange={(e) => setSmtpFromName(e.target.value)}
            placeholder="Support Team"
          />
          <span className="adm-hint">Displayed as sender name in emails</span>
        </Field>
        <Field label="IMAP folder" required>
          <Input
            type="text"
            value={imapFolder}
            onChange={(e) => setImapFolder(e.target.value)}
            placeholder="INBOX"
          />
          <span className="adm-hint">Folder polled for incoming tickets</span>
        </Field>
      </div>

      <div className="adm-form-row">
        <Field label="Poll interval (seconds)" required>
          <Input
            type="number"
            min={10}
            max={3600}
            value={pollInterval}
            onChange={(e) => setPollInterval(e.target.value)}
          />
          <span className="adm-hint">
            Min 10s · Max 3600s (1 hr)
            {!isNaN(pollN) && pollN >= 10 && (
              <> · every {pollN >= 60 ? `${Math.round(pollN / 60)} min` : `${pollN}s`}</>
            )}
          </span>
          {!isNaN(pollN) && (pollN < 10 || pollN > 3600) && (
            <span className="adm-hint adm-hint--err">Must be 10–3600</span>
          )}
        </Field>
        {isEdit && (
          <Field label="Status">
            <label className="adm-check-row" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active (deactivates other configs when enabled)
            </label>
          </Field>
        )}
      </div>

      <div className="adm-form-actions">
        <button className="btn btn--outline" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!valid || saving}
          onClick={handleSubmit}
        >
          {saving ? (
            <><Spinner size={14} color="white" /> Saving…</>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add email config"
          )}
        </button>
      </div>
    </div>
  );
};

/* ── EmailConfigSection ──────────────────────────────────────────────────── */
interface Props {
  api: ApiClient;
  onToast: (msg: string, ok?: boolean) => void;
}

const EmailConfigSection: React.FC<Props> = ({ api, onToast }) => {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [target, setTarget] = useState<EmailConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<EmailConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConfigs(await api.get<EmailConfig[]>("/admin/email-config/", "ticket"));
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setLoading(false);
    }
  }, [api, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setTarget(null);
    setModal("create");
  };
  const openEdit = (c: EmailConfig) => {
    setTarget(c);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setTarget(null);
  };

  const handleSave = async (data: EmailConfigFormData) => {
    setSaving(true);
    try {
      if (modal === "edit" && target) {
        await api.put(`/admin/email-config/${target.id}`, data, "auth");
        onToast("Email config updated");
      } else {
        await api.post("/admin/email-config/", data, "auth");
        onToast("Email config created");
      }
      closeModal();
      load();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: EmailConfig) => {
    try {
      await api.delete(`/admin/email-config/${c.id}`, "auth");
      onToast("Email config deleted");
      load();
    } catch (e: any) {
      onToast(e.message, false);
    }
    setConfirm(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatInterval = (secs: number) =>
    secs >= 3600
      ? `${secs / 3600}h`
      : secs >= 60
      ? `${Math.round(secs / 60)}m`
      : `${secs}s`;

  const activeConfig = configs.find((c) => c.is_active);

  return (
    <>
      {/* Header */}
      <div className="dash-page-hdr">
        <div>
          <h1 className="dash-page-title">Email Configuration</h1>
          <p className="dash-page-sub">
            Manage SMTP (outbound) and IMAP (inbound) email settings for the
            support inbox.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button
            className="btn btn--outline btn--sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshIcon style={{ width: "24px", height: "24px" }} /> Refresh
          </button>
          <button className="btn btn--primary btn--sm" onClick={openCreate}>
            <PlusIcon /> Add Config
          </button>
        </div>
      </div>

      {/* Active config banner */}
      {activeConfig && (
        <div className="email-cfg-active-banner">
          <div className="email-cfg-active-dot" />
          <div>
            <strong>{activeConfig.name}</strong> is the active config ·{" "}
            <span>From: {activeConfig.smtp_from_name}</span> ·{" "}
            <span>Polling: {formatInterval(activeConfig.poll_interval_secs)}</span> ·{" "}
            <span>Folder: {activeConfig.imap_folder}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Email configs</h3>
            <p>{configs.length} configured · 1 active max</p>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">
            <Spinner size={22} />
            <span>Loading…</span>
          </div>
        ) : configs.length === 0 ? (
          <div className="adm-empty">
            <span style={{ fontSize: "2rem" }}>📭</span>
            <p>No email configs yet</p>
            <span>
              Add a Gmail or Outlook app-password config to enable email
              ticketing.
            </span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Config</th>
                <th>From name</th>
                <th>IMAP folder</th>
                <th>Poll interval</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id} className={c.is_active ? "email-cfg-active-row" : ""}>
                  <td>
                    <div className="email-cfg-name-cell">
                      <span className="email-cfg-dot" data-active={c.is_active} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--slate-400)" }}>
                          #{c.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: "0.83rem" }}>{c.smtp_from_name}</td>
                  <td>
                    <span className="email-cfg-folder-chip">{c.imap_folder}</span>
                  </td>
                  <td>
                    <span className="email-cfg-interval">
                      {formatInterval(c.poll_interval_secs)}
                    </span>
                  </td>
                  <td>
                    <ActivePill on={c.is_active} />
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--slate-400)" }}>
                    {formatDate(c.updated_at)}
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => openEdit(c)}
                      >
                        <EditIcon /> Edit
                      </button>
                      <button
                        className="btn btn--outline btn--sm adm-btn-del"
                        onClick={() => setConfirm(c)}
                        disabled={c.is_active}
                        title={
                          c.is_active
                            ? "Deactivate before deleting"
                            : "Delete config"
                        }
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "create" ? "Add email config" : `Edit — ${target?.name}`}
          sub={
            modal === "create"
              ? "Configure SMTP + IMAP credentials for the support inbox"
              : "Update email config details"
          }
          onClose={closeModal}
        >
          <EmailConfigForm
            initial={target ?? undefined}
            onSave={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {confirm && (
        <ConfirmDlg
          msg={`Delete "${confirm.name}"? This cannot be undone.`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default EmailConfigSection;