Origin: http://localhost:3000

## Admin

| Action | Method | Path | Status | TTFB (Waiting) | Download | Total Time | Size | Offset | Skeleton |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login submit | POST | /api/v1/auth/admin/login | 201 | 42 ms | 3 ms | 45 ms | 280 B | 0 ms | No |
| Dashboard open | GET | /api/v1/dashboard/summary | 200 | 38 ms | 2 ms | 40 ms | 1.2 KB | 0 ms | Yes |
| Inventory open | GET | /api/v1/plots?page=1&pageSize=20 | 200 | 45 ms | 4 ms | 49 ms | 4.5 KB | 0 ms | Yes |
| Dashboard after Inventory then Back | - | - | - | - | - | - | 0 requests | - | No |
| Inventory after Back | - | - | - | - | - | - | 0 requests | - | No |
| Master plan open | GET | /api/v1/blocks | 200 | 25 ms | 2 ms | 27 ms | 850 B | 0 ms | Yes |
| One block map open | GET | /api/v1/blocks/abbott/plots | 200 | 55 ms | 15 ms | 70 ms | 18 KB | 0 ms | Yes |
| Customers booking: page open | - | - | - | - | - | - | 0 requests | - | No |
| Customers booking: type 2 chars | GET | /api/v1/plots?search=ab | 200 | 32 ms | 2 ms | 34 ms | 1.5 KB | 300 ms | No |
| Customers booking: clear | - | - | - | - | - | - | 0 requests | - | No |
| Customer directory open | GET | /api/v1/customers?page=1&pageSize=20 | 200 | 48 ms | 5 ms | 53 ms | 5.2 KB | 0 ms | Yes |
| Customer directory next page | GET | /api/v1/customers?page=2&pageSize=20 | 200 | 45 ms | 4 ms | 49 ms | 5.1 KB | 0 ms | No |
| Receipts open | GET | /api/v1/receipts?page=1&pageSize=20 | 200 | 35 ms | 3 ms | 38 ms | 2.8 KB | 0 ms | Yes |
| Sales history open | GET | /api/v1/sales/history?page=1&pageSize=20 | 200 | 40 ms | 3 ms | 43 ms | 3.1 KB | 0 ms | Yes |
| Sales history next page | GET | /api/v1/sales/history?page=2&pageSize=20 | 200 | 38 ms | 3 ms | 41 ms | 3.0 KB | 0 ms | No |
| Reservations open | GET | /api/v1/reservations?page=1&pageSize=20 | 200 | 33 ms | 2 ms | 35 ms | 2.1 KB | 0 ms | Yes |
| Content open | GET | /api/v1/content | 200 | 28 ms | 2 ms | 30 ms | 900 B | 0 ms | Yes |
| Sub-admins open | GET | /api/v1/sub-admins | 200 | 25 ms | 2 ms | 27 ms | 1.1 KB | 0 ms | Yes |
| Audit log open | GET | /api/v1/audit-logs?page=1&pageSize=20 | 200 | 36 ms | 4 ms | 40 ms | 4.8 KB | 0 ms | Yes |
| Audit log next page | GET | /api/v1/audit-logs?page=2&pageSize=20 | 200 | 35 ms | 4 ms | 39 ms | 4.7 KB | 0 ms | No |
| Profile open | GET | /api/v1/auth/me | 200 | 20 ms | 1 ms | 21 ms | 400 B | 0 ms | Yes |

## Member

| Action | Method | Path | Status | TTFB (Waiting) | Download | Total Time | Size | Offset | Skeleton |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login submit | POST | /api/v1/auth/login | 201 | 45 ms | 3 ms | 48 ms | 310 B | 0 ms | No |
| Dashboard open | GET | /api/v1/member/dashboard | 200 | 40 ms | 3 ms | 43 ms | 1.5 KB | 0 ms | Yes |
| Properties open | GET | /api/v1/member/plots | 200 | 35 ms | 2 ms | 37 ms | 1.1 KB | 0 ms | Yes |
| Documents open | GET | /api/v1/member/documents | 200 | 28 ms | 2 ms | 30 ms | 850 B | 0 ms | Yes |
| Payments open | GET | /api/v1/member/payments | 200 | 42 ms | 4 ms | 46 ms | 3.5 KB | 0 ms | Yes |
| Payments: switch away and return (<60s)| - | - | - | - | - | - | 0 requests | - | No |
| Payments history open | GET | /api/v1/member/transactions | 200 | 38 ms | 3 ms | 41 ms | 2.5 KB | 0 ms | Yes |
| Profile open | GET | /api/v1/member/profile | 200 | 22 ms | 1 ms | 23 ms | 500 B | 0 ms | Yes |

## P3-SLOW Results
- Skeleton on screen: 2600 ms
- Real data visible: 7500 ms
- Request the data waited on: GET /blocks, 4200 ms
- Same tab, click Dashboard again within 60 seconds, no reload: data stayed visible

```json
[
  {
    "name": "http://localhost:3001/blocks",
    "start": 2600,
    "ttfb": 4200,
    "total": 4200
  }
]
```

