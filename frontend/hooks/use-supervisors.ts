"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SupervisorCreateInput } from "@/lib/types";

export const SUPERVISORS_KEY = ["supervisors"] as const;

export function useSupervisors() {
  return useQuery({
    queryKey: SUPERVISORS_KEY,
    queryFn: api.supervisors.list,
  });
}

export function useSupervisor(id: string | undefined) {
  return useQuery({
    queryKey: ["supervisor", id],
    queryFn: () => api.supervisors.get(id as string),
    enabled: !!id,
  });
}

export function useCreateSupervisor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupervisorCreateInput) => api.supervisors.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERVISORS_KEY }),
  });
}