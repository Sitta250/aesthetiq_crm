-- Open-task queue: WHERE done = false ORDER BY dueAt
CREATE INDEX "Task_done_dueAt_idx" ON "Task"("done", "dueAt");
