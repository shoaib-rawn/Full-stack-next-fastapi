# LedgerLite Skill-Wise Interview Master Guide

Ye LedgerLite ki **single interview revision file** hai. Is mein sirf woh skills aur patterns hain jo project ke actual code mein use huye hain. Har skill ke andar multiple interview questions hain.

## Har jawab ka formula

Interview mein har skill ko is order mein explain karein:

1. **Define:** Ye cheez kya hai?
2. **Problem:** App mein is ke baghair kya masla tha?
3. **LedgerLite solution:** Humne kahan aur kaise use ki?
4. **Code:** Actual implementation ka chhota relevant hissa.
5. **Benefits:** Is design se kya faida mila?
6. **Note:** Limitation, trade-off ya honest boundary.

Code ratta nahi karna. Har snippet ki request journey aur decision samajhna hai.

---

## Complete skill index

| # | Skill | Project status |
|---:|---|---|
| 1 | Python typing and async/await | Implemented |
| 2 | FastAPI application and APIRouter | Implemented |
| 3 | Dependency Injection | Implemented |
| 4 | Pydantic v2 DTO validation | Implemented |
| 5 | Pydantic Settings and environment config | Implemented |
| 6 | REST, HTTP status codes and error contracts | Implemented |
| 7 | OpenAPI and Swagger UI | Implemented |
| 8 | PostgreSQL 16 | Implemented |
| 9 | SQLAlchemy 2 async ORM and asyncpg | Implemented |
| 10 | Relational models, keys and ORM relationships | Implemented |
| 11 | Constraints and indexes | Implemented |
| 12 | Alembic migrations | Implemented |
| 13 | Transactions, rollback and row locking | Implemented |
| 14 | Decimal accounting and service logic | Implemented |
| 15 | Search and pagination | Implemented |
| 16 | Multi-tenant isolation | Implemented |
| 17 | Argon2 password hashing | Implemented |
| 18 | JWT access and refresh tokens | Implemented |
| 19 | Refresh rotation, reuse detection and logout-all | Implemented |
| 20 | Redis rate limiting and token revocation | Implemented |
| 21 | RBAC, member management and organization settings | Implemented end-to-end |
| 22 | Health checks and lifespan cleanup | Implemented |
| 23 | CORS, SameSite cookies and BFF boundary | Implemented; dedicated CSRF token pending |
| 24 | Structured logging and Request ID | Implemented |
| 25 | Pytest, HTTPX and integration testing | Backend implemented; frontend tests pending |
| 26 | Docker Compose, volumes and health checks | PostgreSQL/Redis implemented; app images pending |
| 27 | TypeScript and API contracts | Implemented |
| 28 | Next.js 16 App Router | Implemented |
| 29 | Server/Client Components and Suspense | Implemented |
| 30 | Next.js Route Handlers as BFF | Implemented |
| 31 | HttpOnly sessions, Next Proxy and idle guard | Implemented |
| 32 | React Hook Form and Zod | Implemented |
| 33 | TanStack Query | Implemented |
| 34 | Dynamic routes and complete CRUD UI states | Implemented |
| 35 | Tailwind CSS, responsive UX and accessibility | Implemented |
| 36 | Customer CRUD workflow | Implemented |
| 37 | Invoice lifecycle and automatic numbering | Implemented |
| 38 | Payments, overpayment protection and reversal | Implemented |
| 39 | Learning-mode request visualization | Implemented |
| 40 | Typecheck, ESLint, Turbopack and production build | Implemented |
| 41 | Metadata and basic SEO | Basic implemented; full SEO pending |
| 42 | React 19, JSX, components, props, state and hooks | Implemented |
| 43 | Installed vs actually implemented skills | Honest boundary documented |
| 44 | Axios typed client, interceptors and refresh retry | Implemented |
| 45 | Reporting aggregates, invoice filters and Chart.js | Implemented end-to-end |

---

# Part A — Backend foundation

## Skill 1 — Python typing and asynchronous programming

### Define

Python type hints data ka expected type document karti hain. `async def` coroutine banata hai aur `await` I/O operation complete hone tak control event loop ko de deta hai.

### Problem

Database aur Redis network I/O hain. Synchronous waiting har request worker ko block kar sakti thi. Untyped payloads se wrong values aur unclear function contracts ka risk tha.

### LedgerLite solution

Routes, services aur dependencies typed async functions hain. Database calls `await` hoti hain aur return types explicitly likhe hain.

### Code

```python
async def get_customer(
    customer_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> CustomerResponse:
    customer = await session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return customer
```

### Benefits

- I/O wait ke dauran server doosri requests handle kar sakta hai.
- IDE aur type checker ko contracts samajh aate hain.
- Route ka input aur output review karna asaan hota hai.

### Note

Async CPU-heavy work ko automatically fast nahi karta. JavaScript mein Promise kaha jata hai; Python mein coroutine/awaitable terminology use hoti hai.

### Interview questions

**Q1. `async def` kya return karta hai?**  
Call karne par coroutine object return hota hai. Result lene ke liye aam tor par `await` chahiye.

**Q2. Database call par `await` kyun lagaya?**  
Database response network I/O hai. `await` completion leta hai aur wait ke dauran event loop ko doosra kaam karne deta hai.

**Q3. Har function async hona chahiye?**  
Nahi. Pure calculations, jaise Decimal totals, normal synchronous functions reh sakte hain. Async un operations ke liye useful hai jo I/O wait karti hain.

**Q4. Type hint runtime validation karti hai?**  
Normal Python type hint khud runtime validation nahi karti. API boundary par Pydantic actual runtime validation karta hai.

---

## Skill 2 — FastAPI application and APIRouter

### Define

FastAPI Python ASGI framework hai. `FastAPI()` main application object hai; `APIRouter` related endpoints ko resource-wise group karta hai.

### Problem

Saare endpoints `main.py` mein rakhne se file badi, mixed aur difficult to maintain hoti. Customers, invoices, auth aur payments ke concerns separate karne thay.

### LedgerLite solution

Har domain ka router alag file mein hai aur `main.py` un routers ko application ke saath register karta hai.

### Code

```python
# app/api/routes/customers.py
router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=Page[CustomerResponse])
async def list_customers(...):
    ...

# app/main.py
app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(customers_router)
app.include_router(invoices_router)
app.include_router(payments_router)
```

### Benefits

- Separation of concerns.
- Swagger mein endpoints domain-wise grouped.
- Features locate, test aur extend karna asaan.

### Note

Route HTTP concern handle karti hai. Reusable business calculations `services/` mein rehni chahiye.

### Interview questions

**Q1. `FastAPI()` aur `APIRouter()` mein difference?**  
`FastAPI()` poori ASGI application hai. `APIRouter()` endpoints ka modular collection hai jo main app mein include hota hai.

**Q2. Router prefix aur tag kya karte hain?**  
Prefix common URL part deta hai, jaise `/customers`; tag Swagger UI mein related endpoints ka group banata hai.

**Q3. Uvicorn command `uvicorn app.main:app` ka matlab?**  
Pehla `app` Python package, `main` module/file aur aakhri `app` us file ka FastAPI object hai.

**Q4. Route aur service mein logic kaise divide karte hain?**  
Route request validate, authorization check aur HTTP response banati hai. Reusable domain rule service function mein rakha jata hai.

---

## Skill 3 — FastAPI Dependency Injection

### Define

Dependency Injection mein route apni required dependency declare karti hai; FastAPI us dependency ko create/resolve karke function ko deta hai.

### Problem

Agar har route session, current user, Redis client aur role check khud banaye to duplicated code, inconsistent security aur difficult testing hoti.

### LedgerLite solution

`Depends()` se database session, authenticated user, owner guard, pagination aur Redis client inject hote hain.

### Code

```python
async def create_customer(
    payload: CustomerCreate,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_db_session),
) -> CustomerResponse:
    customer = Customer(
        organization_id=current_user.organization_id,
        **payload.model_dump(),
    )
```

```python
async def require_owner(
    current_user: CurrentUser,
) -> CurrentUser:
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required.")
    return current_user
```

### Benefits

- DRY security and setup.
- Centralized authentication behavior.
- Tests mein dependencies override ki ja sakti hain.
- Route signatures self-documenting hoti hain.

### Note

Dependency ka order security chain banata hai: token decode, Redis revocation check, DB user reload, active/version check, phir role guard.

### Interview questions

**Q1. Dependency Injection ka main purpose?**  
Route ko dependency banane ki implementation se separate karna aur reuse/testability improve karna.

**Q2. `yield` wali DB dependency kyun?**  
Session request ko milti hai; request complete hone par context manager session safely close karta hai.

**Q3. Tests mein DI ka faida?**  
Real Redis ko fake Redis aur real dependency ko controlled test dependency se replace kar sakte hain.

**Q4. `401` aur `403` dependency chain mein kab?**  
Invalid/missing authentication par `401`; valid authenticated user ke paas required role na ho to `403`.

---

## Skill 4 — Pydantic v2 DTO validation

### Define

Pydantic models API ke input/output contracts hain. Ye JSON ko typed Python data mein validate/parse aur Python objects ko response JSON mein serialize karte hain.

### Problem

Untrusted client invalid email, negative money, missing name ya unexpected shape bhej sakta tha. Database ORM object ko directly public response banana sensitive fields expose kar sakta tha.

### LedgerLite solution

Create, update aur response ke separate schemas hain. `Field` constraints aur `ConfigDict(from_attributes=True)` use hua.

### Code

```python
class PaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    method: Literal["cash", "bank_transfer", "card", "other"]
    payment_date: date

class CustomerUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    display_name: str
    email: EmailStr | None
```

### Benefits

- Invalid input database se pehle `422` par reject.
- Swagger schemas automatically generate.
- Request aur response contracts explicit.
- ORM aur public API separate rehte hain.

### Note

Pydantic validation clear early feedback deti hai; database constraint concurrency ke against final integrity guarantee deta hai. Dono ki responsibility different hai.

### Interview questions

**Q1. Pydantic model aur SQLAlchemy model mein difference?**  
Pydantic API validation/serialization contract hai. SQLAlchemy persistence aur database table mapping hai.

**Q2. Create aur Update schema separate kyun?**  
Create mein required values hoti hain; PATCH update mein fields optional hoti hain taake partial changes ho saken.

**Q3. `from_attributes=True` kyun?**  
Pydantic ko dictionary ke ilawa SQLAlchemy ORM object ke attributes read karne deta hai.

**Q4. `model_dump(exclude_unset=True)` kya solve karta hai?**  
PATCH mein sirf client ke actually bheje fields milte hain; missing fields existing data overwrite nahi kartin.

**Q5. Validation error status kya hai?**  
FastAPI invalid request body/path/query ko aam tor par `422 Unprocessable Entity` deta hai.

---

## Skill 5 — Pydantic Settings and environment configuration

### Define

Pydantic Settings environment variables aur `.env` ko typed configuration object mein load aur validate karta hai.

### Problem

Database URLs, JWT secrets, CORS origins aur token expiry code mein hardcode karna insecure aur environment change ke liye difficult hota.

### LedgerLite solution

Backend `Settings` startup par environment read karta hai. Frontend public and server-only URLs separate rakhta hai.

### Code

```python
class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6380/0"
    jwt_secret_key: SecretStr
    access_token_expire_minutes: int = 120
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
```

```ts
const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
```

### Benefits

- Secrets source code se bahar.
- Development/production configuration alag.
- Invalid required config startup par fail-fast.
- Typed settings aur centralized defaults.

### Note

Real `.env` commit nahi karni. `.env.example` sirf safe placeholders document karti hai. `NEXT_PUBLIC_` variable browser bundle mein visible hota hai; secret kabhi us prefix mein nahi rakhna.

### Interview questions

**Q1. `.env` aur Settings same cheez hain?**  
Nahi. `.env` raw key/value source hai; Settings us data ko typed, validated Python object banata hai.

