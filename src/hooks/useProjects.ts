import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Project, ApiProjectAssignment } from '@/types/api'
import { toast } from 'sonner'

export function useProjectList() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project id is required')

      const { data: project, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (pErr) throw pErr

      const { data: assignments, error: aErr } = await supabase
        .from('api_project_assignments')
        .select(`
          id, api_entry_id, env_var_name, notes, created_at,
          api_entries:api_entry_id (id, name, provider, status, category)
        `)
        .eq('project_id', id)

      if (aErr) throw aErr

      // Get cost summary for this project
      const { data: usage, error: uErr } = await supabase
        .from('usage_records')
        .select('cost')
        .eq('project_id', id)

      if (uErr) throw uErr

      const totalCost = (usage ?? []).reduce((sum, r) => sum + Number(r.cost), 0)

      return {
        ...(project as Project),
        assignments: assignments ?? [],
        totalCost,
      }
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (project: Pick<Project, 'name' | 'description' | 'color'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created')
    },
    onError: (err: Error) => {
      toast.error(`Failed to create project: ${err.message}`)
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', data.id] })
      toast.success('Project updated')
    },
    onError: (err: Error) => {
      toast.error(`Failed to update project: ${err.message}`)
    },
  })
}

export function useAssignApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignment: Pick<ApiProjectAssignment, 'api_entry_id' | 'project_id' | 'env_var_name' | 'notes'>) => {
      const { data, error } = await supabase
        .from('api_project_assignments')
        .insert(assignment)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      toast.success('API assigned to project')
    },
    onError: (err: Error) => {
      toast.error(`Failed to assign API: ${err.message}`)
    },
  })
}

export function useUnassignApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, project_id, api_entry_id }: { id: string; project_id: string; api_entry_id: string }) => {
      const { error } = await supabase
        .from('api_project_assignments')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { project_id, api_entry_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      toast.success('API unassigned from project')
    },
    onError: (err: Error) => {
      toast.error(`Failed to unassign API: ${err.message}`)
    },
  })
}
