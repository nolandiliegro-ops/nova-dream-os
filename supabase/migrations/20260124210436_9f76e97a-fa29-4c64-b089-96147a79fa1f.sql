-- Create indexes for performance optimization on missions and tasks
-- Index on missions.project_id for fast filtering by project
CREATE INDEX IF NOT EXISTS idx_missions_project_id ON public.missions(project_id);

-- Index on tasks.project_id for fast filtering by project  
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Index on tasks.mission_id for fast filtering by mission
CREATE INDEX IF NOT EXISTS idx_tasks_mission_id ON public.tasks(mission_id);

-- Index on tasks.status for fast filtering active tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Index on projects.mode for fast mode filtering
CREATE INDEX IF NOT EXISTS idx_projects_mode ON public.projects(mode);

-- Composite index for common query pattern: tasks by mission + status
CREATE INDEX IF NOT EXISTS idx_tasks_mission_status ON public.tasks(mission_id, status);