**Q2. Secret key environment mein kyun?**  
Repository leak ya environment change par source edit kiye baghair secret rotate ho sakta hai.

**Q3. Frontend `API_URL` aur `NEXT_PUBLIC_API_URL` mein difference?**  
`API_URL` server-only reh sakta hai. `NEXT_PUBLIC_` value browser JavaScript mein expose hoti hai.

---

## Skill 6 — REST, HTTP status codes and error contracts

### Define

REST resources ko HTTP methods aur stable URLs se operate karta hai. Status codes request ka result machine-readable form mein batate hain.

### Problem

Har failure ko `200` ya generic `500` dene se frontend decide nahi kar sakta ke login, validation, missing record ya conflict kaunsi problem hai.

### LedgerLite solution

Customers/invoices/payments resource routes use karte hain aur meaningful status codes return karte hain.

### Code

```python
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_customer(...): ...

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(...): ...

raise HTTPException(status_code=409, detail="Invoice cannot be edited after payment.")
```

### Benefits

- Predictable frontend behavior.
- Clear API contract and Swagger docs.
- Logs/tests exact outcome verify kar sakte hain.

### Note

LedgerLite rules: `401` unauthenticated, `403` forbidden role, `404` inaccessible/missing tenant record, `409` business conflict, `422` invalid input, `429` rate limit, `503` dependency unavailable.

### Interview questions

**Q1. POST create par `201` kyun?**  
Request successfully naya resource create karti hai; `201 Created` exact semantic result hai.

**Q2. Delete par `204` kyun?**  
Delete successful hai aur response body nahi chahiye.

**Q3. Duplicate ya invalid state par `409` kyun?**  
Request syntax valid hai lekin current resource/business state ke saath conflict hai.

**Q4. Tenant ka doosri company wala record `403` ya `404`?**  
LedgerLite `404` use karta hai taake attacker ko doosri tenant ke record ki existence reveal na ho.

---

## Skill 7 — OpenAPI and Swagger UI

### Define

OpenAPI machine-readable API specification hai. Swagger UI us specification ka interactive documentation/testing interface hai.

### Problem

Frontend developer ko endpoints, request fields, response types aur auth manually guess karna padta.

### LedgerLite solution

FastAPI route signatures, Pydantic schemas, response models, tags, summaries aur examples se `/docs` generate karta hai.

### Code

```python
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    openapi_tags=openapi_tags,
    swagger_ui_parameters={
        "displayRequestDuration": True,
        "docExpansion": "none",
        "persistAuthorization": True,
    },
)
```

### Benefits

- Interactive API testing.
- Frontend/backend contract visible.
- Documentation implementation ke saath update hoti hai.

### Note

Swagger route security ya tests ka replacement nahi. Production environment mein docs exposure organization policy ke mutabiq control ki ja sakti hai.

### Interview questions

**Q1. Swagger aur OpenAPI same hain?**  
OpenAPI specification hai; Swagger UI us spec ko render/test karne ka interface hai.

**Q2. FastAPI docs automatically kaise banata hai?**  
Type hints, Pydantic schemas, decorators, response models aur metadata se OpenAPI document generate hota hai.

**Q3. `response_model` ka benefit?**  
Response shape document aur validate/serialize hoti hai; unwanted ORM fields expose hone ka risk kam hota hai.

---

# Part B — Database and accounting

## Skill 8 — PostgreSQL 16

### Define

PostgreSQL relational database hai jo durable tables, constraints, transactions, indexes aur SQL queries provide karta hai.

### Problem

Initial in-memory Python list restart par delete hoti, multiple workers mein inconsistent hoti aur relationships/transactions enforce nahi kar sakti thi.

### LedgerLite solution

Organizations, users, customers, invoices, line items, payments aur refresh tokens PostgreSQL tables mein persist hote hain.

### Code

```yaml
postgres:
  image: postgres:16-alpine
  ports:
    - "5434:5432"
  volumes:
    - ledgerlite_postgres_data:/var/lib/postgresql/data
```

### Benefits

- API restart ke baad data safe.
- ACID transactions.
- Referential integrity.
- Filtering, joining, grouping and pagination.

### Note

Host port `5434` local machine ka exposed port hai; container ke andar PostgreSQL standard port `5432` use karta hai.

### Interview questions

**Q1. PostgreSQL list se better kyun?**  
Durable storage, concurrency, constraints, transactions, relations aur powerful queries deta hai.

**Q2. Volume kyun use hua?**  
Container recreate hone par database files container filesystem ke saath delete na hon.

**Q3. Relational DB accounting ke liye kyun suitable?**  
Customers, invoices, items aur payments strongly related hain; constraints aur transactions financial integrity protect karte hain.

---

## Skill 9 — SQLAlchemy 2 async ORM and asyncpg

### Define

SQLAlchemy Python SQL toolkit/ORM hai jo classes ko tables aur expressions ko SQL mein map karta hai. `asyncpg` PostgreSQL ka asynchronous Python driver hai.

### Problem

Har query raw SQL string se likhne par mapping, parameter handling aur repeated database plumbing zyada hoti. Synchronous driver async FastAPI routes ko block kar sakta tha.

### LedgerLite solution

Async engine connection pool manage karta hai; session factory har request ki unit of work banati hai; ORM models tables represent karte hain.

### Code

```python
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
```

### Benefits

- Typed model/query construction.
- Parameterized SQL.
- Connection pooling.
- Transaction and relationship support.
- Non-blocking PostgreSQL I/O.

### Note

ORM SQL knowledge ka replacement nahi. Generated queries, indexes, eager loading aur transaction boundaries samajhna zaroori hai.

### Interview questions

**Q1. Engine aur session mein difference?**  
Engine connections/pool manage karta hai. Session request-level queries, object state aur transaction manage karti hai.

**Q2. `async_sessionmaker` kya hai?**  
Configured factory jo har call par nayi `AsyncSession` banati hai.

**Q3. `pool_pre_ping=True` kyun?**  
Pool se connection dene se pehle check karta hai ke stale/dead connection to nahi.

**Q4. `expire_on_commit=False` kya karta hai?**  
Commit ke baad already loaded attributes accessible rakhta hai. Database-generated values ke liye phir bhi `refresh()` useful hai.

**Q5. `select()`, `execute()` aur `scalars()`?**  
`select()` statement banata hai; `execute()` DB par chalata hai; `scalars()` row wrappers se ORM entities nikalta hai.

---

## Skill 10 — Relational models, keys and ORM relationships

### Define

ORM model database table ko Python class mein map karta hai. Primary key row identify karti hai; foreign key related table ki valid row enforce karti hai; `relationship()` Python object navigation/loading deta hai.

### Problem

Invoice ko valid customer/organization se aur line item ko invoice se attach rakhna tha. Orphan ya unrelated financial rows unacceptable thin.

### LedgerLite solution

Tenant and resource IDs foreign keys hain. Invoice aur line items ke darmiyan bidirectional relationship aur delete-orphan cascade hai.

### Code

```python
class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), index=True
    )
    line_items: Mapped[list["InvoiceLineItem"]] = relationship(
        back_populates="invoice",
        cascade="all, delete-orphan",
    )
```

### Benefits

- Database referential integrity.
- Object graph convenient loading.
- Invoice items lifecycle invoice ke saath managed.

### Note

`ForeignKey` database rule hai; `relationship()` ORM convenience hai. Dono same cheez nahi.

### Interview questions

**Q1. Primary key kya solve karti hai?**  
Har row ko unique stable identity deti hai aur exact lookup/reference possible banati hai.

**Q2. Foreign key kya solve karti hai?**  
Invalid related ID insert hone se rokti aur referential integrity maintain karti hai.

**Q3. Customer delete par `RESTRICT` kyun?**  
Existing invoice ka accounting history customer delete se tootna nahi chahiye.

**Q4. `CASCADE` aur `delete-orphan` ka difference?**  
Database `ondelete` row-level FK action hai; ORM cascade Python session mein child object lifecycle manage karta hai.

---

## Skill 11 — Constraints and indexes

### Define

Constraint database-validity rule hai. Index auxiliary data structure hai jo selected lookups/joins fast karta hai.

### Problem

Concurrent requests API validation ko cross karke duplicate invoice/email ya invalid money store kar sakti thin. Large tenant tables without indexes slow hotin.

### LedgerLite solution

Composite unique constraints, check constraints, non-null rules aur tenant/lookup indexes use huye.

### Code

```python
__table_args__ = (
    UniqueConstraint(
        "organization_id",
        "invoice_number",
        name="uq_invoices_organization_number",
    ),
    CheckConstraint(
        "tax_rate >= 0 AND tax_rate <= 100",
        name="ck_invoices_tax_rate",
    ),
    CheckConstraint(
        "total >= 0 AND balance_due >= 0",
        name="ck_invoices_non_negative_totals",
    ),
)
```

### Benefits

- Database final integrity boundary banta hai.
- Concurrent writes mein bhi duplicates reject.
- Tenant filters aur joins faster ho sakte hain.

### Note

Har column ko index nahi karna. Index disk leta aur insert/update cost barhata hai. Composite uniqueness tenant-specific business rule express karti hai.

### Interview questions

**Q1. API validation ke bawajood DB constraint kyun?**  
Do concurrent requests dono pre-check pass kar sakti hain; database constraint atomic final protection deta hai.

**Q2. Composite unique constraint kya hai?**  
Combination unique hota hai. Same email different organizations mein allowed, lekin same organization mein duplicate nahi.

**Q3. Check constraint kya karta hai?**  
Database invalid domain value, jaise negative payment ya tax above 100, reject karta hai.

**Q4. Index ka trade-off?**  
Reads faster ho sakti hain, lekin storage aur write maintenance cost barhti hai.

---

## Skill 12 — Alembic migrations

### Define

Alembic SQLAlchemy database schema migration tool hai. Migration schema changes ko versioned `upgrade()` aur `downgrade()` operations mein rakhti hai.

### Problem

Model class edit karne se existing database table automatically safely update nahi hoti. Team/production databases ko repeatable schema history chahiye.

### LedgerLite solution

Core tables, refresh tokens, role constraints, invoices/payments, reversal audit aur invoice sequence ke migrations bani aur apply hui.

### Code

```python
# migrations/env.py
target_metadata = Base.metadata

# migration revision
def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("next_invoice_sequence", sa.Integer(), nullable=False),
    )

def downgrade() -> None:
    op.drop_column("organizations", "next_invoice_sequence")
```

```powershell
alembic revision --autogenerate -m "add invoice sequence"
alembic upgrade head
alembic current
```

### Benefits

- Version-controlled schema history.
- New environment reproducibly build hota hai.
- Reviewable production changes.
- Rollback path document hota hai.

### Note

Autogenerate candidate migration banata hai; human review zaroori hai. Rename kabhi drop/add detect ho kar data loss kar sakta hai. Applied migration edit nahi karni; nayi revision banani hai.

### Interview questions

**Q1. Model aur migration mein difference?**  
Model desired application mapping hai; migration existing database ko ek schema version se next version tak badalti hai.

**Q2. Alembic ko models ka pata kaise chalta hai?**  
Imported models `Base.metadata` mein register hote hain; `target_metadata` autogenerate comparison ke liye use hota hai.

**Q3. `upgrade head` kya karta hai?**  
Pending revisions order mein latest head tak apply karta hai.

**Q4. Migration auto-generated code samajhna zaroori hai?**  
Har boilerplate ratta nahi, lekin columns, constraints, data loss risk, upgrade/downgrade aur revision chain review karni zaroori hai.

---

## Skill 13 — Transactions, rollback and row-level locking

### Define

Transaction database operations ko atomic unit banati hai: sab successful hon to commit, kisi failure par rollback. `SELECT FOR UPDATE` selected rows ko transaction ke end tak write-lock karta hai.

### Problem

