"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiBook,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiX,
  FiInfo,
  FiList,
  FiBookOpen,
  FiLoader,
  FiAlertCircle,
  FiCopy,
  FiCheck,
  FiTrash2,
  FiBarChart2,
  FiTarget,
  FiAward,
  FiSave,
  FiDownload,
} from "react-icons/fi";
import { toast } from "sonner";
import DoctorSidebar from "../components/DoctorSidebar";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useRouter } from "next/navigation";

// Available repertories - combines local Docker instance and oorep.com
const REPERTORIES = [
  // === LOCAL REPERTORIES (Docker instance) ===
  {
    value: "publicum",
    label: "Publicum (English)",
    language: "en",
    source: "local",
  },
  {
    value: "kent-de",
    label: "Kent (Deutsch)",
    language: "de",
    source: "local",
  },
  // === REMOTE REPERTORIES (oorep.com) ===
  { value: "kent", label: "Kent (English)", language: "en", source: "remote" },
  { value: "boger", label: "Boger", language: "en", source: "remote" },
  {
    value: "bogboen",
    label: "Boenninghausen (Boger)",
    language: "en",
    source: "remote",
  },
  { value: "hering", label: "Hering", language: "en", source: "remote" },
  {
    value: "robasif",
    label: "Roberts - Sensations As If",
    language: "en",
    source: "remote",
  },
  {
    value: "tylercold",
    label: "Tyler - Common Cold",
    language: "en",
    source: "remote",
  },
  {
    value: "bogsk",
    label: "Boger Synoptic Key",
    language: "en",
    source: "remote",
  },
  {
    value: "bogsk-de",
    label: "Boger Synoptic Key (Deutsch)",
    language: "de",
    source: "remote",
  },
  {
    value: "dorcsi-de",
    label: "Dorcsi (Deutsch)",
    language: "de",
    source: "remote",
  },
];

const MIN_WEIGHTS = [
  { value: 1, label: "All (1+)" },
  { value: 2, label: "Medium (2+)" },
  { value: 3, label: "Strong (3+)" },
  { value: 4, label: "Very Strong (4+)" },
];

