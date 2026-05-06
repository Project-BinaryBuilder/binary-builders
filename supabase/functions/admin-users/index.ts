// Super Admin user management: create, update, reset password, delete.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const DOMAIN = "binary.local";
const studentEmail = (u: string, g: number) => `s${g}.${u.toLowerCase()}@${DOMAIN}`;
const teacherEmail = (u: string, mn: number, mx: number) => `t${mn}-${mx}.${u.toLowerCase()}@${DOMAIN}`;

interface Body {
  action: "create" | "update" | "reset_password" | "delete";
  // create
  role?: "student" | "teacher";
  username?: string;
  full_name?: string;
  password?: string;
  class_grade?: number;
  class_range_min?: number;
  class_range_max?: number;
  // update / reset / delete
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (roleRow?.role !== "super_admin") return json({ error: "Forbidden" }, 403);

    const body: Body = await req.json();

    if (body.action === "create") {
      const { role, username, full_name, password } = body;
      if (!role || !username || !password) return json({ error: "Missing fields" }, 400);
      let email = "";
      const meta: Record<string, unknown> = { username, full_name, role };
      if (role === "student") {
        if (!body.class_grade) return json({ error: "class_grade required" }, 400);
        email = studentEmail(username, body.class_grade);
        meta.class_grade = body.class_grade;
      } else {
        if (!body.class_range_min || !body.class_range_max) return json({ error: "range required" }, 400);
        email = teacherEmail(username, body.class_range_min, body.class_range_max);
        meta.class_range_min = body.class_range_min;
        meta.class_range_max = body.class_range_max;
      }
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: meta,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (body.action === "reset_password") {
      if (!body.user_id || !body.password) return json({ error: "Missing fields" }, 400);
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: body.password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (body.action === "update") {
      if (!body.user_id) return json({ error: "user_id required" }, 400);
      const updates: Record<string, unknown> = {};
      if (body.full_name !== undefined) updates.full_name = body.full_name;
      if (body.class_grade !== undefined) updates.class_grade = body.class_grade;
      if (body.class_range_min !== undefined) updates.class_range_min = body.class_range_min;
      if (body.class_range_max !== undefined) updates.class_range_max = body.class_range_max;
      const { error } = await admin.from("profiles").update(updates).eq("id", body.user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (body.action === "delete") {
      if (!body.user_id) return json({ error: "user_id required" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
