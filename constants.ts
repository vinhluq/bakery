
import { Product, Shift, CustomerDebt } from './types';

export const SHOP_INFO = {
  name: 'BINH MINH BAKERY',
  address: '608 Phan Chu Trinh, P. Hương Trà, Đà Nẵng',
  phone: '02353851573 - 0905422504',
  logo_url: '/logo.png'
};

export const BANK_INFO = {
  bankId: 'BIDV', // NH Đầu tư & Phát triển
  accountNo: '56210000599780', // Example account number
  accountName: 'LUONG THI THANH TAN',
  template: 'compact' // 'compact', 'compact2', 'qr_only', 'print'
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'SP001',
    name: 'Bánh Mì Pate Đặc Biệt',
    category: 'Bánh mì',
    price: 35000,
    stock: 50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbtEfOX5AXZw9R-sYv9OOSAZtW2-53i1BicPp1eWJj6DXK6COnNIOfOfpCrnUEIOR7ULrMDHayIulo_w7GkE0NlksvpQKYYmz37sjwPjkdVlReP967iPbC3VauHEQUYkRuv268Y5cZzezKOIQpKxcNZvhHGEvkhy_e4lBNLUWymQgOPqTTZS7Y6PpWKh097RgShfyNck2Sm4rDvVmGRuXKMUQXo9WILtW4AQrqeCzyqfSRoJZDKildpdC0QiYNiYHPP9wvl6PZ8Ao'
  },
  {
    id: 'SP012',
    name: 'Bánh Sừng Bò Trứng Muối',
    category: 'Bánh ngọt',
    price: 28000,
    stock: 4,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3IAUpFTeMH7twWEe6LKZ-QBoT0oCUxon6xIfGIMzP0Iyouje5kO4pVCYp8bH_d0vqQ71du9CYCr0xT1T_MuszHoXjN1irIJ6qNH8nwx9iMXsNBTc16562LYuFWRrzX1kfeCnNGL_BMV6NWXSzIBF8vmyHLBvDAAjAWAx812QhDguazPzhH8mh-4oFY36qUlie-SHQDcBJYz4ACezAewpaQfYoz2p6fT9HLGhe9EgqWN5Jq3gRjebj_xInCT-Kb0oADubf5HG_PRw'
  },
  {
    id: 'DU005',
    name: 'Cà Phê Sữa Đá Sài Gòn',
    category: 'Đồ uống',
    price: 22000,
    stock: 'unlimited',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbn59I59HZk-QhfbYACIUka60fHh2LqfJixJuVzm0xio52ziMmhwdm75_RzQZYdzhPo2wZ7peBFHHQtRnC-R_5tON3TamQ7MRTqo0I0ekGneYNYdv4ezqeivUMgfX-NP12Mi1wfSwXcRxOG0g35_eKycfjIMh8kDe8ALs3c-2rrd0mfBtUUpf1DuNjv9PFKFDtTgkzGdZgbH5gcTJyBKPROGiwTzZuaLiP4D-wDGReizoXA5xf6hPN5Lhp19-W-y4DoH0ZgXrDGzo'
  },
  {
    id: 'SP033',
    name: 'Bánh Kem Dâu Tây',
    category: 'Bánh ngọt',
    price: 45000,
    stock: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ-pUFxCwvyiHn8UJ1pnPxtj-3_OpwNS-J59V0smDutJlAOoNZtPBYADIFMcGDGD8wjM-B-MvHdUtKS7Q_Arw00qAvRPIx4-40wjXuQi5R4Yqq6TXTl10v8LdW8aGu6c5X9Pacit6AyBDcMCaVnahh6QrTfDwKqI22DBwkyn96QKwcXc3sk8I7POlqZS-NtiRkWkmH7YLFpwASQbwDgiQtXr5_yP0Hz5aaI4gW9d5JeCWKP_uA0qI0_uKz-5ja-Tn-PFIJnsYis48'
  },
  {
    id: 'SP051',
    name: 'Donut Socola Cốm',
    category: 'Bánh ngọt',
    price: 15000,
    stock: 0,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPXCHIZY2vzt3ue1JDipdmJ67pG_eZzU28Z4rHSeh4_hKS01ri3x32eVa8S6Ls0bhd5BBJSWWYZDWWIz5j-1BoWwRnSZMrtaA7U-KPChWPWOHm39G28ZjXkTBtYVRIL4zc5SDROAZ5UgeHZKPdNiBmltIZXcYc82jg3C9PAXpMzGNj3UYWRJToWoMOt18KeI1PcZVNcrDLOibsHvP5FV_AH6jYdKoSk8GO_zfyIT5sFNhvq5hhyNFCpv7fUDb6sME1X3R5QMXOnm4'
  }
];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: '1',
    name: 'Nguyễn Thị Mai',
    role: 'Quản lý cửa hàng',
    time: '06:00 - 14:00',
    status: 'active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfTlwAfRYyhhzeyHOgUrdI2RzPrqCcsIp2NBSuNhLBy1PhtyNEw42gH_cqnLkiSFFTxRM1ycfMS3moBGda6S2VotZEaD17cuPKc03Nq0DIb9Lb-Z-QDpgdv3Snpkq4-IXiq0lKgWsSMmBU3soKi4LBj8L5rSGc4QZRY8P9Gzg3zARAJza-njmvQS8YIna0IBD_VUrAGDTEu0iPlpt5Iy74QJfFKrPEhDseG7mtJ9OQJzdp3SdeJdhS9Uf9SyOvkxw_6iZlbRTZILs'
  },
  {
    id: '2',
    name: 'Trần Văn Hùng',
    role: 'Thợ làm bánh',
    time: '14:00 - 22:00',
    status: 'upcoming',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALlfiR5nsmwZ0belFgLIsHvH4dRlkiSHLvihKV_juqWNDcBed4VS40fb1kj1JNKuaNCghLZu6GkFYh6fgyYY0o4jBuvozmnQ2PfgTdRzH5UWi4o38H19lvMlroPH224FhyexyniOhsTwBSnLjcLtPpqTf4FHfnVXQicSHA_n1f9MqE8_1vSADqvGEtbvEkO0NQmwv37NXPtDc_GlCL0R4zLfw80bqnQTvEttM9KqvncsYLaJvwc70lBIAfrSQB6bT_RPD5F23k5ng'
  },
  {
    id: '3',
    name: 'Lê Minh Tuấn',
    role: 'Thu ngân',
    time: '06:00 - 12:00',
    status: 'completed',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXk3hTOQFa1-0oIm4Ge5JFjX_1lX-E2aAIVoM4G9nhB7CSAzaOT6r_nLjgpipa6bIZ7QVJrsac6C4AhOStbTkZsOk-Y-PWbU1M4hbmU5xCqqKBlxbWch7ZSG_VZY44fFPo5iK0btsJutFdKrKVAKLSauCY8U0MUJAxubuG1wHFARuUEsx2lygtVbM0BEDevYWzjPqj-sGSRWhjgagGoly-BfOIxemqJpwBkLck0SH2Gv-E1eIpu-h9yxqiOymC3YxaubXAak1oVXU'
  }
];

