import React, { useState } from "react";
import { SLA, SLAView } from "../types";
import { ApiClient } from "../hooks/useApi";
import { SEVERITIES, CUSTOMER_TIERS } from "../constants";
import { minsToHuman } from "../utils/time";
import {
  Spinner,
  SevBadge,
  TierBadge,
  ActivePill,
  ConfirmDlg,
  Modal,
  Field,
  Input,
  Select,
  Tabs,
} from "../components/Shared";
import {
  SLAIcon,
  PlusIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
} from "../components/Icons";

/* ── SLA form ────────────────────────────────────────────────────────────── */
const SLAForm: React.FC<{
  initial?: Partial<SLA>;
  onSave: (d: Omit<SLA, "id">) => void;
  onClose: () => void;
  saving: boolean;
}> = ({ initial, onSave, onClose, saving }) => {
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [sev, setSev] = useState<(typeof SEVERITIES)[number]>(
    initial?.severity ?? "medium",
  );
  const [tier, setTier] = useState<(typeof CUSTOMER_TIERS)[number]>(
    initial?.customer_tier ?? "smb",
  );
  const [resp, setResp] = useState(String(initial?.response_time_mins ?? 60));
  const [reso, setReso] = useState(
    String(initial?.resolution_time_mins ?? 480),
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const respN = parseInt(resp, 10);
  const resoN = parseInt(reso, 10);
  const valid =
    name.trim() !== "" &&
    !isNaN(respN) &&
    respN > 0 &&
    !isNaN(resoN) &&
    resoN > 0 &&
    resoN >= respN;

  return (
    <div className="adm-form">
      <div className="adm-form-row">
        <Field label="Name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Critical Premium SLA"
          />
        </Field>
      </div>

      <div className="adm-form-row">
        <Field label="Severity" required>
          {isEdit ? (
            <div className="adm-input adm-input-readonly">
              <SevBadge sev={sev} />
            </div>
          ) : (
            <Select
              value={sev}
              onChange={(e) =>
                setSev(e.target.value as (typeof SEVERITIES)[number])
              }
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Customer tier" required>
          {isEdit ? (
            <div className="adm-input adm-input-readonly">
              <TierBadge tier={tier} />
            </div>
          ) : (
            <Select
              value={tier}
              onChange={(e) =>
                setTier(e.target.value as (typeof CUSTOMER_TIERS)[number])
              }
            >
              {CUSTOMER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="adm-form-row">
        <Field label="Response time (mins)" required>
          <Input
            type="number"
            min={1}
            value={resp}
            onChange={(e) => setResp(e.target.value)}
          />
          {!isNaN(respN) && respN > 0 && (
            <span className="adm-hint">{minsToHuman(respN)}</span>
          )}
        </Field>
        <Field label="Resolution time (mins)" required>
          <Input
            type="number"
            min={1}
            value={reso}
            onChange={(e) => setReso(e.target.value)}
          />
          {!isNaN(resoN) && resoN > 0 && (
            <span className="adm-hint">{minsToHuman(resoN)}</span>
          )}
          {!isNaN(resoN) && !isNaN(respN) && resoN < respN && (
            <span className="adm-hint adm-hint--err">
              Must be ≥ response time
            </span>
          )}
        </Field>
      </div>

      <label className="adm-check-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active policy
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
              severity: sev,
              customer_tier: tier,
              response_time_mins: respN,
              resolution_time_mins: resoN,
              is_active: isActive,
            })
          }
        >
          {saving ? (
            <>
              <Spinner size={14} color="white" /> Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Create SLA"
          )}
        </button>
      </div>
    </div>
  );
};

/* ── SLASection ──────────────────────────────────────────────────────────── */
interface Props {
  slas: SLA[];
  loading: boolean;
  onRefresh: () => void;
  api: ApiClient;
  onToast: (msg: string, ok?: boolean) => void;
}

const SLASection: React.FC<Props> = ({
  slas,
  loading,
  onRefresh,
  api,
  onToast,
}) => {
  const [view, setView] = useState<SLAView>("list");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [target, setTarget] = useState<SLA | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<SLA | null>(null);

  const openCreate = (prefill?: Partial<SLA>) => {
    setTarget(prefill ? ({ ...prefill } as SLA) : null);
    setModal("create");
  };
  const openEdit = (s: SLA) => {
    setTarget(s);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setTarget(null);
  };

  const handleSave = async (data: Omit<SLA, "id">) => {
    setSaving(true);
    try {
      if (modal === "edit" && target) {
        await api.put(`/sla/${target.id}`, data);
        onToast("SLA updated");
      } else {
        await api.post("/sla/", data);
        onToast("SLA created");
      }
      closeModal();
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: SLA) => {
    try {
      await api.del(`/sla/${s.id}`);
      onToast("SLA deleted");
      onRefresh();
    } catch (e: any) {
      onToast(e.message, false);
    }
    setConfirm(null);
  };

  // Build severity × tier matrix
  const matrix: Record<string, Record<string, SLA | null>> = {};
  SEVERITIES.forEach((sev) => {
    matrix[sev] = {};
    CUSTOMER_TIERS.forEach((t) => {
      matrix[sev][t] = null;
    });
  });
  slas.forEach((s) => {
    if (matrix[s.severity]) matrix[s.severity][s.customer_tier] = s;
  });

  return (
    <>
      <div className="adm-section-hdr">
        <div>
          <h1 className="dash-page-title">SLA Configuration</h1>
          <p className="dash-page-sub">
            Response and resolution time targets per severity and customer tier.
          </p>
        </div>
        <div className="adm-hdr-actions">
          <button
            className="btn btn--outline btn--sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshIcon /> Refresh
          </button>
          <button className="btn btn--primary" onClick={() => openCreate()}>
            <PlusIcon /> New SLA
          </button>
        </div>
      </div>

      <Tabs<SLAView>
        tabs={[
          { id: "list", label: "List view" },
          { id: "matrix", label: "Matrix view" },
        ]}
        value={view}
        onChange={setView}
      />

      {view === "matrix" ? (
        /* ── Matrix view ── */
        <div className="dash-table-wrap adm-matrix-wrap">
          <div className="dash-table-hdr">
            <div>
              <h3>SLA matrix</h3>
              <p>Severity × Customer tier — click a cell to edit or create</p>
            </div>
          </div>

          <div
            className="adm-matrix"
            style={{
              gridTemplateColumns: `160px repeat(${CUSTOMER_TIERS.length}, 1fr)`,
            }}
          >
            <div className="adm-matrix-cell adm-matrix-corner" />

            {CUSTOMER_TIERS.map((tier) => (
              <div
                key={`head-${tier}`}
                className="adm-matrix-cell adm-matrix-head"
              >
                <TierBadge tier={tier} />
              </div>
            ))}

            {SEVERITIES.map((sev) => (
              <React.Fragment key={`row-${sev}`}>
                <div className="adm-matrix-cell adm-matrix-row-head">
                  <SevBadge sev={sev} />
                </div>

                {CUSTOMER_TIERS.map((tier) => {
                  const cell = matrix?.[sev]?.[tier];

                  if (cell) {
                    return (
                      <div
                        key={`${sev}-${tier}`}
                        className={`adm-matrix-cell adm-matrix-data adm-matrix-data--filled ${
                          cell.is_active ? "" : "adm-matrix-data--off"
                        }`}
                        onClick={() => openEdit(cell)}
                        title={cell.name}
                      >
                        <div className="adm-matrix-name">{cell.name}</div>

                        <div
                          className="adm-matrix-times"
                          style={{ marginTop: 6 }}
                        >
                          <div style={{ marginBottom: 6 }}>
                            <span className="adm-matrix-resp">
                              {minsToHuman(cell.response_time_mins)}
                            </span>
                            <span
                              className="adm-matrix-label"
                              style={{ marginLeft: 4 }}
                            >
                              response
                            </span>
                          </div>

                          <div>
                            <span className="adm-matrix-reso">
                              {minsToHuman(cell.resolution_time_mins)}
                            </span>
                            <span
                              className="adm-matrix-label"
                              style={{ marginLeft: 4 }}
                            >
                              resolution
                            </span>
                          </div>
                        </div>

                        {!cell.is_active && (
                          <span className="adm-matrix-inactive">inactive</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${sev}-${tier}`}
                      className="adm-matrix-cell adm-matrix-data adm-matrix-data--empty"
                      onClick={() =>
                        openCreate({
                          name: `${sev} ${tier} SLA`,
                          severity: sev,
                          customer_tier: tier,
                        })
                      }
                    >
                      <PlusIcon />
                      <span>Add</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        /* ── List view ── */
        <div className="dash-table-wrap">
          <div className="dash-table-hdr">
            <div>
              <h3>SLA policies</h3>
              <p>{slas.length} configured</p>
            </div>
          </div>

          {loading ? (
            <div className="adm-loading">
              <Spinner size={22} />
              <span>Loading…</span>
            </div>
          ) : slas.length === 0 ? (
            <div className="adm-empty">
              <SLAIcon />
              <p>No SLA policies yet</p>
              <span>Create your first policy to enable SLA enforcement.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Severity</th>
                  <th>Tier</th>
                  <th>Response</th>
                  <th>Resolution</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slas.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="adm-id">#{s.id}</span>
                    </td>

                    <td>
                      <span className="adm-name" style={{ fontWeight: 500 }}>
                        {s.name}
                      </span>
                    </td>

                    <td>
                      <SevBadge sev={s.severity} />
                    </td>

                    <td>
                      <TierBadge tier={s.customer_tier} />
                    </td>

                    <td>
                      <span
                        style={{ fontWeight: 700, color: "var(--blue-600)" }}
                      >
                        {minsToHuman(s.response_time_mins)}
                      </span>
                      <span className="adm-mins">
                        {" "}
                        ({s.response_time_mins}m)
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {minsToHuman(s.resolution_time_mins)}
                      </span>
                      <span className="adm-mins">
                        {" "}
                        ({s.resolution_time_mins}m)
                      </span>
                    </td>

                    <td>
                      <ActivePill on={s.is_active} />
                    </td>

                    <td>
                      <div className="adm-row-actions">
                        <button
                          className="btn btn--outline btn--sm"
                          onClick={() => openEdit(s)}
                        >
                          <EditIcon /> Edit
                        </button>

                        <button
                          className="btn btn--outline btn--sm adm-btn-del"
                          onClick={() => setConfirm(s)}
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
      )}

      {modal && (
        <Modal
          title={
            modal === "create"
              ? "New SLA policy"
              : `Edit SLA — ${target?.name || `${target?.severity} / ${target?.customer_tier}`}`
          }
          sub="Set response and resolution time targets"
          onClose={closeModal}
        >
          <SLAForm
            initial={target ?? undefined}
            onSave={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDlg
          msg={`Delete "${confirm.name}"? Tickets matching this profile will lose SLA enforcement.`}
          onOk={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default SLASection;
