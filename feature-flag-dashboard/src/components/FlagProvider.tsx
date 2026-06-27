"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Types for user evaluation context matching our backend structure
interface UserContext {
    country?: string;
    [key: string]: string | undefined;
}

interface FlagContextType {
    flags: Record<string, boolean>;
    loading: boolean;
    evaluateFlags: (userId: string, context: UserContext) => Promise<void>;
}

const FlagContext = createContext<FlagContextType | undefined>(undefined);

export function FlagProvider({ children }: { children: React.ReactNode }) {
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; ctx: UserContext } | null>(null);

    // 1. Initial Batch Evaluation Function
    const evaluateFlags = async (userId: string, context: UserContext) => {
        try {
            setCurrentUser({ id: userId, ctx: context });
            const res = await fetch("http://localhost:5000/api/v1/flags/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, context }),
            });
            const data = await res.json();
            setFlags(data.flags || {});
        } catch (err) {
            console.error("SDK Evaluation failed:", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Real-time Pub/Sub Stream Listener via Server-Sent Events (SSE)
    useEffect(() => {
        console.log("🔌 Initializing Real-time Flag Streaming Listener...");
        const eventSource = new EventSource("http://localhost:5000/api/v1/flags/stream");

        eventSource.onmessage = (event) => {
            try {
                const updatedFlag = JSON.parse(event.data);
                console.log("📢 Live Flag Update Stream Received:", updatedFlag);

                if (updatedFlag.deleted) {
                    setFlags((prev) => {
                        const newFlags = { ...prev };
                        delete newFlags[updatedFlag.key];
                        return newFlags;
                    });
                    return;
                }

                // If the user context hasn't been initialized yet, skip live computations
                if (!currentUser) return;

                // Re-run standard targeting rule checks locally for immediate UI reactivity
                let passesRules = true;
                if (updatedFlag.isActive) {
                    for (const rule of updatedFlag.rules) {
                        const userValue = currentUser.ctx[rule.attribute];
                        if (rule.operator === "EQUALS" && userValue !== rule.value) passesRules = false;
                        if (rule.operator === "NOT_EQUALS" && userValue === rule.value) passesRules = false;
                    }
                } else {
                    passesRules = false; // Flag is globally disabled by kill-switch
                }

                // Check explicit target whitelist bypass rules
                const isWhitelisted = updatedFlag.whitelistedUsers?.includes(currentUser.id);

                let finalValue = false;
                if (isWhitelisted) {
                    finalValue = true;
                } else if (passesRules) {
                    // Check percentage threshold allocation locally using our exact same base MD5 formula
                    const crypto = require("crypto"); // Next.js Polyfills this in the browser bundle
                    const hashInput = `${currentUser.id}:${updatedFlag.key}`;
                    const hashHex = crypto.createHash("md5").update(hashInput).digest("hex");
                    const hashInt = parseInt(hashHex.substring(0, 8), 16);
                    const userScore = hashInt % 100;

                    finalValue = userScore < updatedFlag.rolloutPercentage;
                }

                // Dynamically patch the local state without forcing a complete HTTP request cycle
                setFlags((prev) => ({
                    ...prev,
                    [updatedFlag.key]: finalValue,
                }));
            } catch (err) {
                console.error("Error patching incoming configuration stream:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Connection broken. Attempting reconnection...", err);
        };

        return () => {
            eventSource.close();
            console.log("❌ Closed active flag stream pipeline.");
        };
    }, [currentUser]);

    return (
        <FlagContext.Provider value={{ flags, loading, evaluateFlags }}>
            {children}
        </FlagContext.Provider>
    );
}

// Custom hook to consume values anywhere inside components easily
export function useFlags() {
    const context = useContext(FlagContext);
    if (!context) throw new Error("useFlags must be executed inside a FlagProvider wrapper");
    return context;
}