Do simultaneous payments same old balance read karke invoice overpay kar sakti thin. Signup mein organization create ho aur user fail ho jaye to half-created account reh sakta tha.

### LedgerLite solution

Related writes ek session transaction mein hoti hain. Payment/reversal, refresh rotation aur invoice number generation critical rows `with_for_update()` se lock karte hain.

### Code

```python
statement = (
    select(Invoice)
    .where(
        Invoice.id == invoice_id,
        Invoice.organization_id == current_user.organization_id,
    )
    .with_for_update()
)
invoice = (await session.execute(statement)).scalar_one_or_none()

apply_payment(invoice, payload.amount)
session.add(payment)
await session.commit()
```

```python
try:
    await session.commit()
except IntegrityError:
    await session.rollback()
    raise HTTPException(status_code=409, detail="Conflicting value.") from None
```

### Benefits

- Financial updates atomic.
- Lost-update and overpayment race reduce.
- Failed transaction partial data nahi chhorti.

### Note

Row lock sirf transaction ke andar meaningful hai. Locks short rakhne chahiye; long transactions contention/deadlock risk barhati hain.

### Interview questions

**Q1. Atomicity kya hai?**  
Related operations ya to sab apply hon ya koi bhi nahi.

**Q2. `flush()` aur `commit()` mein difference?**  
`flush()` pending SQL database transaction ko bhej kar generated ID de sakta hai, lekin permanent nahi. `commit()` transaction permanently save karta hai.

**Q3. Failed commit ke baad rollback kyun?**  
Session failed transaction state mein hoti hai. Rollback pending changes cancel karke session ko usable state mein lata hai.

**Q4. `SELECT FOR UPDATE` payment problem kaise solve karta hai?**  
Pehli transaction invoice row lock karti hai. Doosri latest committed balance milne tak wait karti hai aur stale balance par payment apply nahi karti.

**Q5. Isolation aur application lock same hain?**  
Nahi. Database isolation general transaction visibility rules deta hai; explicit row lock specific business-critical row ko serialize karta hai.

---

## Skill 14 — Decimal accounting and business services

### Define

Python `Decimal` base-10 exact decimal arithmetic deta hai. Service function reusable domain rule ko HTTP aur persistence details se separate karta hai.

### Problem

Binary floating-point se `0.1 + 0.2` exact `0.3` nahi hota. Financial totals client par trust karne se manipulation ya rounding inconsistency ho sakti thi.

### LedgerLite solution

Money Pydantic `Decimal`, SQLAlchemy `Numeric`, JSON decimal strings aur backend `ROUND_HALF_UP` calculation se end-to-end exact rakhi gayi. Frontend total sirf estimate hai.

### Code

```python
MONEY_PLACES = Decimal("0.01")

def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)

def calculate_invoice(items, tax_rate: Decimal) -> InvoiceTotals:
    subtotal = money(sum((money(i.quantity * i.unit_price) for i in items), Decimal("0")))
    tax_amount = money(subtotal * tax_rate / Decimal("100"))
    total = money(subtotal + tax_amount)
    return InvoiceTotals(subtotal=subtotal, tax_amount=tax_amount, total=total)
```

### Benefits

- Predictable cents/paise.
- Single authoritative calculation.
- Logic separately testable.
- Client tampering totals change nahi kar sakti.

### Note

Frontend preview helpful UX hai, accounting authority nahi. Backend supplied line items se totals dobara calculate karta hai.

### Interview questions

**Q1. Float money ke liye unsafe kyun?**  
Binary floating representation decimal fractions ko exactly store nahi karti; repeated operations rounding errors produce kar sakti hain.

**Q2. `Numeric(14, 2)` kya batata hai?**  
Total 14 decimal digits, jin mein 2 decimal point ke baad hoti hain.

**Q3. Totals backend par kyun calculate kiye?**  
Client untrusted hai. Backend validation, rounding aur business rules ka authoritative boundary hai.

**Q4. Service layer ka faida?**  
Same calculation routes/tests reuse karte hain aur HTTP/database code se independent test ho sakti hai.

---

## Skill 15 — Search and pagination

### Define

Pagination large result set ko fixed-size pages mein return karti hai. Search server par matching rows filter karti hai.

### Problem

Saare customers/invoices ek response mein bhejne se memory, network aur rendering cost data ke saath grow karti. Client-side search sirf already-loaded page dekh sakti thi.

### LedgerLite solution

Reusable pagination dependency `page`/`size` validate karti hai. Query tenant filter, optional search, count, stable order, offset aur limit apply karti hai.

### Code

```python
class PaginationParams:
    def __init__(self, page: int = Query(1, ge=1), size: int = Query(10, ge=1, le=100)):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size

statement = (
    select(Customer)
    .where(Customer.organization_id == current_user.organization_id)
    .order_by(Customer.id)
    .offset(pagination.offset)
    .limit(pagination.size)
)
```

### Benefits

- Bounded response size.
- Stable navigation and total pages.
- Search all tenant data par hoti hai, current page par nahi.
- Shared validation.

### Note

Offset pagination current dataset ke liye suitable hai. Very large or fast-changing feeds mein cursor pagination better ho sakti hai.

### Interview questions

**Q1. Offset formula kya hai?**  
`offset = (page - 1) * size`.

**Q2. Stable `order_by` kyun?**  
Order undefined ho to records pages ke beech jump/duplicate ho sakte hain.

**Q3. `COUNT(*)` kyun?**  
Frontend ko total items aur total pages calculate/display karne ke liye.

**Q4. Search ke saath tenant filter kyun zaroori?**  
Search query ko bhi organization boundary ke andar rehna hai; warna cross-tenant data leak ho sakta hai.

**Q5. `GROUP BY` duplicate removal hai?**  
Direct replacement nahi. `GROUP BY` aggregation groups banata hai; unique values ke liye `DISTINCT` use ho sakta hai.

---

# Part C — Security and tenancy

## Skill 16 — Multi-tenant data isolation

### Define

Multi-tenant SaaS ek application/database mein multiple organizations serve karta hai, magar har organization ka data logically isolated rehta hai.

### Problem

Sirf `customer_id` ya `invoice_id` se query karne par authenticated user URL ID change karke doosri company ka record dekh sakta tha.

### LedgerLite solution

Authenticated user se trusted `organization_id` milti hai. Har resource query `id` ke saath organization condition bhi lagati hai; client-supplied tenant ID trust nahi hoti.

### Code

```python
statement = select(Invoice).where(
    Invoice.id == invoice_id,
    Invoice.organization_id == current_user.organization_id,
)
invoice = (await session.execute(statement)).scalar_one_or_none()

if invoice is None:
    raise HTTPException(status_code=404, detail="Invoice not found.")
```

### Benefits

- Company data mixing/leak prevent.
- Same API/database safely multiple businesses serve karte hain.
- Query-level authorization consistently enforce hoti hai.

### Note

Frontend cache key mein organization include/clear karna defense-in-depth UX hai. Actual security backend tenant filter hai; browser cache security boundary nahi.

### Interview questions

**Q1. Tenant ID request body se kyun nahi lete?**  
Client untrusted hai aur doosri organization ID bhej sakta hai. Tenant context verified JWT/user record se aata hai.

**Q2. Missing aur foreign-tenant record dono par `404` kyun?**  
Doosri tenant ki resource existence reveal nahi hoti.

**Q3. Cache clear on login kyun?**  
Pichle account ka cached UI data doosre account ko briefly nazar na aaye.

**Q4. Kya organization foreign key tenant isolation ke liye enough hai?**  
Nahi. FK valid organization ensure karti hai; authorization query ko current organization tak scope karna alag requirement hai.

---

## Skill 17 — Argon2 password hashing

### Define

Password hashing one-way transformation hai. Argon2 memory-hard password hashing algorithm hai; salt same passwords ke hashes different banata hai.

### Problem

Plaintext ya reversible encrypted passwords database leak par immediately expose ho jate. Fast general hash brute-force ke liye cheap ho sakta tha.

### LedgerLite solution

`pwdlib.PasswordHash.recommended()` Argon2 hash create aur verify karta hai. Plain password kabhi database mein save nahi hota.

### Code

```python
password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)
```

### Benefits

- Original password hash se directly recover nahi hota.
- Unique salt rainbow tables/reused hash comparison ko weaken karta hai.
- Memory cost attackers ke parallel guessing ko expensive banati hai.

### Note

Hashing encryption nahi. Login par password decrypt nahi hota; candidate password ko stored encoded hash ke parameters ke against verify kiya jata hai.

### Interview questions

**Q1. Hash aur encryption mein difference?**  
Encryption key se reversible hai. Password hash deliberately one-way verification ke liye hota hai.

**Q2. Salt ka role?**  
Random salt ki wajah se same password ke hashes different hote hain aur precomputed attack tables ineffective hoti hain.

**Q3. Login kaise verify hota hai jab hash different ban sakta hai?**  
Stored encoded Argon2 hash mein salt/parameters hote hain; verify function candidate ko unhi settings se check karta hai.

**Q4. JWT secret password hash mein use hota hai?**  
Nahi. Password hasher apna salt/algorithm use karta hai; JWT secret token signature ke liye hai.

---

## Skill 18 — JWT access and refresh tokens

### Define

JWT signed token hai jisme claims aur expiry hoti hai. Access token short-lived API authorization ke liye; refresh token naya access token lene ke liye longer-lived credential hai.

### Problem

Har request par email/password bhejna unsafe tha. Long-lived access token steal ho jaye to attacker ko lambi access milti.

### LedgerLite solution

Access token mein `sub`, organization, role, token version, type, issue/expiry and unique `jti` hain. Refresh token ka separate type aur expiry hai.

### Code

```python
payload = {
    "sub": str(user_id),
    "organization_id": organization_id,
    "role": role,
    "token_version": token_version,
    "type": "access",
    "iat": now,
    "exp": expires_at,
    "jti": str(uuid4()),
}

return jwt.encode(payload, secret, algorithm="HS256")
```

### Benefits

- Password repeat nahi hota.
- Short access-token lifetime stolen token window reduce karti hai.
- Claims quick authentication context dete hain.
- Refresh token user session renew karta hai.

### Note

JWT signed hai, encrypted nahi. Payload readable ho sakta hai, isliye secret/sensitive data claims mein nahi rakhna. Backend signature, required claims, type, expiry, DB user, active status and token version verify karta hai.

### Interview questions

**Q1. JWT ke teen parts?**  
Header, payload aur signature.

**Q2. Signature kya prove karti hai?**  
Token expected secret se sign hua aur payload modify nahi hua. Ye confidentiality nahi deti.

**Q3. `exp`, `iat`, `sub`, `jti`?**  
Expiry, issued-at time, subject/user identity aur unique token ID.

**Q4. Access expiry short kyun?**  
Stolen access token ka usable damage window limited rehta hai.

**Q5. Token mein role hone ke bawajood DB user reload kyun?**  
User deactivate, role change ya token version update ho sakta hai. DB current truth verify karti hai.

---

## Skill 19 — Refresh rotation, reuse detection and logout-all

### Define

Refresh rotation har successful refresh par old token revoke karke new token issue karti hai. Reuse detection revoked token dobara use hone par token family/session chain compromise treat karti hai.

### Problem

Static refresh token chori ho jaye to attacker aur real user dono use kar sakte hain. JWT access token naturally server-side delete nahi hota.

### LedgerLite solution

Refresh token ka raw value store nahi hota; SHA-256 hash, JTI, expiry, revocation and replacement chain DB mein hai. Rotation row lock ke andar hoti hai. Logout current refresh revoke aur access JTI Redis blacklist karta hai. Logout-all `token_version` increment karke sab old access tokens invalidate karta hai.

### Code

