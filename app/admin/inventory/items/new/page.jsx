"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import { Combobox } from "@/components/ui/combobox";
import { FiArrowLeft, FiSave, FiPackage } from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const NewInventoryItemPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    sku: "",
    barcode: "",
    description: "",
    category_id: "",
    supplier_id: "",
    item_type: "medication",
    dosage_form: "",
    strength: "",
    manufacturer: "",
    current_stock: "",
    minimum_stock: "",
    maximum_stock: "",
    reorder_level: "",
    unit_of_measure: "units",
    cost_price: "",
    selling_price: "",
    requires_prescription: false,
    is_controlled_substance: false,
    storage_conditions: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!["admin", "pharmacist"].includes(user.role)) {
      toast.error("Access denied.");
      router.push("/");
      return;
    }

    fetchFormData();
  }, [user, authLoading, router]);

  const fetchFormData = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        fetch("/api/inventory/categories"),
        fetch("/api/inventory/suppliers"),
      ]);
      const [catData, supData] = await Promise.all([
        catRes.json(),
        supRes.json(),
      ]);

      if (catData.success) setCategories(catData.categories || []);
      if (supData.success) setSuppliers(supData.suppliers || []);
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error("Item name is required");
        setLoading(false);
        return;
      }

      if (!formData.item_type) {
        toast.error("Item type is required");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Item created successfully");
        router.push("/admin/inventory/items");
      } else {
        toast.error(data.error || "Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 ml-12 lg:ml-0">
          <Link
            href="/admin/inventory/items"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Add New Item</h1>
            <p className="text-slate-400 mt-1">
              Add a new item to your inventory
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Basic Information */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5 text-emerald-500" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Paracetamol 500mg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Generic Name
                </label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Acetaminophen"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., MED-PARA-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., 8901234567890"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Item Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="item_type"
                  value={formData.item_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="medication">Medication</option>
                  <option value="supply">Supply</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Category
                </label>
                <Combobox
                  options={categories
                    .filter((c) => c.type === formData.item_type)
                    .map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                  value={formData.category_id}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                  placeholder="Select Category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Supplier
                </label>
                <Combobox
                  options={suppliers.map((sup) => ({
                    value: sup.id,
                    label: sup.name,
                  }))}
                  value={formData.supplier_id}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, supplier_id: value }))
                  }
                  placeholder="Select Supplier"
                  searchPlaceholder="Search suppliers..."
                  emptyMessage="No suppliers found."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Medication Details (if type is medication) */}
          {formData.item_type === "medication" && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Medication Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Dosage Form
                  </label>
                  <select
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Form</option>
                    <option value="tablet">Tablet</option>
                    <option value="syrup">Syrup</option>
                    <option value="ointment">Ointment</option>
                    <option value="drops">Drops</option>
                    <option value="powder">Powder</option>
                    <option value="globules">Globules (Homeopathic)</option>
                    <option value="mother_tincture">Mother Tincture (Q)</option>
                    <option value="dilution">Dilution</option>
                    <option value="trituration">Trituration</option>
                    <option value="pills">Pills/Pillules</option>
                    <option value="lm_potency">LM Potency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., 500mg, 30C, Q"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Storage Conditions
                  </label>
                  <select
                    name="storage_conditions"
                    value={formData.storage_conditions}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Storage</option>
                    <option value="room_temperature">Room Temperature</option>
                    <option value="refrigerated">Refrigerated (2-8°C)</option>
                    <option value="frozen">Frozen (-20°C)</option>
                    <option value="cool_dry">Cool & Dry Place</option>
                    <option value="protect_light">Protect from Light</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={formData.requires_prescription}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-white">Requires Prescription</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_controlled_substance"
                    checked={formData.is_controlled_substance}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-white">Controlled Substance</span>
                </label>
              </div>
            </div>
          )}

          {/* Homeopathy Details (if dosage form is homeopathic) */}
          {formData.item_type === "medication" &&
            [
              "globules",
              "mother_tincture",
              "dilution",
              "trituration",
              "pills",
              "lm_potency",
            ].includes(formData.dosage_form) && (
              <div className="bg-slate-800/50 rounded-xl border border-emerald-700/50 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Homeopathy Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Potency
                    </label>
                    <input
                      type="text"
                      name="potency"
                      value={formData.potency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 6, 30, 200, 1M, 10M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Potency Scale
                    </label>
                    <select
                      name="potency_scale"
                      value={formData.potency_scale}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Scale</option>
                      <option value="X">X (Decimal - 1:10)</option>
                      <option value="C">C (Centesimal - 1:100)</option>
                      <option value="LM">LM (50 Millesimal)</option>
                      <option value="Q">Q (Mother Tincture)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Source Type
                    </label>
                    <select
                      name="source_type"
                      value={formData.source_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Source</option>
                      <option value="plant">Plant Kingdom</option>
                      <option value="animal">Animal Kingdom</option>
                      <option value="mineral">Mineral Kingdom</option>
                      <option value="nosode">Nosode</option>
                      <option value="sarcode">Sarcode</option>
                      <option value="imponderabilia">Imponderabilia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Latin Name
                    </label>
                    <input
                      type="text"
                      name="latin_name"
                      value={formData.latin_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Arnica montana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Pharmacopoeia
                    </label>
                    <select
                      name="pharmacopoeia"
                      value={formData.pharmacopoeia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Reference</option>
                      <option value="HPI">
                        HPI (Homoeopathic Pharmacopoeia of India)
                      </option>
                      <option value="HPUS">
                        HPUS (Homoeopathic Pharmacopoeia of US)
                      </option>
                      <option value="GHP">
                        GHP (German Homoeopathic Pharmacopoeia)
                      </option>
                      <option value="BHP">
                        BHP (British Homoeopathic Pharmacopoeia)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Vehicle/Medium
                    </label>
                    <select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Vehicle</option>
                      <option value="alcohol_90">Alcohol 90%</option>
                      <option value="alcohol_60">Alcohol 60%</option>
                      <option value="alcohol_40">Alcohol 40%</option>
                      <option value="sucrose_globules">Sucrose Globules</option>
                      <option value="lactose_globules">Lactose Globules</option>
                      <option value="cane_sugar_pills">Cane Sugar Pills</option>
                      <option value="distilled_water">Distilled Water</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Globule/Pill Size
                    </label>
                    <select
                      name="globule_size"
                      value={formData.globule_size}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Size</option>
                      <option value="size_10">Size 10 (Smallest)</option>
                      <option value="size_20">Size 20</option>
                      <option value="size_30">Size 30</option>
                      <option value="size_40">Size 40 (Largest)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          {/* Stock Management */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Stock Management
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Opening Stock
                </label>
                <input
                  type="number"
                  name="current_stock"
                  value={formData.current_stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  name="minimum_stock"
                  value={formData.minimum_stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 20"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  name="maximum_stock"
                  value={formData.maximum_stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 1000"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Unit of Measure
                </label>
                <select
                  name="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="units">Units</option>
                  <option value="tablets">Tablets</option>
                  <option value="capsules">Capsules</option>
                  <option value="bottles">Bottles</option>
                  <option value="boxes">Boxes</option>
                  <option value="strips">Strips</option>
                  <option value="vials">Vials</option>
                  <option value="ampoules">Ampoules</option>
                  <option value="tubes">Tubes</option>
                  <option value="packets">Packets</option>
                  <option value="ml">ml</option>
                  <option value="grams">Grams</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
            </div>
            {formData.selling_price > 0 && formData.cost_price > 0 && (
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                <p className="text-emerald-400 text-sm">
                  Profit Margin:{" "}
                  <span className="font-bold">
                    {(
                      ((formData.selling_price - formData.cost_price) /
                        formData.cost_price) *
                      100
                    ).toFixed(2)}
                    %
                  </span>{" "}
                  (₹{(formData.selling_price - formData.cost_price).toFixed(2)}{" "}
                  per unit)
                </p>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Additional Information
            </h2>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Any additional notes about this item..."
              />
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white">Item is Active</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Create Item
                </>
              )}
            </button>
            <Link
              href="/admin/inventory/items"
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewInventoryItemPage;
