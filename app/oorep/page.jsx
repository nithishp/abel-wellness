"use client";

import { useState, useCallback } from "react";
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
  FiArrowLeft,
  FiHome,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

// Available repertories - combines local Docker instance and oorep.com
// Local repertories (Docker): publicum, kent-de - these work offline
// Remote repertories (oorep.com): all others - require internet connection
const REPERTORIES = [
  // === LOCAL REPERTORIES (Docker instance) ===
  {
    value: "publicum",
    label: "Publicum (English)",
    description: "Free public repertory derived from Kent",
    language: "en",
    source: "local",
  },
  {
    value: "kent-de",
    label: "Kent (Deutsch)",
    description: "German translation - use German terms (e.g., Kopfschmerz)",
    language: "de",
    source: "local",
  },
  // === REMOTE REPERTORIES (oorep.com) ===
  {
    value: "kent",
    label: "Kent (English)",
    description: "Kent's Repertory of the Homeopathic Materia Medica (1897)",
    language: "en",
    source: "remote",
  },
  {
    value: "boger",
    label: "Boger",
    description: "Boger's General Analysis",
    language: "en",
    source: "remote",
  },
  {
    value: "bogboen",
    label: "Boenninghausen (Boger)",
    description: "Boenninghausen's Characteristics and Repertory",
    language: "en",
    source: "remote",
  },
  {
    value: "hering",
    label: "Hering",
    description: "Repertory of Hering's Guiding Symptoms",
    language: "en",
    source: "remote",
  },
  {
    value: "robasif",
    label: "Roberts - Sensations As If",
    description: "Repertory of Subjective Symptoms",
    language: "en",
    source: "remote",
  },
  {
    value: "tylercold",
    label: "Tyler - Common Cold",
    description: "Miniature Repertory of the Common Cold",
    language: "en",
    source: "remote",
  },
  {
    value: "bogsk",
    label: "Boger Synoptic Key",
    description: "A Synoptic Key of the Materia Medica",
    language: "en",
    source: "remote",
  },
  {
    value: "bogsk-de",
    label: "Boger Synoptic Key (Deutsch)",
    description: "German translation - use German terms",
    language: "de",
    source: "remote",
  },
  {
    value: "dorcsi-de",
    label: "Dorcsi (Deutsch)",
    description: "Symptomenverzeichnis - German only",
    language: "de",
    source: "remote",
  },
];

// Available materia medicas in the Docker OOREP instance
const MATERIA_MEDICAS = [
  {
    value: "boericke",
    label: "Boericke",
    description: "Pocket Manual of Homoeopathic Materia Medica",
  },
];

const MIN_WEIGHTS = [
  { value: 1, label: "All (1+)" },
  { value: 2, label: "Medium (2+)" },
  { value: 3, label: "Strong (3+)" },
  { value: 4, label: "Very Strong (4+)" },
];