```python
token_row = (
    await session.execute(
        select(RefreshToken)
        .where(RefreshToken.jti == jti)
        .with_for_update()
    )
).scalar_one_or_none()

if token_row.revoked_at is not None:
    await revoke_token_family(session, token_row.family_id)
    raise HTTPException(status_code=401, detail="Refresh token reuse detected.")
```

```python
user.token_version += 1
await session.commit()
```

### Benefits

- Stolen refresh-token reuse detectable.
- Raw token DB leak mein immediately usable nahi.
- Logout access token expiry se pehle block kar sakta hai.
- Logout-all all devices/sessions invalidate karta hai.

### Note

Hashing bearer token password hashing jaisa expensive hone ki zaroorat nahi; refresh token high-entropy random JWT hai, SHA-256 lookup/compare suitable hai.

### Interview questions

**Q1. Refresh token database mein hash kyun?**  
DB leak par attacker stored value ko direct bearer credential ke taur par use na kar sake.

**Q2. Rotation security kaise improve karti hai?**  
Har token one-time use hota hai; old token reuse theft signal ban jata hai.

**Q3. Row lock refresh mein kyun?**  
Same refresh token ki two concurrent requests dono successful rotate na kar saken.

**Q4. Logout-all ka `token_version` pattern?**  
DB version increment hoti hai; old JWT claim mismatch par next protected request reject hoti hai.

**Q5. Access blacklist TTL kyun?**  
Entry sirf token ke remaining lifetime tak chahiye; expiry ke baad Redis memory automatically release ho jati hai.

---

## Skill 20 — Redis rate limiting and revocation

### Define

Redis in-memory key/value store hai jo counters, TTLs aur short-lived security state ke liye suitable hai.

### Problem

Unlimited wrong login attempts brute-force allow kartin. Signed access JWT logout ke baad expiry tak otherwise valid rehta.

### LedgerLite solution

Login failures per email-hash and client IP Redis counter mein record hote hain. Limit par `429` + `Retry-After`. Revoked access JTI expiry TTL tak Redis mein store hoti hai.

### Code

```python
attempts = await redis.incr(key)
if attempts == 1:
    await redis.expire(key, settings.login_rate_limit_window_seconds)

if attempts >= settings.login_rate_limit_attempts:
    raise HTTPException(
        status_code=429,
        detail="Too many login attempts.",
        headers={"Retry-After": str(await redis.ttl(key))},
    )
```

### Benefits

- Fast temporary counters.
- Automatic TTL cleanup.
- Multiple API instances shared security state use kar sakti hain.
- JWT revocation without storing every active access token.

### Note

LedgerLite security checks Redis down hone par `503` fail-closed deti hain. Is se availability thori reduce hoti hai magar security silently bypass nahi hoti.

### Interview questions

**Q1. Rate limit PostgreSQL ke bajaye Redis mein kyun?**  
Counters short-lived aur frequently updated hain; Redis atomic increments/TTL fast provide karta hai.

**Q2. Key mein email ko hash kyun?**  
Raw personal email Redis keys/log tooling mein expose na ho.

**Q3. `429` aur `Retry-After`?**  
Client ko batata hai too many requests aur kitni der baad retry karna hai.

**Q4. Fail-open vs fail-closed?**  
Fail-open Redis failure par request allow karta; fail-closed request reject karta. Auth security ke liye LedgerLite fail-closed hai.

---

## Skill 21 — Role-Based Access Control and member management

### Define

RBAC user permissions ko roles se map karta hai. LedgerLite mein `owner` management/destructive work kar sakta hai; `member` daily accounting work.

### Problem

Har authenticated user ko customer delete, invoice void, payment reverse aur team manage karne dena excessive privilege hota.

### LedgerLite solution

Owner dependency privileged routes protect karti hai. First signup organization + owner banata hai; owner members create/update karta hai. Self-demotion/deactivation guard company ko ownerless hone se bachata hai. Frontend `/team` route owner controls, `/settings` role-aware editing, BFF forwarding aur TanStack cache refresh provide karte hain.

### Code

```python
@router.post("/{invoice_id}/void")
async def void_invoice(
    invoice_id: int,
    current_owner: Annotated[CurrentUser, Depends(require_owner)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    ...
```

```tsx
const visibleLinks = links.filter(
  (link) => !link.ownerOnly || isOwner,
);

<WorkspaceSettings isOwner={user?.role === "owner"} />
```

```ts
onSuccess: () => {
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.members,
  });
}
```

### Benefits

- Least privilege.
- Authorization reusable and consistent.
- UI and API owner/member behavior clear.

### Note

Frontend button hide karna security nahi. Backend guard har privileged request par mandatory hai. `/team` owner-only member management aur `/settings` role-aware organization screen BFF routes ke through implemented hain.

### Interview questions

**Q1. Authentication aur authorization difference?**  
Authentication batati hai user kaun hai; authorization batati hai woh kya kar sakta hai.

**Q2. Role token mein hai to owner dependency kyun?**  
Central guard consistent `403` behavior deta hai; current user DB verification stale token role risk reduce karti hai.

**Q3. Owner apne aap ko deactivate kyun nahi kar sakta?**  
Organization ko accidentally active owner ke baghair chhorne se bachane ke liye.

**Q4. Platform admin implemented hai?**  
Nahi. Current roles tenant-level owner/member hain. Cross-organization super admin separate future system hoga.

**Q5. Team link member se hide karna enough security hai?**  
Nahi. Link hide karna UX hai. `/team` server section role check karti hai, BFF token forward karta hai aur FastAPI `get_current_owner` final `403` authorization enforce karta hai.

**Q6. Organization settings mein owner aur member behavior kya hai?**  
Dono current organization read kar sakte hain. Owner name/slug `PATCH` kar sakta hai; member ko disabled view-only fields milti hain aur backend update endpoint bhi owner dependency se protected hai.

**Q7. Member create/update ke baad query invalidate kyun?**  
Mutation successful hone ke baad cached member list stale hoti hai. `workspaceKeys.members` invalidate karne se active paginated list authoritative backend data dobara fetch karti hai.

**Q8. Apna owner account demote/deactivate kyun disabled hai?**  
Frontend accidental click rokta hai aur backend `409` guard organization ko active owner ke baghair rehne se bachata hai. Backend guard actual security/business rule hai.

**Q9. Member password flow ki current limitation?**  
Owner member create karte waqt temporary password set karta hai. Email invitation aur self-service password setup abhi implemented nahi, isliye is limitation ko interview mein honestly batana hai.

---

# Part D — Reliability, observability and backend testing

## Skill 22 — Health checks and application lifespan

### Define

Liveness batati hai process running hai. Readiness batati hai application real traffic serve karne ke liye required dependencies ke saath ready hai. Lifespan startup/shutdown resources manage karta hai.

### Problem

API process alive ho sakta hai magar PostgreSQL ya Redis unavailable ho; simple `200` health response misleading hota. Shutdown par connection pools cleanly close bhi karne thay.

### LedgerLite solution

`/health` process check hai. `/health/ready` PostgreSQL `SELECT 1` aur Redis `PING` check karta hai. Lifespan shutdown par Redis client close aur DB engine dispose karta hai.

### Code

```python
@router.get("/health/ready")
async def readiness_check(session: AsyncSession, redis: Redis):
    await session.execute(text("SELECT 1"))
    await redis.ping()
    return {"status": "ready", "checks": {"database": "ok", "redis": "ok"}}
```

```python
@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await redis_client.aclose()
    await engine.dispose()
```

### Benefits

- Load balancer/container unhealthy instance ko traffic nahi deta.
- Dependency failures visible.
- Clean resource shutdown.

### Note

Docker Compose service health checks aur API readiness related hain magar same nahi: container check service process ko, API readiness poori application dependency chain ko verify karti hai.

### Interview questions

**Q1. Liveness vs readiness?**  
Liveness: process zinda? Readiness: dependencies ke saath requests serve kar sakta hai?

**Q2. Readiness failure status?**  
LedgerLite `503 Service Unavailable` return karta hai.

**Q3. Engine dispose kyun?**  
Pool connections release aur process shutdown clean hota hai.

---

## Skill 23 — CORS, SameSite cookies and BFF boundary

### Define

CORS browser ko batata hai kaunse origins cross-origin response read kar sakte hain. CSRF victim browser ki cookies use karke unwanted state-changing request hai. BFF frontend-specific server layer hai jo browser aur backend ke darmiyan boundary banti hai.

### Problem

Browser ko FastAPI token directly dene se token client JavaScript storage mein expose ho sakta tha. Direct cross-origin frontend/backend setup CORS aur credential complexity barhata.

### LedgerLite solution

Browser same-origin Next.js `/api/*` Route Handlers call karta hai. Route Handler HttpOnly cookie read karke FastAPI ko Bearer token bhejta hai. Cookies `SameSite=Lax`, production `Secure`, and `HttpOnly` hain. FastAPI CORS origins restricted config se leta hai.

### Code

```ts
const token = (await cookies()).get("access_token")?.value;
const response = await fetch(`${apiUrl}/customers`, {
  headers: { Authorization: `Bearer ${token}` },
  cache: "no-store",
});
```

```ts
response.cookies.set("access_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
```

### Benefits

- Token normal browser JavaScript se inaccessible.
- Backend URL/credentials server boundary par.
- Same-origin UI API calls simpler.
- FastAPI remains independently protected.

### Note

`SameSite=Lax` useful CSRF mitigation hai, complete dedicated CSRF-token implementation nahi. Production hardening mein state-changing BFF routes ke Origin/CSRF checks add karne hain. CORS CSRF ka replacement nahi.

### Interview questions

**Q1. CORS authentication hai?**  
Nahi. Ye browser response-reading policy hai. API ko auth/authorization separately enforce karni hoti hai.

**Q2. HttpOnly kya protect karta hai?**  
Client JavaScript `document.cookie` se token read nahi kar sakti, XSS token theft risk reduce hota hai.

**Q3. BFF kyun use kiya?**  
Tokens secure server-side cookies mein rakhne, backend calls centralize karne aur browser ko FastAPI details se decouple karne ke liye.

**Q4. Kya LedgerLite CSRF fully complete hai?**  
SameSite protection present hai; explicit CSRF token/origin enforcement future hardening hai. Interview mein overclaim nahi karna.

---

## Skill 24 — Structured logging and Request ID

### Define

Structured logging fixed fields ke saath machine-readable events banati hai. Request ID ek request ko services/log lines mein correlate karta hai.

### Problem

Plain messages mein method, path, status, latency aur related request locate karna difficult hota. User-reported error ko exact server event se connect nahi kar sakte thay.

### LedgerLite solution

HTTP middleware incoming `X-Request-ID` accept ya UUID generate karta hai, duration measure karta hai, structured event log karta hai aur response header mein ID return karta hai.

### Code

```python
request_id = request.headers.get("X-Request-ID") or str(uuid4())
started_at = perf_counter()
response = await call_next(request)
duration_ms = round((perf_counter() - started_at) * 1000, 2)

logger.info("request.completed", extra={
    "request_id": request_id,
    "method": request.method,
    "path": request.url.path,
    "status_code": response.status_code,
    "duration_ms": duration_ms,
})
response.headers["X-Request-ID"] = request_id
```

### Benefits

- Search/filter/aggregation friendly logs.
- Slow/failing request trace.
- Client report ko backend logs se correlate karna.

### Note

Ye Python logging implementation hai, **Pino nahi**. Pino Node.js logger hai aur LedgerLite FastAPI backend mein use nahi hua.

### Interview questions

**Q1. Structured logs plain logs se better kyun?**  
Fields machine parse hote hain; status, path, request ID aur duration se reliable queries/alerts bante hain.

**Q2. Client-provided Request ID accept karne ka faida?**  
Upstream/frontend se same correlation chain continue ho sakti hai.

**Q3. Kya sensitive request body log karni chahiye?**  
Passwords, tokens aur personal/financial data default logs mein nahi rakhne chahiye.

---

