export type CourseMeta = {
  id: string;
  title: string;
  summary: string;
  priceYD: bigint; // in YD smallest unit (18 decimals)
  author?: string; // eth address
};

export type PurchaseRecord = {
  courseId: string;
  buyer: string;
  priceYD: bigint;
  txHash?: string;
};