export const MOCK_DEBTS: CustomerDebt[] = [
  {
    id: '1',
    name: 'Nguyễn Thị Mai',
    phone: '0912 345 678',
    amount: 5200000,
    status: 'overdue',
    lastActivity: 'Quá hạn 2 ngày',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPZcypzrmuCExT9cHsiS56YvmGj-3oOBr6ta2sZIXvwou5tkQr6DyvIBxPG2HT2SzIKuE-uChPBb-RV05qI5w5AhfURrZjNW8CJw8vTwGeu7XDy1R3JjhCDJ6dsLPF5Psaxk2VeM8Hh1CxYm5kYv_8yYjffELdjNFRYXUF2SsI6eUEq1aY8XqOeWIPAEKVJQra2-aYnikIHSxhAX-LFZYd3p0ESYGH-Xe2q9pBNhTkZfMvJuhXcvTuO2F3_27CBvtiKwOFegenLYw'
  },
  {
    id: '2',
    name: 'Tiệm Bánh Hạnh Phúc',
    phone: '0987 654 321',
    amount: 1500000,
    status: 'pending',
    lastActivity: 'Lần cuối: Hôm qua',
    initials: 'T'
  },
  {
    id: '3',
    name: 'Anh Hùng (Cafe)',
    phone: '0909 888 777',
    amount: 350000,
    status: 'pending',
    lastActivity: 'Lần cuối: 3 ngày trước',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZvNEeku8cgHCjU5qHNiCuAmP35bAiK4oy_rGkwj5b1F43gK0jwQpynMWwpL1Kbnp617jHWJSDrDGPHtIr84clvhU5qMLfyA-UGF9EeqU9NR9bu6BGPFm0X2gs5GGdqZXKNzNZQ9KnqR9rfKU5bQzBhENTR7MVoeWWZK66sILwaVskkYJ3LsA4dUkg2XaBuHvM7guwjVTjlFELjH-CoEdEinwVSN_J3PwoR5HOHK4maYqDHOlmMjUPDyJ61oReOooTUrQkElTO4I8'
  },
  {
    id: '4',
    name: 'Khách lẻ - Anh Nam',
    phone: '0333 444 555',
    amount: 85000,
    status: 'pending',
    lastActivity: 'Lần cuối: 1 tuần trước',
    initials: 'K'
  },
  {
    id: '5',
    name: 'Chị Lan - Tạp Hóa',
    phone: '0123 456 789',
    amount: 0,
    status: 'paid',
    lastActivity: 'Đã thanh toán hết',
    initials: 'L'
  }
];
