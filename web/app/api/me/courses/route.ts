import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, keccak256, stringToHex } from "viem";
import { sepolia } from "viem/chains";
import { verifySignedAction } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import abis from "@/contracts/abis.json" assert { type: "json" };
import addrs from "@/contracts/11155111.json" assert { type: "json" };

const COURSES_ABI = (abis as any).Courses as any[];
const ADDRS = (addrs as any).addresses as Record<string, string>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = body.address as `0x${string}`;
    const message = body.message as string;
    const signature = body.signature as `0x${string}`;
    if (!address || !message || !signature) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

    const ver = await verifySignedAction({ address, message, signature }, "FetchOwnedCourses");
    if (!ver.ok) return NextResponse.json({ error: ver.error }, { status: 401 });

    // Fetch all courses from DB
    const { data, error } = await supabase.from("courses").select("id,title,summary,priceYD");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const courses = (data || []) as { id: string; title: string; summary: string; priceYD: string }[];

    // On-chain filter by ownership (viem public client)
    const rpcUrl = process.env.VITE_RP_SEPOLIA_RPC_URL; // require explicit Sepolia RPC
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC_URL_NOT_CONFIGURED: set VITE_RP_SEPOLIA_RPC_URL in web/.env.local" }, { status: 500 });
    }
    if (/localhost|127\.0\.0\.1/i.test(rpcUrl)) {
      return NextResponse.json({ error: "RPC_URL_LOCAL_UNSUPPORTED: use a public Sepolia RPC endpoint" }, { status: 500 });
    }
    const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
    const contract = { address: ADDRS.Courses as `0x${string}`, abi: COURSES_ABI } as const;

    const owned: typeof courses = [];
    for (const c of courses) {
      const idHex = keccak256(stringToHex(c.id)) as `0x${string}`;
      const has = await client.readContract({ ...contract, functionName: "hasPurchased", args: [idHex, address] });
      if (has) owned.push(c);
    }

    return NextResponse.json({ owned });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "INTERNAL_ERROR" }, { status: 500 });
  }
}
