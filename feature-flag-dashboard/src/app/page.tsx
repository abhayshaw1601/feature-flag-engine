"use client";
import { useState, useEffect } from "react";
import { Plus, Search, ShieldAlert, Activity, CheckCircle, HelpCircle } from "lucide-react";
import { FeatureFlag } from "../types";
import FlagCard from "../components/FlagCard";
import CreateFlagModal from "../components/CreateFlagModal";
import { useFlags } from "@/components/FlagProvider";
import { PerspectiveCarousel } from "@/components/ui/perspective-carousel";

export default function Dashboard() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFlags = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/v1/flags");
            if (!res.ok) throw new Error("Failed to fetch feature flags");
            const data = await res.json();
            setFlags(data.data || data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Could not connect to the feature flag engine server. Make sure it is running on port 5000.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    const filteredFlags = flags.filter((flag) =>
        flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flag.description && flag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const activeFlagsCount = flags.filter((f) => f.isActive).length;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        Feature Flags
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Real-time feature toggling, progressive traffic rollouts, and user whitelist targeting.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg transition text-sm"
                >
                    <Plus size={16} />
                    <span>Create New Flag</span>
                </button>
            </div>

            {/* Metrics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg text-slate-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Schema Registries</p>
                        <h4 className="text-xl font-bold text-slate-200 mt-1">{flags.length}</h4>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg text-slate-400">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Live Flags</p>
                        <h4 className="text-xl font-bold text-slate-200 mt-1">{activeFlagsCount}</h4>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg text-slate-400">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Inactive Rules</p>
                        <h4 className="text-xl font-bold text-slate-200 mt-1">{flags.length - activeFlagsCount}</h4>
                    </div>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search key or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-705 placeholder-slate-600 transition"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {loading && flags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-550 mb-4"></div>
                    <p className="text-sm">Fetching feature flags...</p>
                </div>
            ) : error ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start gap-4 text-slate-300">
                    <ShieldAlert className="text-slate-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h5 className="font-semibold text-slate-200">Connection Error</h5>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                            onClick={fetchFlags}
                            className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold mt-3 transition"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            ) : filteredFlags.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-sm">No feature flags match your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredFlags.map((flag) => (
                        <FlagCard key={flag._id} flag={flag} refreshFlags={fetchFlags} />
                    ))}
                </div>
            )}

            <AppSimulationSandbox />

            {/* Create Modal overlay */}
            <CreateFlagModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={fetchFlags}
            />
        </main>
    );
}

function AppSimulationSandbox() {
    const { flags, loading, evaluateFlags } = useFlags();

    // Initialize a mock user session targeting India location rules
    useEffect(() => {
        evaluateFlags("abhay_dev_01", { country: "IN" });
    }, []);

    if (loading) return <p className="text-xs text-slate-500">Evaluating local device states...</p>;

    return (
        <div className="mt-12 p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-6xl mx-auto">
            <h4 className="text-md font-semibold text-slate-250 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live Client Application Simulation View
            </h4>
            <p className="text-xs text-slate-500 mb-4">
                Active User Target Identity context parsed: <code className="text-slate-400 font-mono">abhay_dev_01 (Location: IN)</code>
            </p>

            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 flex justify-between items-center">
                <div>
                    <span className="text-sm font-semibold text-slate-200">New Beta V2 Dashboard Experience Component</span>
                    <p className="text-xs text-slate-500 mt-0.5">This section dynamically locks or unlocks based on live infrastructure rule sets.</p>
                </div>

                {flags["new-dashboard-v2"] ? (
                    <span className="bg-slate-850 text-blue-400 border border-slate-800 px-3 py-1 rounded text-xs font-semibold uppercase">
                        Enabled (True)
                    </span>
                ) : (
                    <span className="bg-slate-850 text-slate-500 border border-slate-800 px-3 py-1 rounded text-xs font-semibold uppercase">
                        Locked (False)
                    </span>
                )}
            </div>
        </div>
    );
}
