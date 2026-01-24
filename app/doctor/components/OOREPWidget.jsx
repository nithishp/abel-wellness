"use client";

import { useState, useCallback, useMemo } from "react";
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
  FiBarChart2,
  FiTrash2,
  FiTarget,
  FiAward,
  FiDownload,
  FiList,
} from "react-icons/fi";
import { toast } from "sonner";

// Available repertories - Local (Docker) + Remote (oorep.com)
const REPERTORIES = [
  // Local repertories (Docker instance - works offline) - TEMPORARILY SET TO REMOTE
  { value: "publicum", label: "Publicum (English)", source: "remote" },
  { value: "kent-de", label: "Kent (Deutsch)", source: "remote" },
  // Remote repertories (oorep.com - requires internet)
  { value: "kent", label: "Kent (English)", source: "remote" },
  { value: "boger", label: "Boger", source: "remote" },
  { value: "bogboen", label: "Boenninghausen", source: "remote" },
  { value: "hering", label: "Hering", source: "remote" },
];

export default function OOREPWidget({ onAddToAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("kent");
  const [minWeight, setMinWeight] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Repertory Sheet state
  const [selectedRubrics, setSelectedRubrics] = useState([]);
  const [showRepertorySheet, setShowRepertorySheet] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  // Calculate remedy analysis from selected rubrics
  const remedyAnalysis = useMemo(() => {
    if (selectedRubrics.length === 0) return [];

    const remedyScores = {};

    selectedRubrics.forEach((rubric) => {
      const rubricWeight = rubric.importance || 1;

      rubric.weightedRemedies?.forEach((wr) => {
        const remedyKey = wr.remedy?.nameAbbrev || "Unknown";
        const remedyName =
          wr.remedy?.nameLong || wr.remedy?.nameAbbrev || "Unknown";

        if (!remedyScores[remedyKey]) {
          remedyScores[remedyKey] = {
            abbrev: remedyKey,
            name: remedyName,
            totalScore: 0,
            occurrences: 0,
            maxWeight: 0,
          };
        }

        const weightedScore = wr.weight * rubricWeight;
        remedyScores[remedyKey].totalScore += weightedScore;
        remedyScores[remedyKey].occurrences += 1;
        remedyScores[remedyKey].maxWeight = Math.max(
          remedyScores[remedyKey].maxWeight,
          wr.weight,
        );
      });
    });

    return Object.values(remedyScores)
      .map((r) => ({
        ...r,
        coverage: Math.round((r.occurrences / selectedRubrics.length) * 100),
      }))
      .sort((a, b) => {
        if (b.occurrences !== a.occurrences)
          return b.occurrences - a.occurrences;
        return b.totalScore - a.totalScore;
      });
  }, [selectedRubrics]);

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

  const addToRepertorySheet = (rubric) => {
    const rubricId = rubric.rubric?.id;
    if (selectedRubrics.find((r) => r.rubric?.id === rubricId)) {
      return; // Already in sheet - icon will show check
    }
    setSelectedRubrics((prev) => [...prev, { ...rubric, importance: 1 }]);
    // Show animated checkmark for 2 seconds
    setAddedIds((prev) => new Set([...prev, rubricId]));
    setTimeout(() => {
      setAddedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rubricId);
        return newSet;
      });
    }, 2000);
  };

  const removeFromSheet = (rubricId) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.rubric?.id !== rubricId));
  };

  const updateRubricImportance = (rubricId, importance) => {
    setSelectedRubrics((prev) =>
      prev.map((r) => (r.rubric?.id === rubricId ? { ...r, importance } : r)),
    );
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
      toast.success("Added to consultation notes");
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

  const getCoverageColor = (coverage) => {
    if (coverage >= 80) return "text-emerald-400 bg-emerald-500/20";
    if (coverage >= 60) return "text-green-400 bg-green-500/20";
    if (coverage >= 40) return "text-yellow-400 bg-yellow-500/20";
    if (coverage >= 20) return "text-orange-400 bg-orange-500/20";
    return "text-slate-400 bg-slate-500/20";
  };

  const exportRepertorySheet = () => {
    const lines = [
      "REPERTORY SHEET ANALYSIS",
      "========================",
      `Date: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      `Repertory: ${REPERTORIES.find((r) => r.value === selectedRepertory)?.label || selectedRepertory}`,
      "",
      "SELECTED RUBRICS:",
      ...selectedRubrics.map(
        (r, i) =>
          `${i + 1}. ${r.rubric?.fullPath} (Importance: ${r.importance})`,
      ),
      "",
      "TOP REMEDIES:",
      ...remedyAnalysis
        .slice(0, 15)
        .map(
          (r, i) =>
            `${i + 1}. ${r.abbrev} - Score: ${r.totalScore}, Coverage: ${r.coverage}%`,
        ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repertory-sheet-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
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

      {/* Full-screen Modal when Expanded */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Widget/Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed z-50 bg-slate-800 border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col ${
              isExpanded
                ? "inset-4 sm:inset-8 lg:inset-12 rounded-3xl"
                : "bottom-6 right-6 w-96 max-h-[70vh] rounded-2xl"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/90 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <FiBook className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">
                  {isExpanded ? "Repertory Search & Analysis" : "Repertory"}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {isExpanded && (
                  <button
                    onClick={() => setShowRepertorySheet(!showRepertorySheet)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors mr-2 ${
                      selectedRubrics.length > 0
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    <FiBarChart2 className="w-4 h-4" />
                    <span className="text-sm">
                      Sheet ({selectedRubrics.length})
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  title={isExpanded ? "Minimize" : "Expand to full screen"}
                >
                  {isExpanded ? (
                    <FiMinimize2 className="w-4 h-4" />
                  ) : (
                    <FiMaximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsExpanded(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div
              className={`flex-1 overflow-hidden flex ${isExpanded ? "flex-row" : "flex-col"}`}
            >
              {/* Search & Results Section */}
              <div
                className={`flex-1 flex flex-col overflow-hidden ${isExpanded && showRepertorySheet ? "border-r border-slate-700/50" : ""}`}
              >
                {/* Search Form */}
                <div
                  className={`p-4 border-b border-slate-700/50 ${isExpanded ? "px-6" : ""}`}
                >
                  <form onSubmit={handleSearch} className="space-y-3">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search symptoms... (e.g., headache, head* pain)"
                        className={`w-full pl-10 pr-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          isExpanded ? "py-3 text-base" : "py-2.5 text-sm"
                        }`}
                        autoFocus
                      />
                    </div>

                    <div
                      className={`flex gap-2 ${isExpanded ? "flex-row" : "flex-col sm:flex-row"}`}
                    >
                      <select
                        value={selectedRepertory}
                        onChange={(e) => setSelectedRepertory(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        <optgroup label="📦 Local">
                          {REPERTORIES.filter(
                            (r) =>
                              r.value === "publicum" || r.value === "kent-de",
                          ).map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🌐 Remote">
                          {REPERTORIES.filter(
                            (r) =>
                              r.value !== "publicum" && r.value !== "kent-de",
                          ).map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </optgroup>
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
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FiSearch className="w-4 h-4" />
                            {isExpanded && <span>Search</span>}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Results */}
                <div
                  className={`flex-1 overflow-y-auto p-4 space-y-3 ${isExpanded ? "px-6" : ""}`}
                >
                  {results.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <FiSearch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">
                        Search for symptoms
                      </p>
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
                      <div className={`p-3 ${isExpanded ? "p-4" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded mb-1 inline-block">
                              {selectedRepertory}
                            </span>
                            <p
                              className={`text-white break-words leading-relaxed ${isExpanded ? "text-base" : "text-sm"}`}
                            >
                              {result.rubric?.fullPath || "Unknown"}
                            </p>
                          </div>
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
                              onClick={() => addToRepertorySheet(result)}
                              className={`p-1.5 rounded transition-all duration-300 ${
                                selectedRubrics.find(
                                  (r) => r.rubric?.id === result.rubric?.id,
                                )
                                  ? "text-emerald-400 bg-emerald-500/20"
                                  : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                              }`}
                              title={
                                selectedRubrics.find(
                                  (r) => r.rubric?.id === result.rubric?.id,
                                )
                                  ? "Already in sheet"
                                  : "Add to repertory sheet"
                              }
                              disabled={selectedRubrics.find(
                                (r) => r.rubric?.id === result.rubric?.id,
                              )}
                            >
                              <AnimatePresence mode="wait">
                                {selectedRubrics.find(
                                  (r) => r.rubric?.id === result.rubric?.id,
                                ) || addedIds.has(result.rubric?.id) ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 25,
                                    }}
                                  >
                                    <FiCheck className="w-3.5 h-3.5" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="plus"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <FiPlus className="w-3.5 h-3.5" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                            {onAddToAnalysis && (
                              <button
                                onClick={() => addToAnalysis(result)}
                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                                title="Add to consultation notes"
                              >
                                <FiList className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                toggleRubricExpand(result.rubric?.id || index)
                              }
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                            >
                              {expandedRubrics.has(
                                result.rubric?.id || index,
                              ) ? (
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
                                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getWeightColor(wr.weight)}`}
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
              </div>

              {/* Repertory Sheet Panel (only in expanded mode) */}
              <AnimatePresence>
                {isExpanded && showRepertorySheet && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 380, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex flex-col overflow-hidden bg-slate-800/50"
                  >
                    {/* Sheet Header */}
                    <div className="p-4 border-b border-slate-700/50">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <FiBarChart2 className="w-4 h-4 text-emerald-400" />
                        Repertory Sheet
                      </h4>
                    </div>

                    {/* Sheet Content */}
                    <div className="flex-1 overflow-y-auto">
                      {/* Selected Rubrics */}
                      <div className="p-4 border-b border-slate-700/50">
                        <h5 className="text-sm font-medium text-slate-300 mb-3">
                          Selected Rubrics ({selectedRubrics.length})
                        </h5>

                        {selectedRubrics.length === 0 ? (
                          <div className="text-center py-4">
                            <FiList className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">
                              No rubrics selected
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {selectedRubrics.map((rubric, index) => (
                              <div
                                key={rubric.rubric?.id || index}
                                className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-xs text-white flex-1 break-words">
                                    {rubric.rubric?.fullPath || "Unknown"}
                                  </p>
                                  <button
                                    onClick={() =>
                                      removeFromSheet(rubric.rubric?.id)
                                    }
                                    className="p-1 text-red-400 hover:text-red-300 rounded"
                                  >
                                    <FiTrash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <select
                                  value={rubric.importance || 1}
                                  onChange={(e) =>
                                    updateRubricImportance(
                                      rubric.rubric?.id,
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="px-2 py-0.5 bg-slate-600/50 border border-slate-500/50 rounded text-xs text-white"
                                >
                                  <option value={1}>1x</option>
                                  <option value={2}>2x</option>
                                  <option value={3}>3x</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remedy Analysis */}
                      {selectedRubrics.length > 0 && (
                        <div className="p-4">
                          <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <FiTarget className="w-4 h-4" />
                            Top Remedies
                          </h5>

                          <div className="space-y-2">
                            {remedyAnalysis
                              .slice(0, 10)
                              .map((remedy, index) => (
                                <div
                                  key={remedy.abbrev}
                                  className={`p-2 rounded-lg border ${
                                    index === 0
                                      ? "bg-emerald-500/10 border-emerald-500/30"
                                      : "bg-slate-700/30 border-slate-600/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      {index === 0 && (
                                        <FiAward className="w-3 h-3 text-emerald-400" />
                                      )}
                                      <span className="font-semibold text-white text-sm">
                                        {remedy.abbrev}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getCoverageColor(remedy.coverage)}`}
                                    >
                                      {remedy.coverage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span>Score: {remedy.totalScore}</span>
                                    <span>
                                      {remedy.occurrences}/
                                      {selectedRubrics.length}
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1 bg-slate-600/50 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${index === 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                                      style={{ width: `${remedy.coverage}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sheet Actions */}
                    {selectedRubrics.length > 0 && (
                      <div className="p-4 border-t border-slate-700/50 space-y-2">
                        <button
                          onClick={exportRepertorySheet}
                          className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <FiDownload className="w-4 h-4" />
                          Export
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRubrics([]);
                            toast.success("Cleared");
                          }}
                          className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mini Sheet Button (when not expanded) */}
            {!isExpanded && selectedRubrics.length > 0 && (
              <div className="p-3 border-t border-slate-700/50 bg-slate-800/90">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <FiBarChart2 className="w-4 h-4" />
                  View Repertory Sheet ({selectedRubrics.length} rubrics)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
