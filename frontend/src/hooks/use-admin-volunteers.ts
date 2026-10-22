import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelShift,
  createShift,
  listShifts,
  listVolunteers,
  recordAttendance,
  reviewAssignment,
  reviewVolunteer,
} from "../services/admin/volunteers-service"
import type { VolunteerStatus } from "../types/volunteer-types"

export function useVolunteers(filters: { status: VolunteerStatus | null; page: number }, enabled = true) {
  return useQuery({
    queryKey: ["volunteers", "list", filters],
    queryFn: () => listVolunteers(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useShifts(scope: "upcoming" | "past") {
  return useQuery({ queryKey: ["volunteers", "shifts", scope], queryFn: () => listShifts(scope) })
}

// Toda ação da coordenação muda a escala e as horas: tudo que começa com
// "volunteers" cai junto.
function useCoordinationMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["volunteers"] })
    },
  })
}

export function useReviewVolunteer() {
  return useCoordinationMutation(reviewVolunteer)
}

export function useCreateShift() {
  return useCoordinationMutation(createShift)
}

export function useCancelShift() {
  return useCoordinationMutation(cancelShift)
}

export function useReviewAssignment() {
  return useCoordinationMutation(reviewAssignment)
}

export function useRecordAttendance() {
  return useCoordinationMutation(recordAttendance)
}
