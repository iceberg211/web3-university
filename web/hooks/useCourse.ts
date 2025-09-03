"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount, useReadContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { keccak256, stringToHex } from "viem";

export type CourseRecord = {
  id: string;
  title: string;
  summary: string;
  priceYD: string;
};

export function useCourse(id: string | undefined) {
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id,title,summary,priceYD")
          .eq("id", id)
          .maybeSingle();
        if (!mounted) return;
        if (error) throw error;
        setCourse((data as CourseRecord) ?? null);
      } catch (e) {
        if (!mounted) return;
        setError(e as Error);
        setCourse(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const refetch = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,summary,priceYD")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      setCourse((data as CourseRecord) ?? null);
    } catch (e) {
      setError(e as Error);
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { course, isLoading, error, refetch } as const;
}

export function useOwnedCourse(id: string | undefined) {
  const { address } = useAccount();
  const idHex = (id ? (keccak256(stringToHex(id)) as `0x${string}`) : undefined);
  const query = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "hasPurchased",
    args: [idHex!, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address && !!idHex },
  });
  return query;
}