## Skill 25 — Pytest, HTTPX and integration tests

### Define

Unit test isolated function verify karta hai. Integration test multiple real layers—route, dependency, auth, database and business rule—ko saath verify karta hai.

### Problem

Auth rotation, tenant isolation, invoice totals aur payment locking manual Swagger testing se regress ho sakte thay.

### LedgerLite solution

`pytest` + `pytest-asyncio` async tests chalate hain. HTTPX `AsyncClient` ASGI app ko real HTTP-style requests bhejta hai. Redis dependency fake implementation se override hoti hai; PostgreSQL real integration behavior verify karta hai.

### Code

```python
@pytest.mark.asyncio
async def test_invoice_payment_flow():
    app.dependency_overrides[get_redis_client] = override_redis

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        login = await client.post("/auth/login", json=credentials)
        payment = await client.post(
            f"/invoices/{invoice_id}/payments",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": "100.00", "method": "cash"},
        )
        assert payment.status_code == 201
```

### Benefits

- Business flows automatically repeatable.
- Status, JSON, persistence and security rules together verify.
- Refactor confidence.

### Note

Current automated suite backend integration focused hai. Frontend Vitest/React Testing Library aur Playwright E2E abhi pending hain.

### Interview questions

**Q1. HTTPX ASGITransport kyun?**  
Test same process mein ASGI app ko request bhejta hai; network server start ki zaroorat nahi, magar routing/middleware stack execute hota hai.

**Q2. Dependency override kyun?**  
External Redis ko deterministic fake se replace karke edge states control aur test isolate karte hain.

**Q3. Integration test unit test ka replacement?**  
Nahi. Integration flow wiring verify karta hai; unit test small logic failure ko faster isolate karta hai. Dono useful hain.

**Q4. Accounting test mein kya essential hai?**  
Totals, rounding, overpayment rejection, transaction rollback, reversal audit aur tenant boundary.

---

## Skill 26 — Docker Compose, volumes and service health

### Define

Docker image runtime template hai; container us image ki running isolated instance. Compose multiple services/configuration ko ek file se run karta hai.

### Problem

Har developer ke local PostgreSQL/Redis versions aur ports different ho sakte thay. Setup repeatable nahi tha.

### LedgerLite solution

Compose PostgreSQL 16 and Redis 7 exact images, port mappings, persistent volume and health checks define karta hai.

### Code

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5434:5432"]
    volumes:
      - ledgerlite_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ledgerlite -d ledgerlite"]

  redis:
    image: redis:7-alpine
    ports: ["6380:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
```

### Benefits

- Reproducible versions.
- One-command dependencies.
- Isolated services and persistent DB data.

### Note

Current Compose **sirf PostgreSQL aur Redis** containerize karta hai. FastAPI/frontend Dockerfiles aur full production Compose abhi pending hain.

### Interview questions

**Q1. Image vs container?**  
Image immutable template; container us template ki running instance.

**Q2. `5434:5432`?**  
Host port 5434 container ke port 5432 ko map karta hai.

**Q3. Alpine image ka trade-off?**  
Smaller download/runtime footprint, magar debugging tools/libraries limited ho sakti hain.

**Q4. Health check kya solve karta hai?**  
Process start aur service ready-to-accept-connections ke difference ko detect karta hai.

---

# Part E — Frontend language and architecture

## Skill 27 — TypeScript and frontend API contracts

### Define

TypeScript JavaScript ke upar static type system hai. Types compile-time par props, payloads, responses aur state shapes validate karte hain.

### Problem

API field typo, nullable email, decimal string ya paginated response wrong assume karne se runtime UI errors aa sakte thay.

### LedgerLite solution

Feature-wise `types.ts` backend JSON contracts model karta hai. Form schema se values infer aur API functions typed responses return karte hain.

### Code

```ts
export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type Invoice = {
  id: number;
  invoice_number: string;
  total: string;
  balance_due: string;
  status: "issued" | "partially_paid" | "paid" | "void";
};
```

### Benefits

- IDE autocomplete/refactoring.
- Wrong property/type compile time par detect.
- Frontend API assumptions explicit.

### Note

TypeScript runtime validation nahi karta. External form/API boundary par Zod/backend Pydantic still needed.

### Interview questions

**Q1. Type aur interface ka use?**  
Project API unions/generics ke liye types use karta hai; dono object shapes model kar sakte hain. Consistency more important hai.

**Q2. Decimal response `string` kyun typed hai?**  
JSON/JavaScript number exact financial decimal guarantee nahi karta; backend decimal string precision preserve karti hai.

**Q3. Generic `Page<T>` ka benefit?**  
Customers, invoices aur payments same pagination envelope reuse karte hain with specific item type.

**Q4. Compile-time type enough kyun nahi?**  
Runtime user/network data type system ko bypass karta hai; validation schema actual values check karta hai.

---

## Skill 28 — Next.js 16 App Router

### Define

App Router filesystem-based routing, layouts, Server Components, Route Handlers aur special loading/error/not-found files provide karta hai.

### Problem

Auth pages aur dashboard pages ko different layouts, protected navigation aur nested resource routes chahiye thay without manual router configuration.

### LedgerLite solution

`(auth)` and `(dashboard)` route groups organize layouts without URL change. `page.tsx`, `layout.tsx`, `[id]`, `loading.tsx`, `error.tsx` and `not-found.tsx` conventions use hoti hain.

### Code

```text
src/app/(auth)/login/page.tsx                    -> /login
src/app/(dashboard)/customers/page.tsx           -> /customers
src/app/(dashboard)/customers/[id]/page.tsx      -> /customers/45
src/app/(dashboard)/invoices/[id]/edit/page.tsx  -> /invoices/8/edit
```

### Benefits

- URL structure filesystem se clear.
- Shared nested layouts.
- Built-in loading/error/not-found boundaries.
- Server and client rendering same framework mein.

### Note

Route group parentheses URL ka hissa nahi. `[id]` dynamic segment runtime URL value hai; records build time par automatically create hona zaroori nahi.

### Interview questions

**Q1. `layout.tsx` vs `page.tsx`?**  
Layout shared wrapper/navigation/provider deta hai; page specific URL ka content.

**Q2. Route group `(dashboard)` kya karta hai?**  
Files organize aur common layout apply karta hai, URL mein group name nahi aata.

**Q3. `[id]` dynamic route kaise kaam karti hai?**  
URL segment `params` se milta hai; page ID validate karke matching backend resource fetch/render karti hai.

**Q4. `notFound()` kya karta hai?**  
Nearest `not-found.tsx` render aur 404 behavior trigger karta hai.

**Q5. Next.js 16 mein `params`?**  
Current implementation mein params Promise hai, isliye async page usay `await` karti hai.

---

## Skill 29 — Server Components, Client Components and Suspense

### Define

Server Component server par render hota aur browser JavaScript bundle reduce kar sakta hai. Client Component state, effects, browser APIs aur event handlers use karta hai. Suspense async child ke wait mein fallback stream karta hai.

### Problem

Pure app client-side banane se unnecessary JavaScript aur loading boilerplate hota. Interactive forms ko browser state bhi chahiye thi.

### LedgerLite solution

Pages/layouts default Server Components hain. Forms, Query hooks and interactive navigation files `"use client"` use karti hain. Async status/detail boundaries Suspense fallbacks ke andar hain.

### Code

```tsx
export default function HomePage() {
  return (
    <Suspense fallback={<StatusFallback />}>
      <ApiStatus />
    </Suspense>
  );
}
```

```tsx
"use client";
export function LoginForm() {
  const form = useForm<LoginFormValues>();
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Benefits

- Server-first smaller client bundle.
- Interactive code only where required.
- Async content progressive rendering.
- Clear loading experience.

### Note

Hydration server HTML ko client React tree/event handlers ke saath attach karti hai. Server aur first client render different hon to hydration mismatch hota hai. `Date.now()` jaisi unstable value prerendered content mein carefully handle karni hoti hai.

### Interview questions

**Q1. `"use client"` kab zaroori?**  
State, effect, context consumer, browser API ya event handler use karne wali component boundary par.

**Q2. Har child ko `"use client"` chahiye?**  
Nahi. Client boundary ke imported children client bundle ka part ho sakte hain; directive har file mein repeat zaroori nahi.

**Q3. Suspense kya solve karta hai?**  
Async subtree ready hone tak meaningful fallback dikhata aur streaming boundary deta hai.

**Q4. `loading.tsx` aur manual Suspense?**  
`loading.tsx` route segment ka automatic boundary hai; manual Suspense page ke selected subtree ko independently stream karta hai.

**Q5. Cache Components/PPR?**  
Project `cacheComponents: true` and partial prefetching enable karta hai. Static shell prerender ho sakti hai aur runtime URL/data portions Suspense boundaries mein stream hote hain.

---

## Skill 30 — Next.js Route Handlers as BFF

### Define

Route Handler `app/api/.../route.ts` mein server-side HTTP endpoint hai. BFF browser needs ke liye backend calls adapt karta hai.

### Problem

Browser ko FastAPI URL and Bearer token directly manage karwana token exposure, CORS and duplicated forwarding logic create karta.

### LedgerLite solution

UI same-origin Next routes call karti hai. Route Handler cookie token reads, query/body forwards, backend status/body preserve aur Request ID trace attach karta hai.

### Code

```ts
export async function GET(request: NextRequest) {
  const token = (await cookies()).get("access_token")?.value;
  const response = await fetch(`${apiUrl}/invoices${request.nextUrl.search}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  return NextResponse.json(await response.json(), {
    status: response.status,
  });
}
```

### Benefits

- Secure cookie-to-Bearer translation.
- Same-origin API for browser.
- Backend errors/status preserved.
- One place for refresh/tracing/security policy.

### Note

BFF duplicated business logic ka place nahi. Accounting, tenancy and authorization FastAPI mein authoritative rehte hain.

### Interview questions

**Q1. BFF proxy aur business backend mein difference?**  
BFF client-specific transport/session adaptation karta hai; FastAPI domain rules and database operations own karta hai.

**Q2. Route Handler server par run hota hai?**  
Haan, isi liye HttpOnly cookie read aur private backend URL use kar sakta hai.

**Q3. Backend status preserve kyun?**  
TanStack/UI ko `401`, `403`, `409`, `422` ke accurate meanings milte hain.

**Q4. Direct FastAPI call kab useful hoti?**  
Swagger, mobile/external client ya trusted server integration; browser app BFF path use karti hai.

---

## Skill 31 — HttpOnly sessions, Next Proxy and idle guard

### Define

Next Proxy protected request page render se pehle inspect karta hai. Access cookie missing ho aur refresh available ho to token renewal attempt karta hai. Idle guard browser activity track karke inactive user logout karta hai.

### Problem

Expired access token par protected pages fail hotin; unauthenticated user protected UI open kar sakta; shared computer par inactive open session risk tha.

### LedgerLite solution

Proxy `/dashboard`, `/customers`, `/invoices`, `/journey` match karta hai. Valid access ho to pass; refresh ho to FastAPI refresh call and cookie replace; failure par cookies clear and login redirect. Client guard activity events ke baad 2-hour inactivity logout karta hai.

### Code

```ts
if (accessToken) return NextResponse.next();
if (!refreshToken) {
  return NextResponse.redirect(new URL("/login", request.url));
}

const backendResponse = await fetch(`${apiUrl}/auth/refresh`, {
  method: "POST",
  body: JSON.stringify({ refresh_token: refreshToken }),
});
```

### Benefits

- Protected navigation before page content.
- Transparent session renewal.
- Failed refresh safely returns login.
- Inactive shared-device session closes earlier.

### Note

JWT expiry fixed token lifetime hai; idle timeout user interaction-based policy hai. Dono different problems solve karte hain. Proxy cookie presence fast gate hai; FastAPI signature/DB/security final authority hai.

### Interview questions

**Q1. Cookie present hone ka matlab authenticated?**  
Nahi. Cookie malformed/expired/revoked ho sakti hai. FastAPI final verification karta hai.

**Q2. `push`, `replace` aur redirect?**  
`push` browser history entry add; `replace` current entry swap; server/proxy redirect HTTP navigation decision hai.

**Q3. Idle logout expiry se pehle ho sakta hai?**  
Haan. No interaction for configured duration par client logout route call karke session revoke/clear karta hai.

**Q4. Already typed unsaved form idle logout par?**  
Current guard activity input/keyboard events ko activity count karta hai; active typing timer reset karti hai. True inactivity par unsaved state intentionally retained nahi hoti.

---

# Part F — Frontend forms, state and user experience

## Skill 32 — React Hook Form and Zod

### Define

React Hook Form input registration, validation state, submission and dynamic fields efficiently manage karta hai. Zod runtime schema validation aur TypeScript inference deta hai.

### Problem

Manual `useState` per field, duplicated validation, unclear error messages aur invoice ke dynamic line items manage karna complex hota.

### LedgerLite solution

Login, signup, customer, invoice, payment and reversal forms `useForm` + `zodResolver` use karte hain. Invoice line items `useFieldArray`; totals preview `useWatch` se update hota hai.

### Code

```ts
export const invoiceFormSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  taxRate: z.coerce.number().min(0).max(100),
  lineItems: z.array(lineItemSchema).min(1),
});

