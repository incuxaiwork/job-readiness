import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import {
  Building2, Plus, KeyRound, Copy, Users, RefreshCw, Ban, CheckCircle2, Mail, Trash2,
} from 'lucide-react';

const emptyForm = { name: '', code: '', domain: '', city: '', state: '', contact_name: '', contact_email: '', contact_phone: '' };

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-medium text-slate-900 text-sm';

const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);

const asArray = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res?.payload?.data) ? res.payload.data : []);

export const AdminCollegesPage = () => {
  const { addToast } = useApp();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [manageCollege, setManageCollege] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
  const [tempCred, setTempCred] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.admin.colleges.list();
      if (!res.ok) throw new Error(res.error || 'Failed to load colleges');
      setColleges(asArray(res));
    } catch (e) {
      setColleges([]);
      addToast?.(e.message || 'Failed to load colleges', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { addToast?.('College name is required', 'warning'); return; }
    setSaving(true);
    try {
      await api.admin.colleges.create({ ...form, code: form.code || slug(form.name) });
      addToast?.('College created', 'success');
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      addToast?.(e.message || 'Could not create college', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (college) => {
    if (!window.confirm(`Delete "${college.name}" and its admin logins? Students will be unlinked. This cannot be undone.`)) return;
    try {
      const res = await api.admin.colleges.remove(college.id);
      if (!res.ok) throw new Error(res.error || 'Failed to delete college');
      addToast?.('College deleted', 'success');
      if (manageCollege?.id === college.id) setManageCollege(null);
      await load();
    } catch (e) {
      addToast?.(e.message || 'Could not delete college', 'error');
    }
  };

  const reloadAdmins = async (collegeId) => {
    try {
      const res = await api.admin.colleges.admins(collegeId);
      setAdmins(asArray(res));
    } catch { /* ignore */ }
  };

  const openManage = async (college) => {
    setManageCollege(college);
    setTempCred(null);
    setNewAdmin({ name: '', email: '' });
    setAdmins([]);
    await reloadAdmins(college.id);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) { addToast?.('Name and email are required', 'warning'); return; }
    try {
      const res = await api.admin.colleges.createAdmin(manageCollege.id, newAdmin);
      setTempCred({ email: res.data?.email, password: res.temporaryPassword });
      setNewAdmin({ name: '', email: '' });
      await reloadAdmins(manageCollege.id);
      await load();
    } catch (e) {
      addToast?.(e.message || 'Could not create credential', 'error');
    }
  };

  const toggleAdminStatus = async (adm) => {
    const status = adm.status === 'active' ? 'suspended' : 'active';
    try {
      await api.admin.colleges.updateAdmin(manageCollege.id, adm.id, { status });
      await reloadAdmins(manageCollege.id);
      addToast?.(`Admin ${status === 'active' ? 'activated' : 'suspended'}`, 'success');
    } catch (e) {
      addToast?.(e.message || 'Update failed', 'error');
    }
  };

  const resetAdminPassword = async (adm) => {
    const password = 'C@' + Math.random().toString(16).slice(2, 12);
    try {
      await api.admin.colleges.updateAdmin(manageCollege.id, adm.id, { password });
      setTempCred({ email: adm.email, password });
    } catch (e) {
      addToast?.(e.message || 'Reset failed', 'error');
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    addToast?.('Copied to clipboard', 'success');
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" /> Colleges
          </h1>
          <p className="text-xs text-slate-500 mt-1">Onboard colleges and issue credentials for their admins.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Onboard College
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading colleges…</div>
        ) : colleges.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No colleges yet. Click "Onboard College" to add one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">College</th>
                  <th className="text-left px-4 py-3 font-bold">Code</th>
                  <th className="text-left px-4 py-3 font-bold">Location</th>
                  <th className="text-right px-4 py-3 font-bold">Students</th>
                  <th className="text-right px-4 py-3 font-bold">Submissions</th>
                  <th className="text-right px-4 py-3 font-bold">Admins</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colleges.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3"><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{c.code}</code></td>
                    <td className="px-4 py-3 text-slate-600">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.student_count}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.submission_count}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.admin_count}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openManage(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Manage Admins
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        title="Delete college"
                        className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create college modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Onboard a College">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="College name *"><input className={inputCls} value={form.name} onChange={set('name')} placeholder="RV College of Engineering" /></Field>
            <Field label="College code"><input className={inputCls} value={form.code} onChange={set('code')} placeholder={slug(form.name) || 'rvce'} /></Field>
            <Field label="Email domain"><input className={inputCls} value={form.domain} onChange={set('domain')} placeholder="rvce.edu.in" /></Field>
            <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
            <Field label="State"><input className={inputCls} value={form.state} onChange={set('state')} /></Field>
            <Field label="Contact name"><input className={inputCls} value={form.contact_name} onChange={set('contact_name')} /></Field>
            <Field label="Contact email"><input className={inputCls} type="email" value={form.contact_email} onChange={set('contact_email')} /></Field>
            <Field label="Contact phone"><input className={inputCls} value={form.contact_phone} onChange={set('contact_phone')} /></Field>
          </div>
          <p className="text-[11px] text-slate-500">Students link to this college by entering the code at signup. Share the code with the college.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create College'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage admins modal */}
      <Modal isOpen={!!manageCollege} onClose={() => setManageCollege(null)} title={manageCollege ? `Admins — ${manageCollege.name}` : ''}>
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> College Admins</h3>
            {admins.length === 0 ? (
              <p className="text-sm text-slate-500">No admins yet. Create one below.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {admins.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {a.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${a.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{a.status}</span>
                      <button onClick={() => resetAdminPassword(a)} title="Reset password" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"><RefreshCw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleAdminStatus(a)} title={a.status === 'active' ? 'Suspend' : 'Activate'} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600">
                        {a.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {tempCred && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-bold text-amber-800 mb-1">One-time password (shown once)</p>
              <p className="text-xs text-amber-700 mb-2">Share securely with <b>{tempCred.email}</b>. Ask them to change it after first login.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono">{tempCred.password}</code>
                <button onClick={() => copy(tempCred.password)} className="p-2 rounded-lg bg-amber-600 text-white"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Issue New Credential</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Admin name" value={newAdmin.name} onChange={(e) => setNewAdmin((s) => ({ ...s, name: e.target.value }))} />
              <input className={inputCls} type="email" placeholder="admin@college.edu" value={newAdmin.email} onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold">
                <KeyRound className="w-4 h-4" /> Create Credential
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-bold text-slate-600 mb-1">{label}</span>
    {children}
  </label>
);
