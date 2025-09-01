import { supabase } from "@/lib/supabase";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,summary,priceYD,created_at")
    .eq("id", params.id)
    .single();
  if (error && error.code !== "PGRST116") return new Response(error.message, { status: 500 });
  if (!data) return new Response("Not found", { status: 404 });
  return Response.json({
    id: data.id,
    title: data.title,
    summary: data.summary,
    priceYD: data.priceYD,
    createdAt: data.created_at,
  });
}
