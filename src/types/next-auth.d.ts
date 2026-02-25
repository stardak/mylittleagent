import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
        activeWorkspaceId?: string;
        activeWorkspaceName?: string;
        activeWorkspaceSlug?: string;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
    }
}
