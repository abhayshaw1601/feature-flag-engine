"use client";
import { useState, ChangeEvent } from "react";
import { FeatureFlag } from "../types";
import { ToggleLeft, ToggleRight, Sliders, ShieldCheck, Trash2, UserPlus } from "lucide-react";

interface FlagCardProps {
    flag: FeatureFlag;
    refreshFlags: () => void;
}

export default function FlagCard({ flag, refreshFlags }: FlagCardProps) {
    const [percentage, setPercentage] = useState(flag.rolloutPercentage);
    const [newWhitelistUser, setNewWhitelistUser] = useState("");
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Generic backend synchronization helper
    const updateFlagData = async (updatedFields: Partial<FeatureFlag>) => {
        try {
            await fetch(`http://localhost:5000/api/v1/flags/${flag.key}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...flag, ...updatedFields }),
            });
            refreshFlags();
        } catch (err) {
            console.error("Failed to update flag metadata:", err);
        }
    };

    const handleDeleteFlag = async () => {
        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => {
                setIsConfirmingDelete(false);
            }, 3000); // Auto-reset after 3 seconds
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/v1/flags/${flag.key}`, {
                method: "DELETE",
            });
            if (res.ok) {
                refreshFlags();
            } else {
                console.error("Failed to delete flag");
            }
        } catch (err) {
            console.error("Failed to delete flag:", err);
        }
    };

    const handleAddWhitelist = () => {
        if (!newWhitelistUser.trim()) return;
        if (flag.whitelistedUsers.includes(newWhitelistUser.trim())) return;

        const updatedWhitelist = [...flag.whitelistedUsers, newWhitelistUser.trim()];
        updateFlagData({ whitelistedUsers: updatedWhitelist });
        setNewWhitelistUser("");
    };

    const handleRemoveWhitelist = (userToRemove: string) => {
        const updatedWhitelist = flag.whitelistedUsers.filter((u: string) => u !== userToRemove);
        updateFlagData({ whitelistedUsers: updatedWhitelist });
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg transition hover:border-slate-600">
            {/* Top Meta Details Row */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="font-mono text-sm text-cyan-400 font-semibold bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-900">
                        {flag.key}
                    </span>
                    <p className="text-slate-400 text-sm mt-2">{flag.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Global Kill Switch Toggle */}
                    <button
                        onClick={() => updateFlagData({ isActive: !flag.isActive })}
                        className="focus:outline-none transition transform active:scale-95"
                    >
                        {flag.isActive ? (
                            <ToggleRight className="text-emerald-400 w-14 h-8" strokeWidth={1.5} />
                        ) : (
                            <ToggleLeft className="text-slate-500 w-14 h-8" strokeWidth={1.5} />
                        )}
                    </button>

                    {/* Delete Feature Flag Button */}
                    <button
                        id={`delete-btn-${flag.key}`}
                        onClick={handleDeleteFlag}
                        title={isConfirmingDelete ? "Click again to confirm delete" : "Delete Feature Flag"}
                        className={`flex items-center gap-1.5 p-2 rounded-lg transition transform active:scale-95 text-sm font-semibold ${
                            isConfirmingDelete
                                ? "bg-rose-950/80 text-rose-400 border border-rose-900"
                                : "text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
                        }`}
                    >
                        <Trash2 size={20} />
                        {isConfirmingDelete && <span className="text-xs">Confirm?</span>}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-5 pt-4 border-t border-slate-700">
                {/* Left Column: Rollout Percentage Slider */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                        <Sliders size={16} className="text-blue-400" />
                        <span>Progressive Traffic Rollout</span>
                        <span className="ml-auto text-blue-400 font-mono font-bold bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
                            {percentage}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPercentage(Number(e.target.value))}
                        onMouseUp={() => updateFlagData({ rolloutPercentage: percentage })}
                        onTouchEnd={() => updateFlagData({ rolloutPercentage: percentage })}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-500">Drag to change the bucket sample size dynamically.</p>
                </div>

                {/* Right Column: Whitelist Manager (Overrides) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>Explicit Target Whitelist</span>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter User ID (e.g., abhay_dev_01)"
                            value={newWhitelistUser}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewWhitelistUser(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 flex-1"
                        />
                        <button
                            onClick={handleAddWhitelist}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition text-sm flex items-center gap-1"
                        >
                            <UserPlus size={16} /> Add
                        </button>
                    </div>

                    {/* Render Active Whitelist Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {flag.whitelistedUsers.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">No whitelisted users configured.</span>
                        ) : (
                            flag.whitelistedUsers.map((user) => (
                                <span
                                    key={user}
                                    className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
                                >
                                    {user}
                                    <button
                                        onClick={() => handleRemoveWhitelist(user)}
                                        className="text-slate-500 hover:text-rose-400 transition"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}