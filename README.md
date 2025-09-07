# Web3大学 - 去中心化教育平台

一个基于区块链的去中心化教育平台，集成了课程创建、购买、DeFi 理财等功能。平台使用 YD 代币作为生态通证，结合 Aave 协议实现收益最大化。

## 🏗 项目架构

### Monorepo 结构
- `web/` - Next.js 15 前端应用 (wagmi + viem + RainbowKit)
- `contracts/` - Hardhat 智能合约 (YDToken, Courses, MockSwap)  
- `shared/` - 共享类型和工具库

### 技术栈
- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **区块链**: Ethereum, wagmi, viem, RainbowKit
- **合约**: Solidity 0.8.24, Hardhat, OpenZeppelin
- **DeFi**: Uniswap V2, Aave V3
- **数据库**: Supabase
- **开发工具**: Turbopack, pnpm

## 🚀 核心功能实现

### 1. 合约开发者部署平台YD代币 + 开发课程相关合约

#### 实现逻辑
平台基础设施由三个核心智能合约构成，实现代币经济和课程管理：

#### 核心代码
**YDToken.sol** - 平台生态代币
```solidity
contract YDToken is ERC20, Ownable {
    constructor(address owner_) ERC20("YD Token", "YD") Ownable(owner_) {
        _mint(owner_, 100000000 ether); // 初始发行1亿枚
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount); // 支持增发
    }
}
```

**Courses.sol** - 课程管理合约
```solidity
contract Courses is Ownable {
    struct Course {
        uint256 price;    // YD代币计价
        address author;   // 课程作者
        bool exists;
    }
    
    mapping(bytes32 => Course) public courses;
    mapping(bytes32 => mapping(address => bool)) public purchased;
    
    function createCourse(bytes32 id, uint256 price, address author) external {
        courses[id] = Course({price: price, author: author, exists: true});
        purchased[id][author] = true; // 作者自动拥有访问权
    }
    
    function buyCourse(bytes32 id) external {
        Course memory c = courses[id];
        uint256 fee = (c.price * feeBps) / 10000; // 平台手续费
        uint256 authorAmt = c.price - fee;
        
        yd.transferFrom(msg.sender, c.author, authorAmt);
        if (fee > 0) yd.transferFrom(msg.sender, feeRecipient, fee);
        purchased[id][msg.sender] = true;
    }
}
```

**部署脚本** - 自动化部署流程
```typescript
// contracts/scripts/deploy.ts
async function main() {
    const [deployer] = await ethers.getSigners();
    
    // 1. 部署YD代币
    const YDToken = await ethers.getContractFactory("YDToken");
    const ydToken = await YDToken.deploy(deployer.address);
    
    // 2. 部署课程合约
    const Courses = await ethers.getContractFactory("Courses");
    const courses = await Courses.deploy(
        ydToken.target,
        deployer.address,
        deployer.address, // 手续费接收者
        250 // 2.5%手续费
    );
    
    // 3. 部署模拟交换合约
    const MockSwap = await ethers.getContractFactory("MockSwap");
    const mockSwap = await MockSwap.deploy(ydToken.target);
    
    // 4. 为交换合约注入流动性
    await ydToken.transfer(mockSwap.target, ethers.parseEther("10000000"));
}
```

### 2. 创建课程作者创建课程制定课程价格

#### 实现逻辑
采用混合存储策略：链上记录价格和所有权，链下存储课程元数据。通过 UUID 生成课程ID，使用 keccak256 转换为 bytes32 用于链上存储。

#### 核心代码
**前端创建逻辑** (`web/app/author/new/page.tsx`)
```typescript
const create = async () => {
    const id = crypto.randomUUID(); // 生成唯一课程ID
    
    // 1. 保存元数据到数据库
    await supabase.from("courses").insert({ 
        id, title, summary, priceYD: price 
    });
    
    // 2. 链上创建课程记录
    const idHex = keccak256(stringToHex(id)) as `0x${string}`;
    await writeTx({
        address: addresses.Courses as `0x${string}`,
        abi: abis.Courses,
        functionName: "createCourse",
        args: [idHex, parseUnits(price, 18), address],
    });
};
```

**数据存储策略**
- **链上存储**: 课程ID(bytes32)、价格(uint256)、作者地址(address)、购买记录(mapping)
- **链下存储**: 课程标题、详细描述、课程内容、媒体资源
- **混合验证**: 前端通过链上数据验证购买权限，通过链下数据提供丰富内容

### 3. 购买课程并进行课程授权

