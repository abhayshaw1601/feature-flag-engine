"use client";
import React, { useState, ChangeEvent } from "react";
import { X } from "lucide-react";

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateFlagModal({ isOpen, onClose, onCreated }: CreateModalProps) {
    const [key, setKey] = useState("");
    const [description, setDescription] = useState("");
    const [countryRule, setCountryRule] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) return;

        // Package basic properties along with optional segment rules matching our Phase 1 model
        const payload = {
            key: key.trim().toLowerCase().replace(/\s+/g, "-"),
            description: description.trim(),
            isActive: false,
            rolloutPercentage: 0,
            whitelistedUsers: [],
            rules: countryRule.trim()
                ? [{ attribute: "country", operator: "EQUALS", value: countryRule.trim().toUpperCase() }]
                : [],
        };

        try {
            const res = await fetch("http://localhost:5000/api/v1/flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setKey("");
                setDescription("");
                setCountryRule("");
                onCreated();
                onClose();
            }
        } catch (err) {
            console.error("Error committing new flag:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-100 mb-4">Register Feature Flag</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Flag Identifier Key</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., new-instagram-reels-ui"
                            value={key}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description Context</label>
                        <textarea
                            placeholder="Describe the operational impact or target team..."
                            value={description}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Country Rule (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g., IN, US, CA"
                            value={countryRule}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setCountryRule(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition mt-2 shadow-md shadow-blue-900/20"
                    >
                        Deploy Rule Schema
                    </button>
                </form>
            </div>
        </div>
    );
}