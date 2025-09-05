"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage, useBalance } from "wagmi";
import { verifyMessage } from "viem";
import { getProfile, saveProfile, type ProfileRecord } from "@/lib/profile";
import { addresses } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Label from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function MePage() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | undefined>();
  const { signMessageAsync } = useSignMessage();
  const ethBal = useBalance({ address, query: { enabled: !!address } });
  const ydBal = useBalance({
    address,
    token: addresses.YDToken as `0x${string}`,
    query: { enabled: !!address },
  });

  useEffect(() => {
    const p = getProfile(address);
    setProfile(p);
    if (p) setName(p.name);
  }, [address]);

  const messageToSign = useMemo(() => {
    if (!address) return "";
    return `Web3大学\nAction: UpdateProfileName\nAddress: ${address}\nName: ${name}\nTimestamp: ${Math.floor(Date.now()/1000)}`;
  }, [address, name]);

  const save = async () => {
    if (!address) return;
    const signature = (await signMessageAsync({
      message: messageToSign,
    })) as `0x${string}`;
    saveProfile(address, { name, message: messageToSign, signature });
    setProfile({ name, message: messageToSign, signature });
  };

  // Secure-owned courses via server verification + signature
  const [ownedCourses, setOwnedCourses] = useState<Array<{ id: string; title: string; summary: string; priceYD: string }>>([]);
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [ownedError, setOwnedError] = useState<string | null>(null);

  const signAndFetchOwned = async () => {
    if (!address) return;
    setLoadingOwned(true);
    setOwnedError(null);
    try {
      const msg = `Web3大学\nAction: FetchOwnedCourses\nAddress: ${address}\nTimestamp: ${Math.floor(Date.now()/1000)}`;
      const signature = (await signMessageAsync({ message: msg })) as `0x${string}`;
      const res = await fetch("/api/me/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, message: msg, signature }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "请求失败");
      setOwnedCourses(json.owned || []);
    } catch (e: any) {
      setOwnedError(e?.message || "请求失败");
    } finally {
      setLoadingOwned(false);
    }
  };

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
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-xs text-neutral-500 mb-1">ETH 余额</div>
              <div className="text-lg font-medium">
                {ethBal.data
                  ? `${Number(ethBal.data.formatted).toFixed(6)} ${
                      ethBal.data.symbol
                    }`
                  : "加载中..."}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-neutral-500 mb-1">YD 余额</div>
              <div className="text-lg font-medium">
                {ydBal.data
                  ? `${Number(ydBal.data.formatted).toFixed(6)} ${
                      ydBal.data.symbol
                    }`
                  : "加载中..."}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>昵称（签名保存）</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={save} disabled={!isConnected || !name}>
                签名保存
              </Button>
            </div>
          </div>
          {profile && <VerifyBox address={address!} profile={profile} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已购课程（签名验证）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isConnected && <div className="muted">请先连接钱包</div>}
          {isConnected && (
            <div className="flex gap-2 items-center">
              <Button size="sm" onClick={signAndFetchOwned} disabled={loadingOwned}>签名加载我的课程</Button>
              {loadingOwned && <span className="muted">加载中...</span>}
              {ownedError && <span className="text-red-600 text-xs">{ownedError}</span>}
            </div>
          )}
          {isConnected && ownedCourses.length === 0 && !loadingOwned && (
            <div className="muted">尚未购买任何课程，或尚未签名加载</div>
          )}
          {isConnected && ownedCourses.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <span>{c.title}</span>
              <a className="text-xs underline" href={`/course/${encodeURIComponent(c.id)}`}>查看课程</a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyBox({
  address,
  profile,
}: {
  address: string;
  profile: ProfileRecord;
}) {
  const [valid, setValid] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const ok = await verifyMessage({
          message: profile.message,
          signature: profile.signature,
          address,
        });
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

// 移除逐条 on-chain 校验，改为签名后由服务端返回已购课程