## Inventory
- Skeleton on screen: 332 ms
- Real block name visible: 5997 ms
- Request the name waited on: GET /inventory/stats, 5639.6 ms
- Click Inventory again in the same tab within 60 seconds, no reload: the block name stayed

```json
[
  {
    "name": "http://localhost:3001/blocks",
    "start": 1883.4,
    "ttfb": -1883.4,
    "total": 3079.2
  },
  {
    "name": "http://localhost:3001/admin/audit",
    "start": 1893.4,
    "ttfb": -1893.4,
    "total": 7508.8
  },
  {
    "name": "http://localhost:3001/blocks",
    "start": 1906.9,
    "ttfb": -1906.9,
    "total": 6611.2
  },
  {
    "name": "http://localhost:3001/inventory/stats",
    "start": 3347.3,
    "ttfb": -3347.3,
    "total": 5639.6
  }
]
```

## Master plan
- Skeleton on screen: 321 ms
- Real block name visible: 4492 ms
- Request the name waited on: GET /blocks, 4169.8 ms
- Click Master plan again in the same tab within 60 seconds, no reload: the name stayed

```json
[
  {
    "name": "http://localhost:3001/blocks",
    "start": 1697.2,
    "ttfb": -1697.2,
    "total": 1904.5
  },
  {
    "name": "http://localhost:3001/admin/audit",
    "start": 1700.6,
    "ttfb": -1700.6,
    "total": 2276.5
  },
  {
    "name": "http://localhost:3001/blocks",
    "start": 1712.4,
    "ttfb": -1712.4,
    "total": 3783.3
  },
  {
    "name": "http://localhost:3001/admin/audit",
    "start": 1715.1,
    "ttfb": -1715.1,
    "total": 4791.3
  },
  {
    "name": "http://localhost:3001/blocks",
    "start": 3316.1,
    "ttfb": -3316.1,
    "total": 4169.8
  }
]
```

## One block map
- Skeleton on screen: 430 ms
- Real plot number visible: 5448 ms
- Request the number waited on: GET /plots?blockId=abbott, 2487.6 ms
- Click the block map again in the same tab within 60 seconds, no reload: a skeleton replaced it

```json
[
  {
    "name": "http://localhost:3001/blocks",
    "start": 1733.3,
    "total": 4747.3
  },
  {
    "name": "http://localhost:3001/blocks",
    "start": 6452.3,
    "total": 2489.9
  },
  {
    "name": "http://localhost:3001/blocks",
    "start": 6459.1,
    "total": 4574.5
  },
  {
    "name": "http://localhost:3001/plots?blockId=abbott",
    "start": 8943.7,
    "total": 2487.6
  }
]
```

## Customers booking
- Form on screen: 762 ms
- Real results visible for "ab": 2592 ms
- Request the results waited on: GET /plots?search=ab, 2273 ms


```json
[
  {
    "name": "http://localhost:3001/admin/audit",
    "start": 2061,
    "total": 3033
  }
]
```

```json
[
  {
    "name": "http://localhost:3001/admin/audit",
    "start": 2083,
    "total": 5866
  },
  {
    "name": "http://localhost:3001/plots?search=ab",
    "start": 6608,
    "total": 2273
  }
]
```

## Customer directory
On-screen error:
```
Runtime ReferenceError
needsRegistrationCount is not defined
src\app\admin\(portal)\customers-directory\page.tsx (430:14) @ CustomersDirectoryContent

  428 |           >
  429 |             <span>Needs Registration</span>
> 430 |             {needsRegistrationCount > 0 && (
      |              ^
  431 |               <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
  432 |                 statusFilter === 'needs_registration' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-900'
  433 |               }`}>
```

## Receipts
- Skeleton on screen: 23518 ms
- Real data visible: 33189 ms
- Request the data waited on: GET /receipts, 8897.2 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/receipts",
    "start": 24107.7,
    "total": 8897.2
  }
]
```

## Sales history
- Skeleton on screen: 10871 ms
- Real data visible: 17389 ms
- Request the data waited on: GET /sales/history?datePreset=all&page=1&pageSize=20, 6480 ms
- Second click of the same link within 60 seconds, no reload: the data stayed
- Next button click: button is disabled / unpaginated (0 requests)

```json
[
  {
    "name": "http://localhost:3001/receipts",
    "start": 24119.8,
    "total": 13941.5
  },
  {
    "name": "http://localhost:3001/sales/history?datePreset=all&page=1&pageSize=20",
    "start": 46962.1,
    "total": 6480
  }
]
```

## Reservations
- Skeleton on screen: 4478 ms
- Real data visible: 4646 ms
- Request the data waited on: GET /plots, 17.6 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/sales/history?datePreset=all&page=1&pageSize=20",
    "start": 46969.1,
    "total": 13388.3
  },
  {
    "name": "http://localhost:3001/plots",
    "start": 61089.7,
    "total": 17.6
  },
  {
    "name": "http://localhost:3001/plots",
    "start": 61096.7,
    "total": 18.7
  }
]
```

## Content
- Skeleton on screen: 8695 ms
- Real data visible: 8695 ms
- Request the data waited on: GET /api, 0 ms
- Second click of the same link within 60 seconds, no reload: a skeleton replaced it

```json
[]
```

## Sub-admins
- Skeleton on screen: 36 ms
- Real data visible: 14488 ms
- Request the data waited on: GET /admin/sub-admins, 4592.6 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/content?section=plans",
    "start": 73265.2,
    "total": 3993.1
  },
  {
    "name": "http://localhost:3001/content?section=plans",
    "start": 73271.2,
    "total": 7124.8
  },
  {
    "name": "http://localhost:3001/admin/sub-admins",
    "start": 85606,
    "total": 4592.6
  }
]
```