export default function OOREPPage() {
  // Search state
  const [searchMode, setSearchMode] = useState("repertory"); // 'repertory' or 'materiamedica'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepertory, setSelectedRepertory] = useState("publicum");
  const [selectedMM, setSelectedMM] = useState("boericke");
  const [minWeight, setMinWeight] = useState(1);
  const [remedyFilter, setRemedyFilter] = useState("");

  // Results state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Case builder state
  const [selectedRubrics, setSelectedRubrics] = useState([]);
  const [showCasePanel, setShowCasePanel] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRubrics, setExpandedRubrics] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

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
        const endpoint =
          searchMode === "repertory"
            ? "/api/oorep/search"
            : "/api/oorep/materia-medica";

        const params = new URLSearchParams({
          symptom: searchTerm,
          page: page.toString(),
          ...(searchMode === "repertory"
            ? {
                repertory: selectedRepertory,
                minWeight: minWeight.toString(),
                getRemedies: "1",
                remedyString: remedyFilter,
              }
            : {
                materiamedica: selectedMM,
                remedyString: remedyFilter,
              }),
        });

        const response = await fetch(`${endpoint}?${params}`);
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
    [
      searchTerm,
      searchMode,
      selectedRepertory,
      selectedMM,
      minWeight,
      remedyFilter,
    ],
  );

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setResults([]);
    performSearch(1);
  };

  // Load more results
  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(currentPage + 1);
    }
  };

  // Toggle rubric expansion
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

  // Add rubric to case
  const addToCase = (rubric) => {
    if (selectedRubrics.find((r) => r.rubric?.id === rubric.rubric?.id)) {
      toast.info("Rubric already in case");
      return;
    }
    setSelectedRubrics((prev) => [...prev, rubric]);
    toast.success("Added to case");
  };

  // Remove rubric from case
  const removeFromCase = (rubricId) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.rubric?.id !== rubricId));
  };

  // Copy rubric path
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

  // Get remedy weight color
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <FiHome className="w-5 h-5" />
              </Link>
              <div className="border-l border-slate-700 pl-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FiBook className="w-6 h-6 text-emerald-400" />
                  Homeopathy Repertory
                </h1>
                <p className="text-slate-400 text-sm">
                  Search symptoms and find matching remedies
                </p>
              </div>
            </div>

            {/* Case Panel Toggle */}
            <button
              onClick={() => setShowCasePanel(!showCasePanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                selectedRubrics.length > 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
              }`}
            >
              <FiList className="w-4 h-4" />
              Case ({selectedRubrics.length})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className={`flex-1 ${showCasePanel ? "lg:mr-80" : ""}`}>
            {/* Search Form */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6">
              {/* Search Mode Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSearchMode("repertory")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    searchMode === "repertory"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700"
                  }`}
                >
                  <FiBook className="w-4 h-4" />
                  Repertory
                </button>
                <button
                  onClick={() => setSearchMode("materiamedica")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    searchMode === "materiamedica"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700"
                  }`}
                >
                  <FiBookOpen className="w-4 h-4" />
                  Materia Medica
                </button>
              </div>

              {/* Search Input */}
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
                        {/* Repertory/MM Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            {searchMode === "repertory"
                              ? "Repertory"
                              : "Materia Medica"}
                          </label>
                          <select
                            value={
                              searchMode === "repertory"
                                ? selectedRepertory
                                : selectedMM
                            }
                            onChange={(e) =>
                              searchMode === "repertory"
                                ? setSelectedRepertory(e.target.value)
                                : setSelectedMM(e.target.value)
                            }
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                          >
                            {(searchMode === "repertory"
                              ? REPERTORIES
                              : MATERIA_MEDICAS
                            ).map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Min Weight (Repertory only) */}
                        {searchMode === "repertory" && (
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
                        )}

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
                      <li>
                        Combine terms with commas:{" "}
                        <code className="px-1 bg-slate-600/50 rounded">
                          head, pain, -eye
                        </code>
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
                          {result.rubric?.textt && (
                            <p className="text-slate-400 text-sm mt-1">
                              {result.rubric.textt}
                            </p>
                          )}
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
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Add to case"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              toggleRubricExpand(result.rubric?.id || index)
                            }
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                          >
                            {expandedRubrics.has(result.rubric?.id || index) ? (
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
                                      className={`px-2 py-1 rounded text-sm font-medium ${getWeightColor(
                                        wr.weight,
                                      )}`}
                                      title={`${
                                        wr.remedy?.nameLong ||
                                        wr.remedy?.nameAbbrev
                                      } - Weight: ${wr.weight}`}
                                    >
                                      {wr.remedy?.nameAbbrev || "?"}
                                      <sup className="ml-0.5">{wr.weight}</sup>
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
            {!loading && results.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <FiSearch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  No results found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}

            {/* Initial State */}
            {!loading && results.length === 0 && !searchTerm && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <FiBook className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to the Repertory Search
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Search for symptoms to find matching homeopathic remedies from
                  classical repertories like Kent, Boger, and more.
                </p>
              </div>
            )}
          </div>

          {/* Case Panel (Sidebar) */}
          <AnimatePresence>
            {showCasePanel && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                className="fixed right-0 top-0 h-full w-80 bg-slate-800 border-l border-slate-700/50 z-40 overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Case Builder
                  </h3>
                  <button
                    onClick={() => setShowCasePanel(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {selectedRubrics.length === 0 ? (
                    <div className="text-center py-8">
                      <FiList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No rubrics selected</p>
                      <p className="text-slate-500 text-sm mt-1">
                        Click + on a rubric to add it to your case
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedRubrics.map((rubric, index) => (
                        <div
                          key={rubric.rubric?.id || index}
                          className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-white flex-1 break-words">
                              {rubric.rubric?.fullPath || "Unknown"}
                            </p>
                            <button
                              onClick={() => removeFromCase(rubric.rubric?.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                          {rubric.weightedRemedies && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rubric.weightedRemedies
                                .slice(0, 5)
                                .map((wr, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-xs ${getWeightColor(
                                      wr.weight,
                                    )}`}
                                  >
                                    {wr.remedy?.nameAbbrev}
                                  </span>
                                ))}
                              {rubric.weightedRemedies.length > 5 && (
                                <span className="text-xs text-slate-500">
                                  +{rubric.weightedRemedies.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRubrics.length > 0 && (
                  <div className="p-4 border-t border-slate-700/50 space-y-3">
                    <button
                      onClick={() => {
                        const caseText = selectedRubrics
                          .map((r) => r.rubric?.fullPath)
                          .join("\n");
                        navigator.clipboard.writeText(caseText);
                        toast.success("Case copied to clipboard");
                      }}
                      className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCopy className="w-4 h-4" />
                      Copy Case
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRubrics([]);
                        toast.success("Case cleared");
                      }}
                      className="w-full py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
