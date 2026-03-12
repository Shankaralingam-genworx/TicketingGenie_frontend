import React, { useState } from "react";
import { Issue, IssueFilter } from "../types";
import { ApiClient } from "../hooks/useApi";
import {IssueCategory } from "../constants";
import {
  Spinner,
  ActivePill,
  ConfirmDlg,
  Modal,
  Field,
  Input,
  Select,
  Textarea,
  Tabs,
} from "../components/Shared";
import {
  IssueIcon,
  PlusIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
} from "../components/Icons";

/* ── Issue form ─────────────────────────────────────────────────────────── */
const IssueForm: React.FC<{
  initial?: Partial<Issue>;
  onSave: (d: Omit<Issue, "id" | "created_at">) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ initial, onSave, onClose, saving }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [cat, setCat] = useState(
  initial?.category ?? Object.values(IssueCategory)[0]
);
  const [active, setActive] = useState(initial?.is_active ?? true);

  const valid = name.trim().length > 0;

  return (
    <div className="adm-form">
      <Field label="Issue name" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Login Problem"
          autoFocus
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Brief description of what this issue type covers…"
          rows={3}
        />
      </Field>
      <Field label="Category" required>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          {Object.values(IssueCategory).map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </Field>
      <label className="adm-check-row">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active (visible to agents and customers)
      </label>
      <div className="adm-form-actions">
        <button
          className="btn btn--outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!valid || saving}
          onClick={() =>
            onSave({
              name: name.trim(),
              description: desc.trim(),
              category: cat,
              is_active: active,
            })
          }
        >
          {saving ? (
            <>
              <Spinner size={14} color="white" /> Saving…
            </>
          ) : initial?.id ? (
            "Save changes"
          ) : (
            "Create issue"
          )}
        </button>
      </div>
    </div>
  );
};

/* ── IssuesSection ──────────────────────────────────────────────────────── */
interface Props {
  issues: Issue[];
  loading: boolean;
  onRefresh: () => void;
  api: ApiClient;
  onToast: (msg: string, ok?: boolean) => void;
}

const IssuesSection: React.FC<Props> = ({
  issues,
  loading,
  onRefresh,
  api,
  onToast,
}) => {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [target, setTarget] = useState<Issue | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Issue | null>(null);

  const openCreate = () => {
    setTarget(null);
    setModal("create");
  };
  const openEdit = (i: Issue) => {
    setTarget(i);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setTarget(null);
  };

  const handleSave = async (data: Omit<Issue, "id" | "created_at">) => {
    setSaving(true);
    try {
      if (modal === "edit" && target) {
        await api.put(`/issues/${target.id}`, data);
        onToast("Issue updated");
      } else {
        await api.post("/issues/", data);
        onToast("Issue created");
      }
      closeModal();
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (issue: Issue) => {
    try {
      await api.del(`/issues/${issue.id}`);
      onToast("Issue deleted");
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    }
    setConfirm(null);
  };

  const list = issues.filter((i) =>
    filter === "all" ? true : filter === "active" ? i.is_active : !i.is_active,
  );

  return (
    <>
      <div className="adm-section-hdr">
        <div>
          <h1 className="dash-page-title">Issues</h1>
          <p className="dash-page-sub">
            Define support issue types and categories.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button
  className="btn btn--outline btn--sm"
  onClick={onRefresh}
  disabled={loading}
  style={{ display: "flex", alignItems: "center", gap: "6px" }}
>
  <RefreshIcon style={{ width: "24px", height: "24px" }} />
  Refresh
</button>
          <button className="btn btn--primary" onClick={openCreate}>
            <PlusIcon /> New issue
          </button>
        </div>
      </div>

      <Tabs<IssueFilter>
        tabs={[
          { id: "all", label: `All (${issues.length})` },
          {
            id: "active",
            label: `Active (${issues.filter((i) => i.is_active).length})`,
          },
          {
            id: "inactive",
            label: `Inactive (${issues.filter((i) => !i.is_active).length})`,
          },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Issue types</h3>
            <p>
              {list.length} result{list.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">
            <Spinner size={22} />
            <span>Loading…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="adm-empty">
            <IssueIcon />
            <p>No issue types found</p>
            <span>Create your first issue type to get started.</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <span className="adm-id">#{issue.id}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{issue.name}</td>
                  <td>
                    <span className="adm-cat-chip">
                      {issue.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="adm-truncate" style={{ maxWidth: 220 }}>
                    {issue.description || "—"}
                  </td>
                  <td>
                    <ActivePill on={issue.is_active} />
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => openEdit(issue)}
                      >
                        <EditIcon /> Edit
                      </button>
                      <button
                        className="btn btn--outline btn--sm adm-btn-del"
                        onClick={() => setConfirm(issue)}
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

      {modal && (
        <Modal
          title={
            modal === "create" ? "New issue type" : `Edit — ${target?.name}`
          }
          sub={
            modal === "create"
              ? "Define a new support issue category"
              : "Update name, description or category"
          }
          onClose={closeModal}
        >
          <IssueForm
            initial={target ?? undefined}
            onSave={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDlg
          msg={`Delete "${confirm.name}"? Existing resolver mappings for this issue will also be removed.`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default IssuesSection;