export default function DoctorRepertoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("kent");
  const [minWeight, setMinWeight] = useState(1);
  const [remedyFilter, setRemedyFilter] = useState("");

  // Results state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Case/Repertory Sheet state
  const [selectedRubrics, setSelectedRubrics] = useState([]);
  const [showRepertorySheet, setShowRepertorySheet] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Calculate remedy analysis from selected rubrics
  const remedyAnalysis = useMemo(() => {
    if (selectedRubrics.length === 0) return [];

    const remedyScores = {};

    selectedRubrics.forEach((rubric, rubricIndex) => {
      const rubricWeight = rubric.importance || 1; // Allow custom rubric importance

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
            rubricDetails: [],
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
        remedyScores[remedyKey].rubricDetails.push({
          rubricPath: rubric.rubric?.fullPath,
          weight: wr.weight,
          rubricIndex,
        });
      });
    });

    // Convert to array and sort by total score
    return Object.values(remedyScores)
      .map((r) => ({
        ...r,
        // Calculate coverage percentage
        coverage: Math.round((r.occurrences / selectedRubrics.length) * 100),
      }))
      .sort((a, b) => {
        // Primary sort by occurrences (coverage), secondary by total score
        if (b.occurrences !== a.occurrences) {
          return b.occurrences - a.occurrences;
        }
        return b.totalScore - a.totalScore;
      });
  }, [selectedRubrics]);

  // Search function
  const performSearch = useCallback(
    async (page = 1) => {
      if (!searchTerm.trim()) {
        toast.error("Please enter a search term");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          symptom: searchTerm,
          page: page.toString(),
          repertory: selectedRepertory,
          minWeight: minWeight.toString(),
          getRemedies: "1",
          remedyString: remedyFilter,
        });

        const response = await fetch(`/api/oorep/search?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Search failed");
        }

        if (page === 1) {
          setResults(data.data.results || data.data || []);
        } else {
          setResults((prev) => [
            ...prev,
            ...(data.data.results || data.data || []),
          ]);
        }

        setCurrentPage(page);
        setHasMore(data.data.hasMore || false);
        setTotalResults(data.data.totalResults || 0);
      } catch (err) {
        console.error("Search error:", err);
        setError(err.message);
        toast.error("Search failed: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedRepertory, minWeight, remedyFilter],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setResults([]);
    performSearch(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(currentPage + 1);
    }
  };

  const toggleRubricExpand = (rubricId) => {
    setExpandedRubrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rubricId)) {
        newSet.delete(rubricId);
      } else {
        newSet.add(rubricId);
      }
      return newSet;
    });
  };

  const addToCase = (rubric) => {
    const rubricId = rubric.rubric?.id;
    if (selectedRubrics.find((r) => r.rubric?.id === rubricId)) {
      return; // Already in case - icon will show check
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

  const removeFromCase = (rubricId) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.rubric?.id !== rubricId));
  };

  const updateRubricImportance = (rubricId, importance) => {
    setSelectedRubrics((prev) =>
      prev.map((r) => (r.rubric?.id === rubricId ? { ...r, importance } : r)),
    );
  };

  const copyRubricPath = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedId(path);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
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
      "----------------",
      ...selectedRubrics.map(
        (r, i) =>
          `${i + 1}. ${r.rubric?.fullPath} (Importance: ${r.importance})`,
      ),
      "",
      "REMEDY ANALYSIS:",
      "----------------",
      ...remedyAnalysis
        .slice(0, 20)
        .map(
          (r, i) =>
            `${i + 1}. ${r.abbrev} (${r.name}) - Score: ${r.totalScore}, Coverage: ${r.coverage}%, Occurrences: ${r.occurrences}/${selectedRubrics.length}`,
        ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repertory-sheet-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Repertory sheet exported");
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "doctor") {
    router.push("/doctor/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DoctorSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 sm:px-8 lg:px-10 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiBook className="w-6 h-6 text-emerald-400" />
                  Repertory Search
                </h1>
                <p className="text-slate-400 text-sm">
                  Search symptoms and build your case analysis
                </p>
              </div>

              {/* Repertory Sheet Toggle */}
              <button
                onClick={() => setShowRepertorySheet(!showRepertorySheet)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedRubrics.length > 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                }`}
              >
                <FiBarChart2 className="w-4 h-4" />
                Repertory Sheet ({selectedRubrics.length})
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex gap-6">
            {/* Main Content */}
            <div
              className={`flex-1 transition-all ${showRepertorySheet ? "lg:mr-[420px]" : ""}`}
            >
              {/* Search Form */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search symptoms... (e.g., headache, head* pain, -eye)"
                      className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                    />
                  </div>

                  {/* Filters Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <FiFilter className="w-4 h-4" />
                    <span>Filters</span>
                    {showFilters ? (
                      <FiChevronUp className="w-4 h-4" />
                    ) : (
                      <FiChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Filter Options */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                          {/* Repertory Selection */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Repertory
                            </label>
                            <select
                              value={selectedRepertory}
                              onChange={(e) =>
                                setSelectedRepertory(e.target.value)
                              }
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                            >
                              <optgroup label="📦 Local (Docker)">
                                {REPERTORIES.filter(
                                  (r) => r.source === "local",
                                ).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="🌐 Remote (oorep.com)">
                                {REPERTORIES.filter(
                                  (r) => r.source === "remote",
                                ).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {/* Min Weight */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Minimum Weight
                            </label>
                            <select
                              value={minWeight}
                              onChange={(e) =>
                                setMinWeight(parseInt(e.target.value))
                              }
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                            >
                              {MIN_WEIGHTS.map((w) => (
                                <option key={w.value} value={w.value}>
                                  {w.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Remedy Filter */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Filter by Remedy
                            </label>
                            <input
                              type="text"
                              value={remedyFilter}
                              onChange={(e) => setRemedyFilter(e.target.value)}
                              placeholder="e.g., Bell, Arn"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={loading || !searchTerm.trim()}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <FiSearch className="w-5 h-5" />
                        Search
                      </>
                    )}
                  </button>
                </form>

                {/* Search Tips */}
                <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex items-start gap-2">
                    <FiInfo className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-400">
                      <strong className="text-slate-300">Search Tips:</strong>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>
                          Use{" "}
                          <code className="px-1 bg-slate-600/50 rounded">
                            head*
                          </code>{" "}
                          for wildcards
                        </li>
                        <li>
                          Use{" "}
                          <code className="px-1 bg-slate-600/50 rounded">
                            &quot;exact phrase&quot;
                          </code>{" "}
                          for exact matches
                        </li>
                        <li>
                          Use{" "}
                          <code className="px-1 bg-slate-600/50 rounded">
                            -word
                          </code>{" "}
                          to exclude terms
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      Results {totalResults > 0 && `(${totalResults})`}
                    </h2>
                  </div>

                  {results.map((result, index) => (
                    <motion.div
                      key={result.rubric?.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
                    >
                      {/* Rubric Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                {result.repertoryAbbrev || selectedRepertory}
                              </span>
                            </div>
                            <h3 className="text-white font-medium break-words">
                              {result.rubric?.fullPath ||
                                result.fullPath ||
                                "Unknown rubric"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() =>
                                copyRubricPath(
                                  result.rubric?.fullPath || result.fullPath,
                                )
                              }
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                              title="Copy rubric path"
                            >
                              {copiedId ===
                              (result.rubric?.fullPath || result.fullPath) ? (
                                <FiCheck className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <FiCopy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => addToCase(result)}
                              className={`p-2 rounded-lg transition-all duration-300 ${
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
                                    <FiCheck className="w-4 h-4" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="plus"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <FiPlus className="w-4 h-4" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                            <button
                              onClick={() =>
                                toggleRubricExpand(result.rubric?.id || index)
                              }
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                              {expandedRubrics.has(
                                result.rubric?.id || index,
                              ) ? (
                                <FiChevronUp className="w-4 h-4" />
                              ) : (
                                <FiChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remedies (Expanded) */}
                      <AnimatePresence>
                        {expandedRubrics.has(result.rubric?.id || index) &&
                          result.weightedRemedies && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-700/50 bg-slate-700/20"
                            >
                              <div className="p-4">
                                <h4 className="text-sm font-medium text-slate-300 mb-3">
                                  Remedies ({result.weightedRemedies.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {result.weightedRemedies
                                    .sort((a, b) => b.weight - a.weight)
                                    .map((wr, idx) => (
                                      <span
                                        key={idx}
                                        className={`px-2 py-1 rounded text-sm font-medium ${getWeightColor(wr.weight)}`}
                                        title={`${wr.remedy?.nameLong || wr.remedy?.nameAbbrev} - Weight: ${wr.weight}`}
                                      >
                                        {wr.remedy?.nameAbbrev || "?"}
                                        <sup className="ml-0.5">
                                          {wr.weight}
                                        </sup>
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!loading && results.length === 0 && !searchTerm && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                    <FiBook className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Repertory Search
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Search for symptoms to find matching remedies. Add rubrics
                    to your Repertory Sheet for case analysis.
                  </p>
                </div>
              )}
            </div>

            {/* Repertory Sheet Panel */}
            <AnimatePresence>
              {showRepertorySheet && (
                <motion.div
                  initial={{ x: 420, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 420, opacity: 0 }}
                  className="fixed right-0 top-0 h-full w-[420px] bg-slate-800 border-l border-slate-700/50 z-40 overflow-hidden flex flex-col"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/90 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <FiBarChart2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">
                        Repertory Sheet
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowRepertorySheet(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Selected Rubrics */}
                    <div className="p-4 border-b border-slate-700/50">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <FiList className="w-4 h-4" />
                        Selected Rubrics ({selectedRubrics.length})
                      </h4>

                      {selectedRubrics.length === 0 ? (
                        <div className="text-center py-6">
                          <FiList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">
                            No rubrics selected
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            Click + on search results to add rubrics
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {selectedRubrics.map((rubric, index) => (
                            <div
                              key={rubric.rubric?.id || index}
                              className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm text-white flex-1 break-words leading-relaxed">
                                  {rubric.rubric?.fullPath || "Unknown"}
                                </p>
                                <button
                                  onClick={() =>
                                    removeFromCase(rubric.rubric?.id)
                                  }
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded flex-shrink-0"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  Importance:
                                </span>
                                <select
                                  value={rubric.importance || 1}
                                  onChange={(e) =>
                                    updateRubricImportance(
                                      rubric.rubric?.id,
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="px-2 py-1 bg-slate-600/50 border border-slate-500/50 rounded text-xs text-white"
                                >
                                  <option value={1}>Normal (1x)</option>
                                  <option value={2}>Important (2x)</option>
                                  <option value={3}>Very Important (3x)</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remedy Analysis */}
                    {selectedRubrics.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <FiTarget className="w-4 h-4" />
                          Remedy Analysis
                        </h4>

                        {remedyAnalysis.length === 0 ? (
                          <p className="text-slate-400 text-sm">
                            No remedies found
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {remedyAnalysis
                              .slice(0, 15)
                              .map((remedy, index) => (
                                <div
                                  key={remedy.abbrev}
                                  className={`p-3 rounded-xl border ${
                                    index === 0
                                      ? "bg-emerald-500/10 border-emerald-500/30"
                                      : index < 3
                                        ? "bg-slate-700/50 border-slate-600/50"
                                        : "bg-slate-700/30 border-slate-600/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {index === 0 && (
                                        <FiAward className="w-4 h-4 text-emerald-400" />
                                      )}
                                      <span className="font-semibold text-white">
                                        {remedy.abbrev}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {remedy.name}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${getCoverageColor(remedy.coverage)}`}
                                    >
                                      {remedy.coverage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span>
                                      Score:{" "}
                                      <span className="text-white">
                                        {remedy.totalScore}
                                      </span>
                                    </span>
                                    <span>
                                      Rubrics:{" "}
                                      <span className="text-white">
                                        {remedy.occurrences}/
                                        {selectedRubrics.length}
                                      </span>
                                    </span>
                                    <span>
                                      Max:{" "}
                                      <span className="text-white">
                                        {remedy.maxWeight}
                                      </span>
                                    </span>
                                  </div>
                                  {/* Coverage bar */}
                                  <div className="mt-2 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        index === 0
                                          ? "bg-emerald-500"
                                          : "bg-blue-500"
                                      }`}
                                      style={{ width: `${remedy.coverage}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  {selectedRubrics.length > 0 && (
                    <div className="p-4 border-t border-slate-700/50 space-y-2 bg-slate-800/90 backdrop-blur-sm">
                      <button
                        onClick={exportRepertorySheet}
                        className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiDownload className="w-4 h-4" />
                        Export Analysis
                      </button>
                      <button
                        onClick={() => {
                          const caseText = selectedRubrics
                            .map((r) => r.rubric?.fullPath)
                            .join("\n");
                          navigator.clipboard.writeText(caseText);
                          toast.success("Rubrics copied to clipboard");
                        }}
                        className="w-full py-2.5 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiCopy className="w-4 h-4" />
                        Copy Rubrics
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRubrics([]);
                          toast.success("Repertory sheet cleared");
                        }}
                        className="w-full py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
