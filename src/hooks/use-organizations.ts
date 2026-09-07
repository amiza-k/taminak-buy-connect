import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type MembershipWithOrg = {
  id: string;
  role: string;
  organization_id: string;
  organizations: {
    id: string;
    name: string;
    type: string;
    province: string | null;
    city: string | null;
    supplier_status: string | null;
        phone_verified: boolean;
    email_verified: boolean;
    phone: string | null;
    email: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export function useMyMemberships() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["memberships", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<MembershipWithOrg[]> => {
      const { data, error } = await supabase
        .from("memberships")
        .select(
          "id, role, organization_id, organizations ( id, name, type, province, city, supplier_status, phone_verified, email_verified, phone, email, address, latitude, longitude )",
        )
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as MembershipWithOrg[];
    },
  });
}

export function useMyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, phone, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** The supplier organization the current user belongs to, if any. */
export function useSupplierOrganization() {
  const { data: memberships, isPending } = useMyMemberships();
  const organization = useMemo(
    () =>
      (memberships ?? []).find((m) => m.organizations?.type === "supplier")?.organizations ?? null,
    [memberships],
  );
  return { organization, isPending };
}