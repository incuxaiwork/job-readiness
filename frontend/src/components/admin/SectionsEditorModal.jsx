import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
} from '../common/Modal';
import { api } from '../../services/api';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Check,
  Search,
  AlertTriangle,
} from 'lucide-react';

const DEFAULT_SECTION = () => ({
  id: null,
  name: '',
  description: '',
  durationMinutes: 30,
  marksPerQuestion: 1,
  questionIds: [],
});

export const SectionsEditorModal = ({ isOpen, onClose, assessment, addToast }) => {
  const [sections, setSections] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [search, setSearch] = useState('');

  const assessmentId = assessment?.id;

  useEffect(() => {
    if (!isOpen || !assessmentId) return;
    let alive = true;
    setLoading(true);
    setActiveIdx(0);
    setSearch('');
    (async () => {
      try {
        const [secRes, qRes] = await Promise.all([
          api.assessments.getSections(assessmentId),
          api.assessments.getQuestions(assessmentId),
        ]);
        if (!alive) return;

        const rawSections = secRes.ok ? (secRes.data?.data || []) : [];
        const rawQuestions = qRes.ok ? (qRes.data?.data || []) : [];

        const normalizedPool = rawQuestions.map((q) => ({
          id: q.id,
          question_id: q.question_id,
          text: q.question || q.title || 'Untitled question',
          category: q.category,
          topic: q.topic,
          type: q.type || 'Single Choice',
          section_id: q.section_id || null,
        }));
        setPool(normalizedPool);

        if (rawSections.length > 0) {
          setSections(rawSections.map((s) => ({
            id: s.id,
            name: s.name || '',
            description: s.description || '',
            durationMinutes: Number(s.durationMinutes) || 30,
            marksPerQuestion: Number(s.marksPerQuestion) || 1,
            questionIds: (s.questionIds || []).map(String),
          })));
        } else {
          // No sections defined yet — seed with one section holding every question
          setSections([{
            ...DEFAULT_SECTION(),
            name: 'Section 1',
            questionIds: normalizedPool.map((q) => String(q.id)),
          }]);
        }
      } catch {
        if (alive) addToast?.('Could not load assessment sections.', 'error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isOpen, assessmentId]);

  const assignedCount = useMemo(
    () => sections.reduce((sum, s) => sum + s.questionIds.length, 0),
    [sections]
  );

  const sectionOfQuestion = useMemo(() => {
    const map = {};
    sections.forEach((s, idx) => s.questionIds.forEach((qid) => { map[qid] = idx; }));
    return map;
  }, [sections]);

  const filteredPool = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pool;
    return pool.filter((q) =>
      `${q.text} ${q.category} ${q.topic}`.toLowerCase().includes(term)
    );
  }, [pool, search]);

  const updateSection = (idx, patch) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { ...DEFAULT_SECTION(), name: `Section ${prev.length + 1}` }]);
    setActiveIdx(sections.length);
  };

  const removeSection = (idx) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((cur) => Math.max(0, cur >= idx ? cur - 1 : cur));
  };

  const moveSection = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
    setActiveIdx(target);
  };

  // Exclusive assignment: a question lives in exactly one section
  const toggleQuestion = (sectionIdx, qid) => {
    const key = String(qid);
    setSections((prev) => {
      const cleared = prev.map((s, i) => (
        i === sectionIdx ? s : { ...s, questionIds: s.questionIds.filter((x) => x !== key) }
      ));
      const target = cleared[sectionIdx];
      const has = target.questionIds.includes(key);
      cleared[sectionIdx] = {
        ...target,
        questionIds: has
          ? target.questionIds.filter((x) => x !== key)
          : [...target.questionIds, key],
      };
      return cleared;
    });
  };

  const selectAllInSection = () => {
    updateSection(activeIdx, { questionIds: filteredPool.map((q) => String(q.id)) });
  };

  const clearSection = () => updateSection(activeIdx, { questionIds: [] });

  const handleSave = async () => {
    if (sections.length === 0) {
      addToast?.('Add at least one section before saving.', 'error');
      return;
    }
    for (let i = 0; i < sections.length; i++) {
      if (!sections[i].name.trim()) {
        addToast?.(`Section ${i + 1} needs a name.`, 'error');
        setActiveIdx(i);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await api.assessments.replaceSections(assessmentId, {
        sections: sections.map((s, i) => ({
          id: s.id || undefined,
          name: s.name.trim(),
          description: s.description?.trim() || null,
          durationMinutes: Math.max(1, Number(s.durationMinutes) || 30),
          marksPerQuestion: Math.max(1, Number(s.marksPerQuestion) || 1),
          displayOrder: i + 1,
          questionIds: s.questionIds,
        })),
      });
      if (!res.ok) {
        addToast?.(res.error || 'Failed to save sections.', 'error');
        return;
      }
      addToast?.(`Saved ${sections.length} section${sections.length === 1 ? '' : 's'}.`, 'success');
      onClose();
    } catch {
      addToast?.('Failed to save sections. Please retry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const active = sections[activeIdx];
  const unassigned = pool.length - assignedCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title="Manage Assessment Sections"
      subtitle={assessment?.title ? `${assessment.title} — define ordered, timed sections` : 'Define ordered, timed sections'}
      maxWidth="max-w-5xl"
    >
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading sections and questions…</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Overview strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-700">
              {sections.length} Section{sections.length === 1 ? '' : 's'}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-700">
              {assignedCount} / {pool.length} Questions Assigned
            </span>
            {unassigned > 0 && (
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {unassigned} unassigned (won't be in any section)
              </span>
            )}
            <button
              type="button"
              onClick={addSection}
              className="ml-auto px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No sections yet. Click “Add Section” to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Section list */}
              <div className="lg:col-span-4 space-y-2">
                {sections.map((s, idx) => (
                  <button
                    key={s.id || `new-${idx}`}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${idx === activeIdx
                      ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate flex-1">
                        {s.name || `Section ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">
                        {s.questionIds.length} Qs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 pl-8 text-[10px] font-semibold text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{s.durationMinutes} min</span>
                      <span>•</span>
                      <span>{s.marksPerQuestion} mk/Q</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Section editor */}
              <div className="lg:col-span-8">
                {active && (
                  <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/40">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        Editing Section {activeIdx + 1}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveSection(activeIdx, -1)}
                          disabled={activeIdx === 0}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(activeIdx, 1)}
                          disabled={activeIdx === sections.length - 1}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(activeIdx)}
                          disabled={sections.length === 1}
                          className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Section Name</label>
                        <input
                          value={active.name}
                          onChange={(e) => updateSection(activeIdx, { name: e.target.value })}
                          placeholder="e.g. Aptitude"
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Description (optional)</label>
                        <input
                          value={active.description}
                          onChange={(e) => updateSection(activeIdx, { description: e.target.value })}
                          placeholder="Short instruction shown to candidates"
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Duration (min)</label>
                        <input
                          type="number"
                          min="1"
                          value={active.durationMinutes}
                          onChange={(e) => updateSection(activeIdx, { durationMinutes: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Marks / Question</label>
                        <input
                          type="number"
                          min="1"
                          value={active.marksPerQuestion}
                          onChange={(e) => updateSection(activeIdx, { marksPerQuestion: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="w-full text-center px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600">
                          {active.questionIds.length} selected
                        </span>
                      </div>
                    </div>

                    {/* Question picker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search questions by text, category or topic…"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={selectAllInSection}
                          className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={clearSection}
                          className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                        {filteredPool.length === 0 && (
                          <p className="px-4 py-6 text-center text-xs text-slate-400">No matching questions.</p>
                        )}
                        {filteredPool.map((q) => {
                          const key = String(q.id);
                          const selected = active.questionIds.includes(key);
                          const owner = sectionOfQuestion[key];
                          const ownedElsewhere = owner !== undefined && owner !== activeIdx;
                          return (
                            <label
                              key={key}
                              className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleQuestion(activeIdx, key)}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-slate-800 truncate">
                                  {q.text}
                                </span>
                                <span className="block text-[10px] text-slate-400 truncate">
                                  {q.category}{q.topic ? ` • ${q.topic}` : ''} • {q.type}
                                  {ownedElsewhere && (
                                    <span className="ml-1 text-amber-600 font-bold">
                                      (currently in Section {owner + 1})
                                    </span>
                                  )}
                                </span>
                              </span>
                              {selected && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-brand-600/20"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Save Sections</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SectionsEditorModal;
