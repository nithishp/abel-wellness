"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../../components/AdminSidebar";
import { Combobox } from "@/components/ui/combobox";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const EditInventoryItemPage = ({ params }) => {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    item_type: "medication",
    category_id: "",
    supplier_id: "",
    unit_of_measure: "units",
    minimum_stock: "",
    reorder_level: "",
    cost_price: "",
    selling_price: "",
    is_active: true,
    requires_prescription: false,
    storage_conditions: "",
    manufacturer: "",
    generic_name: "",
    dosage_form: "",
    strength: "",
    // Homeopathy-specific fields
    potency: "",
    potency_scale: "",
    source_type: "",
    latin_name: "",
    pharmacopoeia: "",
    vehicle: "",
    globule_size: "",
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

    fetchData();
  }, [user, authLoading, router, id]);

  const fetchData = async () => {
    try {
      const [itemRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch(`/api/inventory/items/${id}`),
        fetch("/api/inventory/categories"),
        fetch("/api/inventory/suppliers"),
      ]);

      const itemData = await itemRes.json();
      const categoriesData = await categoriesRes.json();
      const suppliersData = await suppliersRes.json();

      if (itemData.success && itemData.item) {
        setFormData({
          name: itemData.item.name || "",
          description: itemData.item.description || "",
          sku: itemData.item.sku || "",
          barcode: itemData.item.barcode || "",
          item_type: itemData.item.item_type || "medication",
          category_id: itemData.item.category_id || "",
          supplier_id: itemData.item.supplier_id || "",
          unit_of_measure: itemData.item.unit_of_measure || "units",
          minimum_stock: itemData.item.minimum_stock || 10,
          reorder_level: itemData.item.reorder_level || 20,
          cost_price: itemData.item.cost_price || 0,
          selling_price: itemData.item.selling_price || 0,
          is_active: itemData.item.is_active ?? true,
          requires_prescription: itemData.item.requires_prescription || false,
          storage_conditions: itemData.item.storage_conditions || "",
          manufacturer: itemData.item.manufacturer || "",
          generic_name: itemData.item.generic_name || "",
          dosage_form: itemData.item.dosage_form || "",
          strength: itemData.item.strength || "",
          // Homeopathy-specific fields
          potency: itemData.item.potency || "",
          potency_scale: itemData.item.potency_scale || "",
          source_type: itemData.item.source_type || "",
          latin_name: itemData.item.latin_name || "",
          pharmacopoeia: itemData.item.pharmacopoeia || "",
          vehicle: itemData.item.vehicle || "",
          globule_size: itemData.item.globule_size || "",
        });
      } else {
        toast.error("Item not found");
        router.push("/admin/inventory/items");
        return;
      }

      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      }
      if (suppliersData.success) {
        setSuppliers(suppliersData.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load item data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Item updated successfully");
        router.push(`/admin/inventory/items/${id}`);
      } else {
        toast.error(data.error || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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
        <div className="flex items-center justify-between mb-6 ml-12 lg:ml-0">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/inventory/items/${id}`}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Item</h1>
              <p className="text-slate-400 mt-1">
                Update inventory item details
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Paracetamol 500mg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Item Type *
                </label>
                <select
                  value={formData.item_type}
                  onChange={(e) =>
                    setFormData({ ...formData, item_type: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="medication">Medication</option>
                  <option value="supply">Medical Supply</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <Combobox
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  value={formData.category_id}
                  onChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                  placeholder="Select Category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., MED-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  placeholder="Barcode number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Item description..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Medication Details */}
          {formData.item_type === "medication" && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Medication Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) =>
                      setFormData({ ...formData, generic_name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Paracetamol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Sun Pharma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dosage Form
                  </label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage_form: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Form</option>
                    <option value="tablet">Tablet</option>
                    <option value="syrup">Syrup</option>
                    <option value="drops">Drops</option>
                    <option value="powder">Powder</option>
                    <option value="ointment">Ointment</option>
                    <option value="globules">Globules (Homeopathic)</option>
                    <option value="mother_tincture">Mother Tincture (Q)</option>
                    <option value="dilution">Dilution</option>
                    <option value="trituration">Trituration</option>
                    <option value="pills">Pills/Pillules</option>
                    <option value="lm_potency">LM Potency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) =>
                      setFormData({ ...formData, strength: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Storage Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.storage_conditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storage_conditions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Store below 25°C"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requires_prescription"
                    checked={formData.requires_prescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_prescription: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="requires_prescription"
                    className="text-slate-300"
                  >
                    Requires Prescription
                  </label>
                </div>
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
              <div className="bg-slate-800/50 rounded-xl border border-emerald-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Homeopathy Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Potency
                    </label>
                    <input
                      type="text"
                      value={formData.potency}
                      onChange={(e) =>
                        setFormData({ ...formData, potency: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 6, 30, 200, 1M, 10M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Potency Scale
                    </label>
                    <select
                      value={formData.potency_scale}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          potency_scale: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Scale</option>
                      <option value="X">X (Decimal - 1:10)</option>
                      <option value="C">C (Centesimal - 1:100)</option>
                      <option value="LM">LM (50 Millesimal)</option>
                      <option value="Q">Q (Mother Tincture)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Source Type
                    </label>
                    <select
                      value={formData.source_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          source_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Latin Name
                    </label>
                    <input
                      type="text"
                      value={formData.latin_name}
                      onChange={(e) =>
                        setFormData({ ...formData, latin_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Arnica montana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Pharmacopoeia
                    </label>
                    <select
                      value={formData.pharmacopoeia}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pharmacopoeia: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vehicle/Medium
                    </label>
                    <select
                      value={formData.vehicle}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicle: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Globule/Pill Size
                    </label>
                    <select
                      value={formData.globule_size}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          globule_size: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Stock Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Unit of Measure
                </label>
                <select
                  value={formData.unit_of_measure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_of_measure: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="units">Units</option>
                  <option value="tablets">Tablets</option>
                  <option value="capsules">Capsules</option>
                  <option value="ml">ML</option>
                  <option value="mg">MG</option>
                  <option value="bottles">Bottles</option>
                  <option value="boxes">Boxes</option>
                  <option value="strips">Strips</option>
                  <option value="vials">Vials</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimum_stock:
                        e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  min="0"
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorder_level:
                        e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  min="0"
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Supplier
                </label>
                <Combobox
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                  value={formData.supplier_id}
                  onChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  placeholder="Select Supplier"
                  searchPlaceholder="Search suppliers..."
                  emptyMessage="No suppliers found."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost_price:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      selling_price:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            {formData.selling_price > 0 && formData.cost_price > 0 && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-400 text-sm">
                  Profit Margin:{" "}
                  <span className="font-bold">
                    {(
                      ((formData.selling_price - formData.cost_price) /
                        formData.cost_price) *
                      100
                    ).toFixed(1)}
                    %
                  </span>{" "}
                  (₹{(formData.selling_price - formData.cost_price).toFixed(2)}{" "}
                  per unit)
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-slate-300">
                Active Item (visible in inventory)
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/admin/inventory/items/${id}`}
              className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSave className="w-5 h-5" />
              )}
              Update Item
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditInventoryItemPage;
