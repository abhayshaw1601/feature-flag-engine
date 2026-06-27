"use client";
import { useState, useEffect } from "react";
import { Plus, Search, ShieldAlert, Activity, CheckCircle, HelpCircle } from "lucide-react";
import { FeatureFlag } from "../types";
import FlagCard from "../components/FlagCard";
import CreateFlagModal from "../components/CreateFlagModal";

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
                    <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Control Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Real-time feature toggling, progressive traffic rollouts, and user whitelist targeting.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-550/20 active:scale-95 duration-100"
                >
                    <Plus size={18} />
                    <span>Create New Flag</span>
                </button>
            </div>

            {/* Metrics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-950/50 border border-blue-900/50 rounded-lg text-blue-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Schema Registries</p>
                        <h4 className="text-2xl font-bold text-slate-100 mt-1">{flags.length}</h4>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-400">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Live Flags</p>
                        <h4 className="text-2xl font-bold text-emerald-400 mt-1">{activeFlagsCount}</h4>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-indigo-950/50 border border-indigo-900/50 rounded-lg text-indigo-400">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Inactive Rules</p>
                        <h4 className="text-2xl font-bold text-slate-350 mt-1">{flags.length - activeFlagsCount}</h4>
                    </div>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search key or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 transition"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {loading && flags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-sm">Fetching feature flags...</p>
                </div>
            ) : error ? (
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-6 flex items-start gap-4 text-rose-200">
                    <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h5 className="font-semibold text-rose-300">Connection Error</h5>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                            onClick={fetchFlags}
                            className="bg-rose-900/50 hover:bg-rose-900/70 border border-rose-800 text-rose-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold mt-3 transition"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            ) : filteredFlags.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-sm">No feature flags match your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredFlags.map((flag) => (
                        <FlagCard key={flag._id} flag={flag} refreshFlags={fetchFlags} />
                    ))}
                </div>
            )}

            {/* Create Modal overlay */}
            <CreateFlagModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={fetchFlags}
            />
        </main>
    );
}