#### 实现逻辑
实现双重授权机制：ERC20代币授权 + 课程购买确认。采用"Approve-Then-Buy"模式确保交易安全。

#### 核心代码
**购买按钮组件** (`web/components/buy-button.tsx`)
```typescript
export default function BuyButton({ id, priceYD }: { id: string; priceYD: string }) {
    const price = parseUnits(priceYD, 18);
    
    // 检查授权状态
    const { allowance, needsApproval } = useAllowance({
        token: addresses.YDToken as `0x${string}`,
        spender: addresses.Courses as `0x${string}`,
        amount: price,
    });
    
    const hasAllowance = useMemo(() => {
        if (allowance === undefined) return false;
        return allowance >= price;
    }, [allowance, price]);
    
    // 授权YD代币
    const approve = () => {
        writeContract({
            address: addresses.YDToken as `0x${string}`,
            abi: abis.YDToken,
            functionName: "approve",
            args: [addresses.Courses as `0x${string}`, price],
        });
    };
    
    // 购买课程
    const buy = () => {
        writeContract({
            address: addresses.Courses as `0x${string}`,
            abi: abis.Courses,
            functionName: "buyCourse",
            args: [keccak256(stringToHex(id))],
        });
    };
    
    return (
        <div className="flex gap-2">
            <Button onClick={approve} disabled={hasAllowance}>
                {hasAllowance ? "✓ 已授权" : "授权"}
            </Button>
            <Button onClick={buy} disabled={!hasAllowance}>
                购买课程
            </Button>
        </div>
    );
}
```

**购买流程监听**
```typescript
// 监听交易成功，刷新授权状态
useEffect(() => {
    if (receipt.isSuccess && hash) {
        if (lastActionRef.current === "approve") {
            setTimeout(() => allowanceQuery.refetch?.(), 1000);
        } else if (lastActionRef.current === "buy") {
            window.dispatchEvent(new CustomEvent("course:purchased", { detail: id }));
        }
    }
}, [receipt.isSuccess, hash]);
```

### 4. 创建课程作者将YD币兑换为ETH再兑换为USDT质押进AAVE进行理财

#### 实现逻辑
构建完整的 DeFi 理财链路：YD → ETH → USDT → Aave质押。通过模拟Uniswap V2进行代币兑换，集成Aave V3实现生息。

#### 核心代码
**代币兑换** (`web/components/swap-form.tsx`)
```typescript
// MockSwap合约实现固定汇率兑换
const MockSwap = {
    RATE: 4000, // 1 ETH = 4000 YD
    
    ethToYD: () => payable, // ETH购买YD
    ydToEth: (amount: uint256) => {
        require(yd.transferFrom(msg.sender, address(this), amount));
        uint256 ethOut = amount / RATE;
        payable(msg.sender).transfer(ethOut);
    }
};

// 前端兑换逻辑
const doSwap = async () => {
    if (direction === "ETH_TO_YD") {
        await writeTx({
            address: addresses.MockSwap,
            abi: abis.MockSwap,
            functionName: "ethToYD",
            value: parsedEth, // 直接发送ETH
        });
    } else {
        await writeTx({
            address: addresses.MockSwap,
            abi: abis.MockSwap, 
            functionName: "ydToEth",
            args: [parsedToken],
        });
    }
};
```

**Aave质押功能** (`web/components/stake/AaveSection.tsx`)
```typescript
// 质押到Aave协议
const handleSupply = async () => {
    // 1. 检查并授权代币
    if (needsApproval) {
        await approveAsync({
            address: currentTokenAddress as `0x${string}`,
            abi: ERC20Abi,
            functionName: "approve", 
            args: [pool as `0x${string}`, parsedToken],
        });
    }
    
    // 2. 存入Aave获得aToken
    await supplyAsync({
        address: pool as `0x${string}`,
        abi: AaveV3PoolAbi,
        functionName: "deposit",
        args: [
            currentTokenAddress as `0x${string}`, // 资产地址
            parsedToken,                          // 存入数量
            address as `0x${string}`,            // 接收者
            0,                                   // 推荐码
        ],
    });
};
```

**完整理财流程** (`web/components/stake-form.tsx`)
```typescript
// 集成兑换+质押的完整流程
export default function StakeForm() {
    // 1. ETH兑换为目标代币
    const swapEthForToken = async () => {
        await swapTx.writeTx({
            address: router as `0x${string}`,
            abi: UniswapV2RouterAbi,
            functionName: "swapExactETHForTokens",
            args: [0n, [weth, currentTokenAddress], address, deadline],
            value: parsedEth,
        });
    };
    
    // 2. 授权代币给Aave
    const approveToken = async () => {
        await approveTx.writeTx({
            address: currentTokenAddress as `0x${string}`,
            abi: ERC20Abi,
            functionName: "approve",
            args: [pool as `0x${string}`, parsedToken],
        });
    };
    
    // 3. 质押到Aave获得收益
    const supplyToken = async () => {
        await supplyTx.writeTx({
            address: pool as `0x${string}`,
            abi: AaveV3PoolAbi,
            functionName: "deposit",
            args: [currentTokenAddress, parsedToken, address, 0],
        });
    };
}
```

