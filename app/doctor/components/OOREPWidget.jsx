"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiCopy,
  FiCheck,
  FiLoader,
  FiMinimize2,
  FiMaximize2,
} from "react-icons/fi";
import { toast } from "sonner";

const REPERTORIES = [
  { value: "publicum", label: "Publicum (Free)" },
  { value: "kent", label: "Kent" },
  { value: "boger", label: "Boger" },
];

export default function OOREPWidget({ onAddToAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("publicum");
  const [minWeight, setMinWeight] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        repertory: selectedRepertory,
        symptom: searchTerm,
        page: "1",
        minWeight: minWeight.toString(),
        getRemedies: "1",
      });

      const response = await fetch(`/api/oorep/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results || data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("OOREP search error:", err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRepertory, minWeight]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const toggleRubricExpand = (id) => {
    setExpandedRubrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const addToAnalysis = (rubric) => {
    const text = `${rubric.rubric?.fullPath || ""}\nRemedies: ${
      rubric.weightedRemedies
        ?.sort((a, b) => b.weight - a.weight)
        .slice(0, 10)
        .map((r) => `${r.remedy?.nameAbbrev}(${r.weight})`)
        .join(", ") || ""
    }`;

    if (onAddToAnalysis) {
      onAddToAnalysis(text);
      toast.success("Added to analysis");
    }
  };

  const copyRubric = async (rubric) => {
    const text = `${rubric.rubric?.fullPath || ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(rubric.rubric?.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const getWeightColor = (weight) => {
    switch (weight) {
      case 5:
        return "text-red-400 bg-red-500/20";
      case 4:
        return "text-orange-400 bg-orange-500/20";
      case 3:
        return "text-yellow-400 bg-yellow-500/20";
      case 2:
        return "text-blue-400 bg-blue-500/20";
      default:
        return "text-slate-400 bg-slate-500/20";
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center transition-all hover:scale-110"
            title="Open Repertory Search"
          >
            <FiBook className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed z-50 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              isExpanded
                ? "bottom-4 right-4 left-4 top-20 sm:left-auto sm:w-[600px] sm:top-20 sm:bottom-4"
                : "bottom-6 right-6 w-96 max-h-[70vh]"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/90 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <FiBook className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Repertory</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <FiMinimize2 className="w-4 h-4" />
                  ) : (
                    <FiMaximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Form */}
            <div className="p-4 border-b border-slate-700/50">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search symptoms..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedRepertory}
                    onChange={(e) => setSelectedRepertory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    {REPERTORIES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minWeight}
                    onChange={(e) => setMinWeight(parseInt(e.target.value))}
                    className="w-24 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !searchTerm.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSearch className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {results.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FiSearch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Search for symptoms</p>
                  <p className="text-slate-500 text-xs mt-2">
                    Use wildcards: head*, -eye, &quot;exact phrase&quot;
                  </p>
                </div>
              )}

              {results.map((result, index) => (
                <div
                  key={result.rubric?.id || index}
                  className="bg-slate-700/30 border border-slate-600/30 rounded-xl overflow-hidden"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white flex-1 break-words leading-relaxed">
                        {result.rubric?.fullPath || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyRubric(result)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedId === result.rubric?.id ? (
                            <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => addToAnalysis(result)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition-colors"
                          title="Add to analysis"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            toggleRubricExpand(result.rubric?.id || index)
                          }
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                        >
                          {expandedRubrics.has(result.rubric?.id || index) ? (
                            <FiChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <FiChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedRubrics.has(result.rubric?.id || index) &&
                      result.weightedRemedies && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-600/30 bg-slate-700/20 p-3"
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {result.weightedRemedies
                              .sort((a, b) => b.weight - a.weight)
                              .map((wr, idx) => (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${getWeightColor(
                                    wr.weight,
                                  )}`}
                                  title={wr.remedy?.nameLong}
                                >
                                  {wr.remedy?.nameAbbrev}
                                  <sup>{wr.weight}</sup>
                                </span>
                              ))}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
