import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,summary,priceYD,created_at")
    .order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json(
    (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      priceYD: r.priceYD,
      createdAt: r.created_at,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("Invalid JSON", { status: 400 });

  const { id, title, summary, priceYD } = body as {
    id?: string;
    title?: string;
    summary?: string;
    priceYD?: string;
  };

  if (!id || !title || !summary || !priceYD)
    return new Response("Missing fields", { status: 400 });

  const { data, error } = await supabase
    .from("courses")
    .insert([{ id, title, summary, priceYD }])
    .select()
    .single();
  if (error) return new Response(error.message, { status: 500 });
  return Response.json(
    {
      id: data.id,
      title: data.title,
      summary: data.summary,
      priceYD: data.priceYD,
      createdAt: data.created_at,
    },
    { status: 201 }
  );
}