### 5. 用户个人中心通过MetaMask的签名机制实现名称修改+安全的获取已经购买的课程详情

#### 实现逻辑
采用 EIP-191 签名标准实现无Gas费的身份验证，通过消息签名证明地址所有权，确保数据安全性和用户隐私。

#### 核心代码
**签名验证机制** (`web/app/me/page.tsx`)
```typescript
// 生成标准化签名消息
const messageToSign = useMemo(() => {
    if (!address) return "";
    return `Web3大学\nAction: UpdateProfileName\nAddress: ${address}\nName: ${name}\nTimestamp: ${Math.floor(Date.now()/1000)}`;
}, [address, name]);

// 签名保存用户资料
const save = async () => {
    const signature = await signMessageAsync({ message: messageToSign });
    saveProfile(address, { name, message: messageToSign, signature });
};

// 签名获取已购课程
const signAndFetchOwned = async () => {
    const msg = `Web3大学\nAction: FetchOwnedCourses\nAddress: ${address}\nTimestamp: ${Math.floor(Date.now()/1000)}`;
    const signature = await signMessageAsync({ message: msg });
    
    const res = await fetch("/api/me/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, message: msg, signature }),
    });
    
    const json = await res.json();
    setOwnedCourses(json.owned || []);
};
```

**服务端签名验证** (`web/app/api/me/courses/route.ts`)
```typescript
export async function POST(req: Request) {
    const { address, message, signature } = await req.json();
    
    // 1. 验证消息格式和时效性
    if (!message.includes(`Address: ${address}`) || 
        !message.includes("Action: FetchOwnedCourses")) {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }
    
    // 2. 验证签名有效性  
    const isValid = await verifyMessage({
        message,
        signature,
        address: address as `0x${string}`,
    });
    
    if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    // 3. 安全查询用户已购课程
    const ownedCourses = await queryUserCourses(address);
    return NextResponse.json({ owned: ownedCourses });
}
```

**本地签名验证** (`web/app/me/page.tsx`)
```typescript
function VerifyBox({ address, profile }: { address: string; profile: ProfileRecord }) {
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
        <div>
            签名校验：{valid === null ? "校验中..." : valid ? "✅ 有效" : "❌ 无效"}
        </div>
    );
}
```

## 🔧 开发部署

### 环境准备
```bash
# 安装依赖
pnpm i

# 启动本地链
pnpm --filter @web3-university/contracts node

# 部署合约
pnpm --filter @web3-university/contracts deploy
pnpm --filter @web3-university/contracts export-abi

# 启动前端
pnpm --filter web dev
```

### 环境变量
```env
# web/.env.local
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🎯 核心特性

### 安全性
- ✅ ERC20标准代币授权机制
- ✅ 重放攻击防护（时间戳+nonce）
- ✅ 消息签名身份验证
- ✅ 合约所有权管理
- ✅ 前端交易状态监控

### 用户体验
- ✅ RainbowKit钱包连接
- ✅ 实时余额显示
- ✅ 交易状态跟踪
- ✅ 响应式UI设计
- ✅ 错误提示和加载状态

### DeFi集成  
- ✅ Uniswap V2兑换协议
- ✅ Aave V3质押收益
- ✅ 多代币支持(USDT/LINK/WBTC)
- ✅ 滑点保护机制
- ✅ Gas费用优化

### 经济模型
- 💰 平台手续费：2.5%
- 💰 YD代币汇率：1 ETH = 4000 YD
- 💰 理财年化收益：由Aave协议决定
- 💰 课程定价：作者自主设定

## 📈 项目亮点

1. **完整的Web3教育生态**：从课程创建到购买学习，再到收益理财的闭环
2. **混合存储架构**：链上确权+链下内容，兼顾去中心化和用户体验  
3. **DeFi深度集成**：无缝对接主流协议，实现收益最大化
4. **零Gas身份验证**：签名机制降低用户使用成本
5. **企业级代码质量**：TypeScript全栈，完善的错误处理和状态管理

---

*Built with ❤️ for the future of decentralized education*