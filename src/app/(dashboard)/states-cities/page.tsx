"use client";

import { useEffect, useState } from "react";
import { statesApi, citiesApi } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";

interface StateForm {
  name: string;
  nameHindi: string;
  slug: string;
  code: string;
}

interface CityForm {
  name: string;
  nameHindi: string;
  slug: string;
}

const emptyStateForm: StateForm = { name: "", nameHindi: "", slug: "", code: "" };
const emptyCityForm: CityForm = { name: "", nameHindi: "", slug: "" };

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

export default function StatesCitiesPage() {
  const [states, setStates] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [selectedState, setSelectedState] = useState<any | null>(null);

  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [showStateModal, setShowStateModal] = useState(false);
  const [editingStateId, setEditingStateId] = useState<number | null>(null);
  const [stateForm, setStateForm] = useState<StateForm>(emptyStateForm);
  const [savingState, setSavingState] = useState(false);

  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCityId, setEditingCityId] = useState<number | null>(null);
  const [cityForm, setCityForm] = useState<CityForm>(emptyCityForm);
  const [savingCity, setSavingCity] = useState(false);

  const loadStates = () => {
    setLoadingStates(true);
    statesApi
      .list({ activeOnly: "false" })
      .then((r) => {
        setStates(r.data);
        setSelectedState((prev: any) => prev ?? r.data[0] ?? null);
      })
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setLoadingStates(false));
  };

  const loadCities = (stateId: number) => {
    setLoadingCities(true);
    citiesApi
      .list({ stateId, activeOnly: "false" })
      .then((r) => setCities(r.data))
      .catch(() => toast.error("Failed to load cities"))
      .finally(() => setLoadingCities(false));
  };

  useEffect(() => { loadStates(); }, []);
  useEffect(() => {
    if (selectedState) loadCities(selectedState.id);
    else setCities([]);
  }, [selectedState]);

  // ─── State CRUD ───────────────────────────────────────────────────────────

  const openCreateState = () => {
    setEditingStateId(null);
    setStateForm(emptyStateForm);
    setShowStateModal(true);
  };

  const openEditState = (s: any) => {
    setEditingStateId(s.id);
    setStateForm({ name: s.name, nameHindi: s.nameHindi || "", slug: s.slug, code: s.code || "" });
    setShowStateModal(true);
  };

  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateForm.name || !stateForm.slug) { toast.error("Name and slug are required"); return; }

    setSavingState(true);
    try {
      if (editingStateId) {
        await statesApi.update(editingStateId, stateForm);
        toast.success("State updated");
      } else {
        await statesApi.create(stateForm);
        toast.success("State created");
      }
      setShowStateModal(false);
      loadStates();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save state");
    } finally {
      setSavingState(false);
    }
  };

  const handleDeleteState = async (s: any) => {
    if (!confirm(`Delete state "${s.name}"? This also deletes its cities.`)) return;
    try {
      await statesApi.delete(s.id);
      toast.success("State deleted");
      if (selectedState?.id === s.id) setSelectedState(null);
      loadStates();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete state");
    }
  };

  // ─── City CRUD ────────────────────────────────────────────────────────────

  const openCreateCity = () => {
    setEditingCityId(null);
    setCityForm(emptyCityForm);
    setShowCityModal(true);
  };

  const openEditCity = (c: any) => {
    setEditingCityId(c.id);
    setCityForm({ name: c.name, nameHindi: c.nameHindi || "", slug: c.slug });
    setShowCityModal(true);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState) return;
    if (!cityForm.name || !cityForm.slug) { toast.error("Name and slug are required"); return; }

    setSavingCity(true);
    try {
      if (editingCityId) {
        await citiesApi.update(editingCityId, cityForm);
        toast.success("City updated");
      } else {
        await citiesApi.create({ ...cityForm, stateId: selectedState.id });
        toast.success("City created");
      }
      setShowCityModal(false);
      loadCities(selectedState.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save city");
    } finally {
      setSavingCity(false);
    }
  };

  const handleDeleteCity = async (c: any) => {
    if (!confirm(`Delete city "${c.name}"?`)) return;
    try {
      await citiesApi.delete(c.id);
      toast.success("City deleted");
      if (selectedState) loadCities(selectedState.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete city");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MapPin size={24} className="text-gray-400" />
        <h1 className="text-2xl font-bold">States & Cities</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* States panel */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">States ({states.length})</h2>
            <button onClick={openCreateState}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-h-[70vh] overflow-y-auto">
            {loadingStates ? (
              <div className="px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600 mx-auto" />
              </div>
            ) : states.length === 0 ? (
              <p className="px-4 py-12 text-center text-gray-400 text-sm">No states yet</p>
            ) : (
              states.map((s) => (
                <div key={s.id}
                  onClick={() => setSelectedState(s)}
                  className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer transition ${
                    selectedState?.id === s.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.nameHindi || s.slug}{!s.isActive && " · inactive"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEditState(s); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteState(s); }}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cities panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">
              Cities in {selectedState ? selectedState.name : "—"} ({cities.length})
            </h2>
            <button onClick={openCreateCity} disabled={!selectedState}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-40">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Hindi Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedState ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Select a state</td></tr>
                ) : loadingCities ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600 mx-auto" />
                  </td></tr>
                ) : cities.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No cities yet</td></tr>
                ) : (
                  cities.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.nameHindi || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEditCity(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteCity(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* State Modal */}
      {showStateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingStateId ? "Edit State" : "Add New State"}</h2>
              <button onClick={() => setShowStateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveState} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={stateForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setStateForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Uttar Pradesh" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hindi Name</label>
                <input value={stateForm.nameHindi} onChange={(e) => setStateForm({ ...stateForm, nameHindi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="उत्तर प्रदेश" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input value={stateForm.slug} onChange={(e) => setStateForm({ ...stateForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="uttar-pradesh" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input value={stateForm.code} onChange={(e) => setStateForm({ ...stateForm, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="UP" maxLength={10} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowStateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingState}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingState ? "Saving..." : editingStateId ? "Update State" : "Create State"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingCityId ? "Edit City" : "Add New City"}</h2>
              <button onClick={() => setShowCityModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={cityForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCityForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Lucknow" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hindi Name</label>
                <input value={cityForm.nameHindi} onChange={(e) => setCityForm({ ...cityForm, nameHindi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="लखनऊ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input value={cityForm.slug} onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="lucknow-up" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCityModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingCity}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingCity ? "Saving..." : editingCityId ? "Update City" : "Create City"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
