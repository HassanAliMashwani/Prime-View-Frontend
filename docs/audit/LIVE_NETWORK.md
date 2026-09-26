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