const {
  register,
  control,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<InvoiceFormValues>({
  resolver: zodResolver(invoiceFormSchema),
});

const { fields, append, remove } = useFieldArray({
  control,
  name: "lineItems",
});
```

### Benefits

- Field-level clear errors.
- Less rerender/boilerplate.
- Form values strongly typed.
- Dynamic arrays manageable.

### Note

Frontend Zod fast UX validation hai; security boundary nahi. Backend Pydantic same critical limits independently enforce karta hai.

### Interview questions

**Q1. `formState.errors` kya hai?**  
Resolver/field validation se har field ki current error information.

**Q2. `isSubmitting` kya solve karta hai?**  
Async submit ke dauran button disable/loading state aur duplicate submission prevention.

**Q3. `zodResolver` ka role?**  
Zod validation result ko React Hook Form ke values/errors contract mein translate karta hai.

**Q4. `useFieldArray` kyun?**  
Invoice items add/remove karte waqt stable field IDs, registration and errors manage karta hai.

**Q5. Zod aur TypeScript overlap?**  
TypeScript compile time; Zod runtime user/network values. Dono complementary hain.

---

## Skill 33 — TanStack Query server-state management

### Define

TanStack Query remote/server state ko fetch, cache, retry, invalidate and synchronize karta hai. `useQuery` reads; `useMutation` writes; `useInfiniteQuery` page-by-page loading.

### Problem

Manual `useEffect` fetching mein loading/error/cache/race/refetch code repeat hota. Create/edit/delete ke baad multiple screens stale reh sakti thin.

### LedgerLite solution

One `QueryClientProvider` global rules deta hai. Feature hooks stable query keys define karte hain. Successful mutations relevant list/detail/invoice/payment queries invalidate karti hain. Login/logout par cache clear hoti hai.

### Code

```ts
export function useCustomers(page: number, size: number) {
  return useQuery({
    queryKey: ["customers", page, size],
    queryFn: () => getCustomers(page, size),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
```

### Benefits

- Shared server-state cache.
- Declarative loading/error/data.
- Automatic refetch and deduplication.
- Mutations ke baad consistent fresh data.

### Note

Payment/financial mutations optimistic update nahi kartin. Backend row lock and authoritative balance ke baad cache invalidate/refetch safer hai.

### Interview questions

**Q1. `useQuery` vs `useMutation`?**  
Query read/cacheable data; mutation create/update/delete side effect.

**Q2. Query key kya hai?**  
Cache identity. Resource, tenant/session-relevant scope and parameters stable key mein hone chahiye.

**Q3. Invalidate kya karta hai?**  
Matching cached data stale mark karta hai aur active query ko refetch karwa sakta hai.

**Q4. Login/logout par `queryClient.clear()` kyun?**  
Previous organization ka cached sensitive UI data next account ko na mile.

**Q5. `useInfiniteQuery` kahan?**  
Invoice customer selector server search ke results 100-per-page load-more flow mein.

**Q6. Client cache database hai?**  
Nahi. Temporary UX copy hai; source of truth backend/database hai.

---

## Skill 34 — Dynamic routes and complete CRUD UI states

### Define

CRUD Create, Read, Update, Delete operations hain. A robust UI success ke saath loading, error, empty, forbidden, conflict and not-found states bhi handle karti hai.

### Problem

Static list real backend behavior demonstrate nahi karti. Slow/error response par blank screen aur wrong ID par crash poor UX thi.

### LedgerLite solution

Customer list/create/detail/edit/delete complete hai. Invoice list/create/detail/edit/void and payment record/history/reverse implemented hain. Dynamic `[id]` pages validate route ID and backend `404` ko not-found experience mein map karti hain.

### Code

```tsx
if (query.isPending) return <LoadingCard />;
if (query.isError) return <ErrorCard message={getErrorMessage(query.error)} />;
if (!query.data?.items.length) return <EmptyState />;

return query.data.items.map((customer) => (
  <Link key={customer.id} href={`/customers/${customer.id}`}>
    {customer.display_name}
  </Link>
));
```

### Benefits

- Every network state visible.
- Direct URL navigation works.
- Backend status meaningful UI mein translate.
- Full-stack workflow portfolio proof.

### Note

IDs sequential primary keys ho sakti hain; obscuring ID security nahi. Tenant authorization backend par zaroori hai. UUID optional product decision ho sakta hai.

### Interview questions

**Q1. Dynamic route build time par banti hai?**  
Route pattern build hota hai; current server/runtime request ka ID data fetch karta hai unless explicitly static params generate kiye hon.

**Q2. Why loading/error/empty separately?**  
In teen states ka meaning/action different hai: wait, retry/fix, ya first resource create.

**Q3. Delete ke baad kya?**  
Mutation succeeds, list/detail cache invalid hoti aur user suitable list route par navigate karta hai.

**Q4. `PATCH` vs `PUT`?**  
PATCH partial fields update karta hai; PUT conventionally full resource replacement hota hai.

---

## Skill 35 — Tailwind CSS, responsive UX and accessibility

### Define

Tailwind utility-first CSS framework hai. Responsive design breakpoints par layout adapt karta hai. Accessibility keyboard, semantic, label, focus, contrast and assistive-tech needs cover karti hai.

### Problem

Desktop-only tables/forms small screens par overflow aur unusable hote. Icon-only/unlabelled controls keyboard/screen-reader users ke liye unclear hote.

### LedgerLite solution

Mobile-first Tailwind classes, responsive grids/cards, visible focus states, semantic forms/buttons, labels, status text and contrast-conscious colors use huye.

### Code

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  ...
</section>

<button
  type="submit"
  disabled={isSubmitting}
  className="rounded-xl bg-[#1267c9] px-4 py-3 font-black text-white
             focus-visible:outline-4 focus-visible:outline-offset-2
             focus-visible:outline-[#ffd65a] disabled:opacity-60"
>
  Save
</button>
```

### Benefits

- Consistent design tokens/utilities.
- Small and large screens usable.
- Keyboard feedback and readable form states.
- Faster component styling.

### Note

Responsive-looking UI automatic accessibility guarantee nahi. Automated checks plus keyboard/screen-reader/manual testing future production verification ka hissa honi chahiye.

### Interview questions

**Q1. Mobile-first breakpoint ka matlab?**  
Base classes small screens par apply; `md:`/`lg:` progressively larger screens par override/add karti hain.

**Q2. Disabled button enough loading UX hai?**  
Duplicate submit rokti hai, magar visible text/spinner/status bhi user ko progress batana chahiye.

**Q3. Focus-visible kyun?**  
Keyboard navigation par clear focus indicator without every mouse click par unnecessary ring.

**Q4. Semantic button vs clickable div?**  
Button keyboard behavior, focus and accessibility semantics built-in deta hai.

---

# Part G — LedgerLite domain workflows

## Skill 36 — Customer CRUD and organization-safe deletion

### Define

Customer workflow tenant-scoped create/list/search/read/update/delete resource management hai.

### Problem

Duplicate email, cross-company access aur invoiced customer deletion accounting references ko corrupt kar sakti thi.

### LedgerLite solution

Customer rows organization foreign key/unique email rule use karti hain. Every query tenant-scoped. Invoice FK `RESTRICT` and route conflict handling linked customer delete block karte hain.

### Code

```python
customer = Customer(
    organization_id=current_user.organization_id,
    display_name=payload.display_name,
    email=payload.email,
)
session.add(customer)

try:
    await session.commit()
except IntegrityError:
    await session.rollback()
    raise HTTPException(status_code=409, detail="Customer email already exists.")
```

### Benefits

- Complete practical CRUD.
- Tenant and relational integrity.
- Search/pagination ready.

### Note

Current delete hard-delete hai but invoiced customer restricted. Mature accounting system customer archiving/soft-delete prefer kar sakta hai.

### Interview questions

**Q1. Duplicate email global hai?**  
Nahi. `(organization_id, email)` combination unique hai; different companies same email use kar sakti hain.

**Q2. Invoiced customer delete kyun blocked?**  
Historical invoice ka customer reference/audit meaning preserve karne ke liye.

**Q3. Search backend par kyun?**  
All tenant rows search hoti hain, sirf current loaded page nahi.

---

## Skill 37 — Invoice lifecycle, line items and automatic numbering

### Define

Invoice aggregate header, multiple line items, calculated totals, status and organization-scoped number combine karta hai.

### Problem

Client-supplied totals/numbers duplicate or manipulated ho sakte thay. Simultaneous invoice creation same number generate kar sakti thi. Paid invoice edit financial history change kar sakta tha.

### LedgerLite solution

Backend tenant customer verify, organization row lock, next sequence generate, Decimal totals calculate and header/items one transaction mein save karta hai. Edit only issued/unpaid; void owner-only and paid/reversed rules respect karta hai.

### Code

```python
organization = (
    await session.execute(
        select(Organization)
        .where(Organization.id == current_user.organization_id)
        .with_for_update()
    )
).scalar_one()

invoice_number = f"INV-{today.year}-{organization.next_invoice_sequence:04d}"
organization.next_invoice_sequence += 1

totals = calculate_invoice(payload.line_items, payload.tax_rate)
```

### Benefits

- Unique human-readable tenant invoice numbers.
- Server-authoritative exact totals.
- Consistent lifecycle/status rules.
- Atomic invoice + items save.

### Note

Current sequence organization-wide increment karti hai; year label change hone par automatic annual reset implemented nahi. Invoice PDF/download bhi abhi pending.

### Interview questions

**Q1. Invoice number frontend se kyun remove kiya?**  
Server uniqueness/concurrency control own karta hai; user accidental duplicate number nahi bhejta.

**Q2. Organization row lock number generation mein kyun?**  
Concurrent creates same `next_invoice_sequence` consume na kar saken.

**Q3. `selectinload(line_items)` kyun?**  
Invoice list/detail ke related items efficient additional IN query se eager load hote hain; async lazy-load surprises/N+1 reduce hote hain.

**Q4. Paid invoice edit kyun block?**  
Payment amount/status historical totals se tied hain; edit audit inconsistency create karega.

**Q5. Void delete se better kyun?**  
Accounting history preserve hoti hai; record status se cancelled meaning show karta hai.

---

## Skill 38 — Payments, overpayment protection and reversal audit

### Define

Payment invoice balance reduce karta hai. Reversal original payment ko delete kiye baghair cancel/audit mark karke balance restore karti hai.

### Problem

Concurrent payments overpay kar sakti thin. Payment delete karne se kis ne/kab/kyun reverse kiya history lost hoti. Client-side balance calculation stale ho sakti thi.

### LedgerLite solution

Payment route invoice row lock karti, positive amount and available balance validate, payment insert and invoice totals/status same transaction commit karti hai. Owner reversal payment/invoice lock, reversal actor/time/reason save aur balance/status recalculate karti hai.

### Code

```python
invoice = await get_locked_tenant_invoice(session, invoice_id, organization_id)

if payload.amount > invoice.balance_due:
    raise HTTPException(status_code=409, detail="Payment exceeds balance due.")

apply_payment(invoice, payload.amount)
session.add(Payment(
    organization_id=organization_id,
    invoice_id=invoice.id,
    amount=payload.amount,
    method=payload.method,
))
await session.commit()
```

### Benefits

- Accurate current balance.
- Concurrent overpayment protection.
- Reversible but auditable history.
- UI refetches backend-authoritative balance.

### Note

This is payment recording, external card processing nahi. Stripe webhook integration implemented nahi.

### Interview questions

**Q1. Payment and invoice update one transaction kyun?**  
Payment row save ho magar balance update fail, ya vice versa, to inconsistent financial state banegi.

**Q2. Payment reversal delete kyun nahi?**  
Audit trail preserve karna accounting requirement hai.

**Q3. Reversal owner-only kyun?**  
Financial correction high-impact privileged action hai.

**Q4. Optimistic UI payment ke liye kyun avoid?**  
Balance concurrent transactions/locks ke baad backend decide karta hai; guessed optimistic amount stale/wrong ho sakta hai.

**Q5. Invoice statuses kaise change hote hain?**  
Zero paid = issued, partial balance = partially_paid, zero balance = paid; void separate terminal business state hai.

---

## Skill 39 — Learning-mode request visualization

### Define

Learning mode real async request ko visual steps ke saath minimum demo duration deta hai. Environment flag production UX se teaching delay separate karta hai.

### Problem

Fast request mein learner ko browser → BFF → auth → database journey observe nahi hoti. Production user ko artificial 5-second delay dena unacceptable hota.

### LedgerLite solution

`NEXT_PUBLIC_LEARNING_MODE=true` par request and 5000ms timer parallel run karte hain; result timer se pehle return nahi. Production/default example false hai.

### Code

```ts
export const LEARNING_MODE =
  process.env.NEXT_PUBLIC_LEARNING_MODE === "true";
export const REQUEST_DEMO_MS = LEARNING_MODE ? 5000 : 0;

export async function withMinDuration<T>(request: Promise<T>): Promise<T> {
  const [result] = await Promise.allSettled([
    request,
    new Promise((resolve) => setTimeout(resolve, REQUEST_DEMO_MS)),
  ]);
  if (result.status === "rejected") throw result.reason;
  return result.value;
}
```

### Benefits

- Request architecture visible.
- Real request and animation remain linked.
- Production can remain fast.

### Note

Timer request ke parallel hai: real request 7 seconds le to total 7, additional 5 nahi. `NEXT_PUBLIC_` flag build/start time par bundle hota hai; change ke baad dev server restart chahiye.

### Interview questions

**Q1. `Promise.allSettled` kyun?**  
Request reject ho tab bhi timer/animation complete state safely observe karke original error rethrow kar sakte hain.

**Q2. Production default false kyun?**  
Artificial latency real user experience aur performance metrics harm karti hai.

**Q3. Kya animation backend security prove karti hai?**  
Nahi. Teaching visualization hai; actual status/tests/logs/backend guards proof hain.

---

# Part H — Build quality and honest boundaries

## Skill 40 — Typecheck, ESLint, Turbopack and production build

### Define

Typecheck TypeScript contracts validate karta hai. ESLint code-quality rules check karta hai. Turbopack Next.js dev/build bundler hai. Production build routes and server/client compilation verify karta hai.

### Problem

App browser mein ek path par chal sakti hai magar unused vars, wrong union property, server/client boundary ya production prerender error hidden reh sakta hai.

### LedgerLite solution

Frontend completion checks:

### Code

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Backend:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

### Benefits

- Compile-time errors early.
- Consistent Next/React rules.
- Production-only failures before deployment.
- Automated regression proof.

### Note

Checks passing correctness ka complete proof nahi. User workflows, security and accessibility testing bhi chahiye. GitHub Actions CI currently pending hai.

### Interview questions

**Q1. Typecheck aur build separate kyun?**  
Typecheck focused/faster contract check; build bundling, route analysis, prerender and production integration verify karta hai.

**Q2. Lint kya pakarta hai?**  
Unused variables, hooks/rules and configured code-quality problems jo type system zaroori nahi pakarta.

**Q3. Dev server success enough?**  
Nahi. Dev mode lazy compile/hot reload karta hai; production build different optimization and route analysis use karta hai.

---

## Skill 41 — Metadata and basic SEO

### Define

Next.js metadata page title/description and search/social discovery information generate karti hai.

### Problem

Generic/no title app ko browser tabs, search preview aur sharing mein unclear banata.

### LedgerLite solution

Root layout basic title and description export karta hai.

### Code

```ts
export const metadata: Metadata = {
  title: "LedgerLite",
  description: "A focused accounting workspace for customers, invoices, and payments.",
};
```

### Benefits

- Meaningful browser/search identity.
- Server-generated metadata.

### Note

Authenticated dashboard ka SEO limited value rakhta hai. Public marketing page ke liye Open Graph images, canonical URLs, sitemap, robots and structured data abhi pending hain.

### Interview questions

**Q1. Dashboard ko SEO kyun kam chahiye?**  
Private authenticated content search engines ko index nahi karna chahiye; SEO focus public landing/docs par hota hai.

**Q2. Metadata server par kyun?**  
Crawler ko initial HTML/head mein title/description milte hain.

---

## Skill 42 — React 19, JSX, components, props, state and hooks

### Define

React declarative component-based UI library hai. JSX JavaScript syntax extension hai jo UI tree describe karti hai. Props parent se input, state component ki changing memory, aur hooks React features access karte hain.

### Problem

Vanilla DOM updates mein developer ko manually elements create/update aur UI state synchronize karna padta. LedgerLite mein forms, modals, pagination, language toggle, loading states aur request animation continuously change hote hain.

### LedgerLite solution

UI reusable function components mein divided hai. Props data/actions pass karti hain, `useState` local interaction, `useEffect` activity/keyboard listeners, `useMemo` derived notebook pages, `useCallback` stable navigation function aur array methods lists render/filter karti hain.

### Code

```tsx
type StatusBadgeProps = {
  status: "issued" | "partially_paid" | "paid" | "void";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusStyles[status]}>{status}</span>;
}
```

```tsx
const [pageIndex, setPageIndex] = useState(0);

const goTo = useCallback((target: number) => {
  setPageIndex(Math.max(0, Math.min(pages.length - 1, target)));
}, [pages.length]);

return customers.map((customer) => (
  <CustomerRow key={customer.id} customer={customer} />
));
```

### Benefits

- Reusable composable UI.
- State change par declarative rerender.
- Props/types se clear component contracts.
- Hooks se effects and derived values organized.

### Note

State mutate nahi karni; setter use karna hai. Previous state par dependent update ke liye functional form use hoti hai: `setCount((previous) => previous + 1)`. Stable unique `key` React ko list items correctly reconcile karne mein madad deti hai.

### Interview questions

**Q1. JSX kya hai?**  
JavaScript/TypeScript ke andar HTML-like syntax jo build time par React element calls mein transform hoti hai. `<h1>` and `<p>` JSX elements hain.

**Q2. Component kya hai?**  
Reusable function jo props lekar React UI return karti hai.

**Q3. Props vs state?**  
Props parent-provided read-only input; state component-owned changing data.

**Q4. Functional state update kyun?**  
New value previous state par depend ho to queued/batched updates ke against latest previous value safely milti hai.

**Q5. `useEffect` kab?**  
React ke bahar external system synchronize karne ke liye, jaise event listener/timer; derived render value calculate karne ke liye normally nahi.

**Q6. Effect cleanup kyun?**  
Listener/timer duplicate ya memory leak na ho jab component rerender/unmount ho.

**Q7. `map`, `filter`, `reduce`?**  
`map` har item transform/render; `filter` condition matching subset; `reduce` collection ko one accumulated result, jaise total, mein combine karta hai.

**Q8. List `key` mein index kyun avoid?**  
Insert/reorder par index identity badalti hai aur wrong DOM/state reuse ho sakta hai. Database ID stable key hai.

**Q9. `useMemo` aur `useCallback`?**  
`useMemo` calculated value cache; `useCallback` function reference cache. Sirf real identity/performance need par use karna, har jagah nahi.

**Q10. Controlled aur uncontrolled form?**  
Controlled input value React state se driven. React Hook Form mostly refs/uncontrolled approach use karke fewer rerenders deta hai, while form library state manage karti hai.

---

## Skill 43 — Installed vs actually implemented skills

### Define

Dependency installed hona implementation proof nahi. Interview claim tab strong hai jab project mein real import, behavior, test and problem evidence ho.

### Problem

`package.json` ya `requirements.txt` dekh kar har dependency ko project experience kehna overclaim hota. Transitive packages aur unused packages par interviewer follow-up code pooch sakta hai.

### LedgerLite solution

Implemented, partially implemented, installed-but-unused aur pending skills ko explicitly separate kiya gaya hai. Neeche wali truth table CV answer ki honest boundary hai.

### Code

```powershell
# Dependency declaration milna implementation proof nahi:
rg -n 'axios' frontend/src
rg -n 'websocket|socket.io' backend/app frontend/src

# Real implementation evidence ke liye imports, calls, tests and behavior dekhein.
```

### LedgerLite truth table

| Technology/skill | Honest answer |
|---|---|
| Axios | Implemented in `http-client.ts`: typed calls, interceptors, error normalization aur one-time 401 refresh/retry |
| WebSockets | Uvicorn dependency available, app WebSocket feature nahi |
| OpenTelemetry | Dependency present, tracing instrumentation nahi |
| Node.js | Next.js runtime/tooling mein indirect; Express backend nahi |
| Express.js | Not used |
| Prisma ORM | Not used; SQLAlchemy is ORM |
| MongoDB/Mongoose | Not used; PostgreSQL is database |
| Socket.io | Not used |
| BullMQ | Not used |
| Pino | Not used; Python structured logging used |
| Stripe webhooks | Not implemented |
| QuickBooks OAuth2 | Not implemented in LedgerLite |
| Chart.js | Implemented on the reports dashboard |
| HTML Canvas | Not used |
| Vitest/Jest/Supertest | Not used in this project |
| Playwright | Not implemented yet |
| GitHub Actions | No workflow yet |
| Vercel/backend deployment | Not completed yet |
| Explicit CSRF token | Not implemented; SameSite cookie mitigation exists |
| Full Docker app stack | DB/Redis only; API/frontend images pending |

### Benefits

- Interview answers credible rehte hain.
- Relevant follow-up code confidently explain hota hai.
- Future learning gaps clear roadmap ban jate hain.

### Note

“Exposure” aur “implemented in production-style project” same claim nahi. Jo skill separate project mein use ho uska evidence usi project se dena chahiye.

### Interview questions

**Q1. Axios LedgerLite mein kahan aur kyun use hua?**  
Browser data layer mein shared Axios client `/api` BFF ko call karta hai. Interceptors request trace karte, FastAPI errors normalize karte aur pehle `401` par refresh karke original request sirf ek martaba retry karte hain. Server Components aur Route Handlers server-side work ke liye native `fetch()` use karte hain.

**Q2. Prisma aur SQLAlchemy dono kyun nahi?**  
Ye alternative ORMs/ecosystems hain. FastAPI/Python project ke liye SQLAlchemy natural choice hai; Prisma ko separate Node/TypeScript project mein demonstrate karna cleaner hai.

**Q3. Jest/Supertest ke equivalent LedgerLite mein?**  
FastAPI stack mein pytest + HTTPX AsyncClient integration testing equivalent responsibility fulfill karte hain.

**Q4. Kya project production-ready hai?**  
“It is production-minded and demonstrates strong security/accounting patterns, but frontend tests, CI/CD, full containerization, deployment, explicit CSRF hardening and monitoring integration are remaining production steps.”

---

## Skill 44 — Axios typed client, interceptors and refresh retry

### Define

Axios promise-based HTTP client hai. Instance shared base configuration rakhti hai; interceptors request bhejne se pehle aur response/error milne ke baad centralized logic chala sakte hain.

### Problem

Har feature mein base URL, JSON handling, FastAPI error parsing aur expired access token refresh repeat karna duplication aur inconsistent behavior deta. Direct browser-to-FastAPI call token boundary aur CORS ko bhi complex karti.

### LedgerLite solution

Browser features shared `httpClient` se same-origin `/api` BFF call karte hain. Typed generics response contract deti hain. Request/response interceptors learning trace record karte hain. Error interceptor FastAPI `detail` ko `ApiError` banata hai. Pehle `401` par raw Axios `/api/auth/refresh` call hoti hai aur original request `_retry` flag ke saath sirf ek martaba repeat hoti hai.

### Code

```ts
export const httpClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig;

    if (error.response?.status !== 401 || request._retry) {
      return Promise.reject(toApiError(error));
    }

    request._retry = true;
    await axios.post("/api/auth/refresh");
    return httpClient(request);
  },
);
```

```ts
const response = await httpClient.get<MemberPage>("/members", {
  params: { page, size },
});
```

### Benefits

- Features mein consistent typed HTTP calls.
- FastAPI errors user-friendly message mein normalize.
- Expired access token par centralized one-time recovery.
- HttpOnly tokens browser JavaScript ko expose nahi hote.
- Timeout aur request tracing ek jagah configured.

### Note

Axios browser data layer ke liye hai. Next.js Server Components aur Route Handlers server-side native `fetch()` use karte hain. Refresh request raw `axios.post()` use karti hai taake same `httpClient` interceptor recursively khud ko trigger na kare. `_retry` infinite refresh loop rokta hai.

### Interview questions

**Q1. Axios instance kyun banayi?**  
Base URL, JSON header, timeout aur interceptors ko har feature mein repeat karne ke bajaye ek consistent client mila.

**Q2. Request aur response interceptor mein farq?**  
Request interceptor request dispatch se pehle config inspect/change karta hai. Response interceptor success response ya error ko centrally transform/recover karta hai.

**Q3. `401` par original request sirf ek martaba kyun retry hoti hai?**  
Refresh bhi fail ho to unlimited loop/network storm na bane. `_retry` second automatic attempt block karta hai.

**Q4. Refresh ke liye shared `httpClient` kyun nahi?**  
Wohi client use karne par refresh ka `401` interceptor ko dobara trigger karke recursion bana sakta tha; raw Axios call is cycle ko avoid karti hai.

**Q5. Axios token header khud kyun attach nahi karta?**  
Access token HttpOnly cookie mein hai aur client JavaScript usay read nahi kar sakti. Browser `/api` BFF ko call karta hai; Route Handler cookie read karke FastAPI ko Bearer header deta hai.

**Q6. Generic `<MemberPage>` runtime validation hai?**  
Nahi. Ye compile-time TypeScript contract hai. Runtime response correctness backend Pydantic contract/tests par depend karti hai; untrusted third-party data ke liye runtime parsing add karni chahiye.

**Q7. FastAPI `detail` normalize kyun?**  
Axios ka generic “Request failed” message business conflict explain nahi karta. `toApiError()` `409`, `403` aur backend detail ko UI tak meaningful form mein pohanchata hai.

**Q8. Axios aur TanStack Query ka role difference?**  
Axios network request karta hai. TanStack Query server-state caching, loading/error state, retries aur invalidation manage karti hai.

---

## Skill 45 — Reporting aggregates, invoice filters and Chart.js

### Define

Reporting endpoint raw rows ke bajaye database aggregates, jaise `COUNT` aur `SUM`, se dashboard-ready summary banata hai. Server-side filters query parameters ke mutabiq database mein hi result set chhota karte hain. Chart.js structured counts ko responsive visual chart mein render karta hai.

### Problem

Dashboard sirf first customer page se total dikha raha tha. Invoice totals nikalne ke liye frontend ko saari paginated invoices mangwana parta, jo slow aur incomplete hota. Different currencies ko add karna accounting mistake hoti. Invoice register mein status/customer filtering bhi nahi thi.

### LedgerLite solution

`GET /reports/summary` authenticated organization ke customers aur invoices aggregate karta hai. Har query `organization_id` se scoped hai. Invoice status counts overall aate hain, jabke financial totals currency ke mutabiq group hote hain. Void invoices invoiced total se exclude hote hain. `GET /invoices` optional `status` aur `customer_id` filters ko count aur rows dono par apply karta hai. Next.js BFF cookie se token forward karta hai; TanStack Query summary cache karti hai; Chart.js status doughnut render karta hai.

### Code

```python
filters = [Invoice.organization_id == current_user.organization_id]
if invoice_status is not None:
    filters.append(Invoice.status == invoice_status)
if customer_id is not None:
    filters.append(Invoice.customer_id == customer_id)

select(Invoice).where(*filters).offset(pagination.offset).limit(pagination.size)
```

```python
select(
    Invoice.currency,
    func.sum(
        case(
            (Invoice.status != "void", Invoice.total),
            else_=Decimal("0.00"),
        )
    ),
    func.sum(Invoice.amount_paid),
    func.sum(Invoice.balance_due),
).where(
    Invoice.organization_id == organization_id
).group_by(Invoice.currency)
```

```ts
const response = await httpClient.get<DashboardSummary>("/reports/summary");

useQuery({
  queryKey: ["dashboard-summary"],
  queryFn: () => withMinDuration(getDashboardSummary()),
});
```

### Benefits

- Frontend ko ek predictable dashboard contract milta hai.
- Pagination ke bawajood totals complete rehte hain.
- Tenant A ka data Tenant B ke aggregates mein nahi aata.
- PKR aur USD ko ghalat tarah add nahi kiya jata.
- Filters database mein apply hote hain, browser mein incomplete page par nahi.
- Chart.js responsive status distribution deta hai.
- Customer, invoice aur payment mutations summary cache invalidate karti hain.

### Note

Endpoint internally multiple focused aggregate queries chalata hai; “one request” ka matlab lazmi “one SQL query” nahi. Current report lifetime totals deta hai. Date-range aur monthly revenue series future enhancement hain. Chart visualization accessibility ke liye labels ke saath use hoti hai; chart akela information source nahi.

### Interview questions

**Q1. Dashboard totals frontend par `reduce()` se kyun nahi nikale?**
Invoice list paginated hai, is liye frontend ke paas sirf current page hota. Backend aggregate poore tenant dataset par accurate result deta hai.

**Q2. Har report query mein `organization_id` kyun?**
Authentication user batati hai; tenant filter decide karta hai ke us user ko kis company ka data mil sakta hai. Filter ke baghair cross-company data leak ho sakta hai.

**Q3. Currency-wise grouping kyun ki?**
PKR 100 aur USD 100 ko 200 kehna meaningless hai. Har currency ke invoiced, paid aur outstanding totals separate rakhne chahiye.

**Q4. Void invoice total revenue mein kyun nahi?**
Void invoice historical record rehti hai magar active financial claim nahi. Is liye count mein void status dikh sakta hai, lekin invoiced money total se exclude hota hai.

**Q5. Status filter ka invalid value kya karta hai?**
FastAPI `Literal` validation unsupported status ko query chalne se pehle `422` response se reject karti hai.

**Q6. Count query aur list query ko same filters kyun chahiye?**
Pagination metadata aur visible rows consistent rehne chahiye. Agar count unfiltered ho to pages aur total ghalat honge.

**Q7. TanStack query key mein filters kyun hain?**
`paid`, `issued` aur customer-specific results different server states hain. Filter key mein na ho to wrong cached list show ho sakti hai.

**Q8. Dashboard cache kab refresh hoti hai?**
Customer create/delete, invoice create/update/void aur payment create/reverse ke baad `dashboard-summary` invalidate hoti hai, phir authoritative backend totals refetch hote hain.

**Q9. Chart.js ka project mein actual use kya hai?**
Dashboard ka doughnut chart issued, partially paid, paid aur void invoice counts ko responsive visual mein show karta hai.

**Q10. One request aur one SQL query same hain?**
Nahi. Browser ek summary endpoint call karta hai; backend clarity aur currency correctness ke liye multiple efficient aggregate queries chala sakta hai.

---

# Complete request journeys

## Login journey

```text
Login form
  -> Zod validates
  -> Next.js /api/auth/login Route Handler
  -> FastAPI /auth/login
  -> Redis rate limit check
  -> PostgreSQL user lookup
  -> Argon2 password verify
  -> JWT access + rotating refresh record
  -> Next.js HttpOnly cookies
  -> Query cache clear
  -> Dashboard
```

## Protected read journey

```text
TanStack useQuery
  -> same-origin Next.js BFF
  -> HttpOnly access cookie read on server
  -> Authorization: Bearer
  -> FastAPI dependency chain
  -> signature/expiry/JTI/version/user/role checks
  -> organization_id scoped SQLAlchemy query
  -> PostgreSQL
  -> Pydantic response
  -> BFF status/JSON
  -> TanStack cache
  -> loading/error/empty/data UI
```

## Team and organization settings journey

```text
Owner opens /team or user opens /settings
  -> Server Component reads current authenticated user
  -> role-aware navigation hides owner-only Team link from members
  -> React Hook Form + Zod validates create/update values
  -> Axios calls same-origin Next.js BFF
  -> Route Handler reads HttpOnly access cookie
  -> FastAPI authenticates current user
  -> get_current_owner protects member changes/organization PATCH
  -> organization_id scopes member query
  -> PostgreSQL commit or 409 rollback
  -> TanStack invalidates member/organization cache
  -> UI refetches authoritative data
```

## Invoice creation journey

```text
React Hook Form + Zod line items
  -> BFF POST /api/invoices
  -> Pydantic validation
  -> authenticated tenant
  -> customer belongs to tenant
  -> lock organization sequence
  -> generate invoice number
  -> Decimal totals on server
  -> save invoice + line items transaction
  -> commit
  -> invalidate list/detail cache
  -> render authoritative totals
```

## Payment journey

```text
Payment form
  -> Zod positive amount
  -> BFF POST
  -> Pydantic + auth + tenant
  -> SELECT invoice FOR UPDATE
  -> reject void/paid/overpayment
  -> insert payment
  -> update amount_paid, balance_due, status
  -> one commit or rollback
  -> invalidate payments + invoice list/detail
  -> refetch authoritative balance
```

---

# Final interview answer template

Kisi bhi skill par answer is pattern mein dein:

> **[Definition]** SQLAlchemy is a Python ORM and SQL toolkit.  
> **[Problem]** LedgerLite needed persistent relational data without repeating raw connection and mapping code.  
> **[Solution]** I used SQLAlchemy 2 with asyncpg, an async engine, per-request AsyncSession and tenant-scoped typed queries.  
> **[Code evidence]** The engine/session live in `app/db/session.py`, models in `app/models`, and routes execute `select()` statements through the injected session.  
> **[Benefit]** This gave connection pooling, transactions, typed table mapping and reusable queries.  
> **[Note]** I still understand the generated SQL; ORM does not remove the need for indexes, transaction design and query analysis.

Har jawab mein isi sequence ko follow karein. Agar feature pending ho to seedha pending batayein; overclaim interview mein follow-up question par sab se jaldi expose hota hai.




