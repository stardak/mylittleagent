/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface WorkspaceContextType {
    workspaceId: string | null;
    workspaceName: string | null;
    workspaceSlug: string | null;
    role: string | null;
    isLoading: boolean;
    setActiveWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
    workspaceId: null,
    workspaceName: null,
    workspaceSlug: null,
    role: null,
    isLoading: true,
    setActiveWorkspace: () => { },
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [workspaceName, setWorkspaceName] = useState<string | null>(null);
    const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            const s = session as any;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWorkspaceId(s.activeWorkspaceId ?? null);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWorkspaceName(s.activeWorkspaceName ?? null);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWorkspaceSlug(s.activeWorkspaceSlug ?? null);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRole(s.role ?? null);
        }
    }, [session]);

    const setActiveWorkspace = async (newWorkspaceId: string) => {
        // In future: persist the selection and reload workspace data
        setWorkspaceId(newWorkspaceId);
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspaceId,
                workspaceName,
                workspaceSlug,
                role,
                isLoading: status === "loading",
                setActiveWorkspace,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