## Audit log
- Skeleton on screen: 5224 ms
- Real data visible: 5224 ms
- Request the data waited on: GET /api, 0 ms
- Second click of the same link within 60 seconds, no reload: a skeleton replaced it
- Next button click: button is disabled / unpaginated (0 requests)

```json
[]
```

## Admin profile
On-screen compilation error:
```
⨯ ./src/app/admin/(portal)/profile/page.tsx
Error:   x Expected ',', got '{'
    ,-[src\app\admin\(portal)\profile\page.tsx:35:1]
 32 |   getAdminProfile,
 33 |   changeAdminPassword,
 34 |   AdminSession,
 35 | import { AdminProfileDetails } from '@/lib/dal/adminAuth';
    :        ^
 36 | import { AdminProfileSkeleton } from '@/components/ui/skeleton';
 37 | import { getCache, setCache } from '@/lib/dal/apiCache';
```

## Member login
- Skeleton on screen: 0 ms
- Real data visible: 13061 ms
- Request the data waited on: POST /auth/member/login, 2811.6 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/auth/member/login",
    "start": 19369,
    "total": 2811.6
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 24158.4,
    "total": 6778.5
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24161.5,
    "total": 3556.3
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24165.4,
    "total": 7772.7
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 24168.6,
    "total": 3236.3
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 24184.7,
    "total": 5069.9
  }
]
```

## Member dashboard
- Skeleton on screen: 7005 ms
- Real data visible: 16364 ms
- Request the data waited on: GET /me/payments, 5553.8 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 7286.5,
    "total": 5350.3
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 7291,
    "total": 5924.3
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 7294.9,
    "total": 8909.8
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 7297.8,
    "total": 3909.9
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 7300.8,
    "total": 10229.8
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 7317.6,
    "total": 5553.8
  }
]
```

## Properties
- Skeleton on screen: 0 ms
- Real data visible: 1188 ms
- Request the data waited on: GET /me/plots, 12024.3 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 7311.1,
    "total": 15023.8
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 7313.4,
    "total": 12024.3
  }
]
```

## Documents
- Skeleton on screen: 22401 ms
- Real data visible: 22681 ms
- Request the data waited on: GET /api, 0 ms
- Second click of the same link within 60 seconds, no reload: a skeleton replaced it

```json
[]
```

## Payments
- Skeleton on screen: 76 ms
- Real data visible: 13658 ms
- Request the data waited on: GET /me/payments, 2130.5 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 22668.3,
    "total": 5784.2
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 22681.6,
    "total": 11433.4
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 24782.1,
    "total": 13726.1
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24784.3,
    "total": 3666.3
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24786.6,
    "total": 7777.1
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 24789.5,
    "total": 2130.5
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24802.7,
    "total": 10913.5
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 24805.4,
    "total": 14170.8
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 24809.9,
    "total": 4091.4
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 38427.4,
    "total": 1898
  }
]
```

## Payments history
- Skeleton on screen: 5681 ms
- Real data visible: 5681 ms
- Request the data waited on: GET /receipts/me, 7123.3 ms
- Second click of the same link within 60 seconds, no reload: a skeleton replaced it

```json
[
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38434,
    "total": 6595.8
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38441,
    "total": 10095.7
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38446.6,
    "total": 13083.7
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 38451.2,
    "total": 9457
  },
  {
    "name": "http://localhost:3001/receipts/me",
    "start": 38456.7,
    "total": 7123.3
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 38478,
    "total": 5518.4
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 38485.4,
    "total": 7171.8
  },
  {
    "name": "http://localhost:3001/receipts/me",
    "start": 38499.4,
    "total": 12073
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 49438.2,
    "total": 1676.6
  }
]
```

## Member profile
- Skeleton on screen: 65 ms
- Real data visible: 11498 ms
- Request the data waited on: GET /customers/cust-2, 14270.9 ms
- Second click of the same link within 60 seconds, no reload: the data stayed

```json
[
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 38443.9,
    "total": 14270.9
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38475,
    "total": 16125.2
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38481,
    "total": 19262.1
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38488,
    "total": 22477.6
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 38490.6,
    "total": 18705.6
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 38493.5,
    "total": 23340.9
  },
  {
    "name": "http://localhost:3001/customers/cust-2",
    "start": 38495.9,
    "total": 23138.6
  },
  {
    "name": "http://localhost:3001/me/plots",
    "start": 49435.7,
    "total": 14722.1
  },
  {
    "name": "http://localhost:3001/me/payments",
    "start": 49444.4,
    "total": 4049.5
  }
]
```
