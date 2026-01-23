import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic import for Resend to avoid module resolution issues
const loadResend = async () => {
  const { Resend } = await import("https://esm.sh/resend@2.0.0");
  return Resend;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeadlineReminder {
  type: "project" | "task";
  id: string;
  name: string;
  deadline: string;
  userEmail: string;
  userName?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ResendClass = await loadResend();
    const resend = new ResendClass(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString().split("T")[0];
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString().split("T")[0];

    console.log(`Checking for deadlines on ${tomorrowStart}`);

    // Get all projects with deadlines in 24 hours
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, deadline, user_id, status")
      .eq("status", "active")
      .gte("deadline", tomorrowStart)
      .lte("deadline", tomorrowEnd);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      throw projectsError;
    }

    // Get all high-priority tasks with due dates in 24 hours
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, user_id, status, priority")
      .in("priority", ["high", "medium"])
      .neq("status", "completed")
      .gte("due_date", tomorrowStart)
      .lte("due_date", tomorrowEnd);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    console.log(`Found ${projects?.length || 0} projects and ${tasks?.length || 0} tasks with deadlines tomorrow`);

    // Collect all unique user IDs
    const userIds = new Set<string>();
    projects?.forEach((p) => userIds.add(p.user_id));
    tasks?.forEach((t) => userIds.add(t.user_id));

    if (userIds.size === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No deadlines in 24 hours", reminders_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profiles and emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", Array.from(userIds));

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Get user emails from auth
    const userEmails: Record<string, { email: string; name?: string }> = {};
    for (const userId of userIds) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (!userError && userData?.user?.email) {
        const profile = profiles?.find((p) => p.user_id === userId);
        userEmails[userId] = {
          email: userData.user.email,
          name: profile?.full_name || undefined,
        };
      }
    }

    // Group reminders by user
    const userReminders: Record<string, DeadlineReminder[]> = {};

    projects?.forEach((project) => {
      const userInfo = userEmails[project.user_id];
      if (userInfo) {
        if (!userReminders[project.user_id]) {
          userReminders[project.user_id] = [];
        }
        userReminders[project.user_id].push({
          type: "project",
          id: project.id,
          name: project.name,
          deadline: project.deadline,
          userEmail: userInfo.email,
          userName: userInfo.name,
        });
      }
    });

    tasks?.forEach((task) => {
      const userInfo = userEmails[task.user_id];
      if (userInfo) {
        if (!userReminders[task.user_id]) {
          userReminders[task.user_id] = [];
        }
        userReminders[task.user_id].push({
          type: "task",
          id: task.id,
          name: task.title,
          deadline: task.due_date,
          userEmail: userInfo.email,
          userName: userInfo.name,
        });
      }
    });

    // Send emails
    let emailsSent = 0;
    const errors: string[] = [];

    for (const [userId, reminders] of Object.entries(userReminders)) {
      const userInfo = userEmails[userId];
      if (!userInfo || reminders.length === 0) continue;

      const projectReminders = reminders.filter((r) => r.type === "project");
      const taskReminders = reminders.filter((r) => r.type === "task");

      const projectList = projectReminders
        .map((r) => `<li><strong>${r.name}</strong> - Deadline: ${new Date(r.deadline).toLocaleDateString("fr-FR")}</li>`)
        .join("");

      const taskList = taskReminders
        .map((r) => `<li><strong>${r.name}</strong> - Échéance: ${new Date(r.deadline).toLocaleDateString("fr-FR")}</li>`)
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #8B5CF6; margin-top: 20px; }
            ul { list-style-type: none; padding: 0; }
            li { background: white; padding: 12px 16px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #F97316; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
            .cta { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Rappel de Deadline</h1>
              <p>Nova Life OS a détecté des échéances dans les prochaines 24h</p>
            </div>
            <div class="content">
              <p>Bonjour${userInfo.name ? ` ${userInfo.name}` : ""} !</p>
              
              ${projectReminders.length > 0 ? `
                <h2>🎯 Projets (${projectReminders.length})</h2>
                <ul>${projectList}</ul>
              ` : ""}
              
              ${taskReminders.length > 0 ? `
                <h2>📋 Tâches prioritaires (${taskReminders.length})</h2>
                <ul>${taskList}</ul>
              ` : ""}
              
              <p>Reste focalisé sur tes objectifs et termine ces tâches à temps !</p>
              
              <div class="footer">
                <p>Nova Life OS - Ton copilote vers le succès 🚀</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Nova Life OS <onboarding@resend.dev>",
          to: [userInfo.email],
          subject: `⏰ ${reminders.length} deadline${reminders.length > 1 ? "s" : ""} dans 24h - Nova Life OS`,
          html,
        });

        if (emailError) {
          console.error(`Error sending email to ${userInfo.email}:`, emailError);
          errors.push(`Failed to send to ${userInfo.email}: ${emailError.message}`);
        } else {
          emailsSent++;
          console.log(`Reminder sent to ${userInfo.email} for ${reminders.length} items`);
        }
      } catch (sendError) {
        console.error(`Exception sending email to ${userInfo.email}:`, sendError);
        errors.push(`Exception for ${userInfo.email}: ${String(sendError)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: emailsSent,
        total_projects: projects?.length || 0,
        total_tasks: tasks?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-deadline-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
