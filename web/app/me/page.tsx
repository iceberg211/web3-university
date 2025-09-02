"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage, useReadContract } from "wagmi";
import { verifyMessage, stringToHex, keccak256 } from "viem";
import { getProfile, saveProfile, type ProfileRecord } from "@/lib/profile";
import { loadCourses } from "@/lib/storage";
import { addresses, abis } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function MePage() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | undefined>();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const p = getProfile(address);
    setProfile(p);
    if (p) setName(p.name);
  }, [address]);

  const messageToSign = useMemo(() => {
    if (!address) return "";
    return `Web3大学\nAction: UpdateProfileName\nAddress: ${address}\nName: ${name}`;
  }, [address, name]);

  const save = async () => {
    if (!address) return;
    const signature = (await signMessageAsync({ message: messageToSign })) as `0x${string}`;
    saveProfile(address, { name, message: messageToSign, signature });
    setProfile({ name, message: messageToSign, signature });
  };

  // Purchased courses (client-side filter from local list + on-chain check)
  const courses = loadCourses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <div>地址：{isConnected ? address : "未连接"}</div>
            {profile && (
              <div className="text-xs text-neutral-500">
                已签名保存的名称会在本地校验签名。
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>昵称（签名保存）</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={save} disabled={!isConnected || !name}>签名保存</Button>
            </div>
          </div>
          {profile && (
            <VerifyBox address={address!} profile={profile} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已购课程</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isConnected && <div className="muted">请先连接钱包</div>}
          {isConnected && courses.length === 0 && (
            <div className="muted">暂无课程</div>
          )}
          {isConnected && courses.map((c) => (
            <OwnedRow key={c.id} id={c.id} title={c.title} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyBox({ address, profile }: { address: string; profile: ProfileRecord }) {
  const [valid, setValid] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const ok = await verifyMessage({ message: profile.message, signature: profile.signature, address });
        setValid(ok);
      } catch {
        setValid(false);
      }
    })();
  }, [address, profile]);
  return (
    <div className="text-sm">
      <span>签名校验：</span>
      {valid === null ? "校验中..." : valid ? "有效" : "无效"}
    </div>
  );
}

function OwnedRow({ id, title }: { id: string; title: string }) {
  const { address } = useAccount();
  const idHex = keccak256(stringToHex(id)) as `0x${string}`;
  const has = useReadContract({
    address: addresses.Courses as `0x${string}`,
    abi: abis.Courses,
    functionName: "hasPurchased",
    args: [idHex, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });
  if (!address) return null;
  if (has.data) {
    return <div className="flex items-center justify-between"><span>{title}</span><span className="text-xs text-neutral-500">已购买</span></div>;
  }
  return null;
}
