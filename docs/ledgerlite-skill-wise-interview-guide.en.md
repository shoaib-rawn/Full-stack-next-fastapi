# LedgerLite Skill-Wise Interview Master Guide

This is LedgerLite's **single interview revision file**. It contains only the skills and patterns that are actually used in the project's code. Each skill has multiple interview questions.

## The formula for every answer

In an interview, explain each skill in this order:

1. **Define:** What is this thing?
2. **Problem:** What was the problem in the app without it?
3. **LedgerLite solution:** Where and how did we use it?
4. **Code:** A small, relevant part of the actual implementation.
5. **Benefits:** What advantage did this design give?
6. **Note:** A limitation, trade-off or honest boundary.

Do not memorize code. Understand the request journey and the decision behind each snippet.

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

Python type hints document the expected type of data. `async def` creates a coroutine, and `await` hands control back to the event loop until the I/O operation completes.

### Problem

The database and Redis are network I/O. Waiting synchronously could block the worker for every request. Untyped payloads risked wrong values and unclear function contracts.

### LedgerLite solution

Routes, services and dependencies are typed async functions. Database calls are `await`ed and return types are written explicitly.

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

- While waiting on I/O, the server can handle other requests.
- The IDE and type checker understand the contracts.
- A route's input and output are easy to review.

### Note

Async does not automatically make CPU-heavy work faster. In JavaScript it is called a Promise; in Python the terminology is coroutine/awaitable.

### Interview questions

**Q1. What does `async def` return?**  
Calling it returns a coroutine object. You generally need `await` to get the result.

**Q2. Why was `await` used on the database call?**  
The database response is network I/O. `await` collects the completed result and lets the event loop do other work while waiting.

**Q3. Should every function be async?**  
No. Pure calculations, such as Decimal totals, can stay normal synchronous functions. Async is useful for operations that wait on I/O.

**Q4. Does a type hint do runtime validation?**  
A normal Python type hint does not do runtime validation by itself. Pydantic performs the actual runtime validation at the API boundary.

---

## Skill 2 — FastAPI application and APIRouter

### Define

FastAPI is a Python ASGI framework. `FastAPI()` is the main application object; `APIRouter` groups related endpoints by resource.

### Problem

Keeping all endpoints in `main.py` would make the file large, mixed and hard to maintain. The concerns of customers, invoices, auth and payments needed to be separated.

### LedgerLite solution

Each domain's router lives in its own file, and `main.py` registers those routers with the application.

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
- Endpoints are grouped by domain in Swagger.
- Features are easy to locate, test and extend.

### Note

A route handles the HTTP concern. Reusable business calculations should stay in `services/`.

### Interview questions

**Q1. What is the difference between `FastAPI()` and `APIRouter()`?**  
`FastAPI()` is the whole ASGI application. `APIRouter()` is a modular collection of endpoints that is included in the main app.

**Q2. What do a router prefix and tag do?**  
The prefix supplies the common URL part, such as `/customers`; the tag groups related endpoints in the Swagger UI.

**Q3. What does the Uvicorn command `uvicorn app.main:app` mean?**  
The first `app` is the Python package, `main` is the module/file, and the last `app` is the FastAPI object in that file.

**Q4. How do you divide logic between a route and a service?**  
The route validates the request, checks authorization and builds the HTTP response. A reusable domain rule is kept in a service function.

---

## Skill 3 — FastAPI Dependency Injection

### Define

In Dependency Injection, a route declares the dependency it needs; FastAPI creates/resolves that dependency and passes it to the function.

### Problem

If every route built the session, current user, Redis client and role check itself, the result would be duplicated code, inconsistent security and hard testing.

### LedgerLite solution

`Depends()` injects the database session, authenticated user, owner guard, pagination and Redis client.

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
- Dependencies can be overridden in tests.
- Route signatures are self-documenting.

### Note

The order of dependencies forms the security chain: token decode, Redis revocation check, DB user reload, active/version check, then the role guard.

### Interview questions

**Q1. What is the main purpose of Dependency Injection?**  
To separate the route from the implementation of building the dependency, and to improve reuse and testability.

**Q2. Why a DB dependency with `yield`?**  
The request gets a session; when the request completes, the context manager closes the session safely.

**Q3. What is the benefit of DI in tests?**  
You can replace the real Redis with a fake Redis, and a real dependency with a controlled test dependency.

**Q4. When do `401` and `403` occur in the dependency chain?**  
`401` for invalid/missing authentication; `403` when a valid authenticated user does not have the required role.

---

## Skill 4 — Pydantic v2 DTO validation

### Define

Pydantic models are the input/output contracts of the API. They validate/parse JSON into typed Python data and serialize Python objects into response JSON.

### Problem

An untrusted client could send an invalid email, negative money, a missing name or an unexpected shape. Making a database ORM object the public response directly could expose sensitive fields.

### LedgerLite solution

Create, update and response schemas are separate. `Field` constraints and `ConfigDict(from_attributes=True)` are used.

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

- Invalid input is rejected with `422` before it reaches the database.
- Swagger schemas are generated automatically.
- Request and response contracts are explicit.
- The ORM and the public API stay separate.

### Note

Pydantic validation gives clear early feedback; a database constraint gives the final integrity guarantee against concurrency. The two have different responsibilities.

### Interview questions

**Q1. What is the difference between a Pydantic model and a SQLAlchemy model?**  
A Pydantic model is the API validation/serialization contract. A SQLAlchemy model is persistence and database table mapping.

**Q2. Why separate Create and Update schemas?**  
Create has required values; in a PATCH update the fields are optional so that partial changes are possible.

**Q3. Why `from_attributes=True`?**  
It lets Pydantic read the attributes of a SQLAlchemy ORM object, not just a dictionary.

**Q4. What does `model_dump(exclude_unset=True)` solve?**  
In a PATCH you get only the fields the client actually sent; missing fields do not overwrite existing data.

**Q5. What is the validation error status?**  
FastAPI generally returns `422 Unprocessable Entity` for an invalid request body/path/query.

---

## Skill 5 — Pydantic Settings and environment configuration

### Define

Pydantic Settings loads and validates environment variables and `.env` into a typed configuration object.

### Problem

Hardcoding database URLs, JWT secrets, CORS origins and token expiry in code is insecure and makes changing environments difficult.

### LedgerLite solution

The backend `Settings` reads the environment at startup. The frontend keeps public and server-only URLs separate.

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

- Secrets stay out of source code.
- Development and production configuration are separate.
- Invalid required config fails fast at startup.
- Typed settings and centralized defaults.

### Note

Never commit the real `.env`. `.env.example` documents only safe placeholders. A `NEXT_PUBLIC_` variable is visible in the browser bundle; never put a secret under that prefix.

### Interview questions

**Q1. Are `.env` and Settings the same thing?**  
No. `.env` is the raw key/value source; Settings turns that data into a typed, validated Python object.

**Q2. Why is the secret key in the environment?**  
If the repository leaks or the environment changes, the secret can be rotated without editing the source.

**Q3. What is the difference between frontend `API_URL` and `NEXT_PUBLIC_API_URL`?**  
`API_URL` can stay server-only. A `NEXT_PUBLIC_` value is exposed in browser JavaScript.

---

## Skill 6 — REST, HTTP status codes and error contracts

### Define

REST operates on resources using HTTP methods and stable URLs. Status codes report the result of a request in machine-readable form.

### Problem

If every failure returns `200` or a generic `500`, the frontend cannot decide whether the problem is login, validation, a missing record or a conflict.

### LedgerLite solution

Customers/invoices/payments use resource routes and return meaningful status codes.

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
- Logs/tests can verify the exact outcome.

### Note

LedgerLite rules: `401` unauthenticated, `403` forbidden role, `404` inaccessible/missing tenant record, `409` business conflict, `422` invalid input, `429` rate limit, `503` dependency unavailable.

### Interview questions

**Q1. Why `201` on POST create?**  
The request successfully creates a new resource; `201 Created` is the exact semantic result.

**Q2. Why `204` on delete?**  
The delete succeeded and no response body is needed.

**Q3. Why `409` for a duplicate or invalid state?**  
The request syntax is valid but it conflicts with the current resource/business state.

**Q4. Should another company's tenant record be `403` or `404`?**  
LedgerLite uses `404` so that an attacker is not told that a record exists in another tenant.

---

## Skill 7 — OpenAPI and Swagger UI

### Define

OpenAPI is a machine-readable API specification. Swagger UI is an interactive documentation/testing interface for that specification.

### Problem

A frontend developer would have to guess endpoints, request fields, response types and auth manually.

### LedgerLite solution

FastAPI generates `/docs` from route signatures, Pydantic schemas, response models, tags, summaries and examples.

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
- The frontend/backend contract is visible.
- Documentation is updated along with the implementation.

### Note

Swagger is not a replacement for route security or tests. In a production environment, docs exposure can be controlled according to organization policy.

### Interview questions

**Q1. Are Swagger and OpenAPI the same?**  
OpenAPI is the specification; Swagger UI is the interface for rendering/testing that spec.

**Q2. How does FastAPI build the docs automatically?**  
The OpenAPI document is generated from type hints, Pydantic schemas, decorators, response models and metadata.

**Q3. What is the benefit of `response_model`?**  
The response shape is documented and validated/serialized; the risk of exposing unwanted ORM fields is reduced.

---

# Part B — Database and accounting

## Skill 8 — PostgreSQL 16

### Define

PostgreSQL is a relational database that provides durable tables, constraints, transactions, indexes and SQL queries.

### Problem

The initial in-memory Python list was deleted on restart, became inconsistent across multiple workers, and could not enforce relationships or transactions.

### LedgerLite solution

Organizations, users, customers, invoices, line items, payments and refresh tokens are persisted in PostgreSQL tables.

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

- Data is safe after an API restart.
- ACID transactions.
- Referential integrity.
- Filtering, joining, grouping and pagination.

### Note

Host port `5434` is the port exposed on the local machine; inside the container, PostgreSQL uses its standard port `5432`.

### Interview questions

**Q1. Why is PostgreSQL better than a list?**  
It provides durable storage, concurrency, constraints, transactions, relations and powerful queries.

**Q2. Why was a volume used?**  
So that the database files are not deleted along with the container filesystem when the container is recreated.

**Q3. Why is a relational DB suitable for accounting?**  
Customers, invoices, items and payments are strongly related; constraints and transactions protect financial integrity.

---

## Skill 9 — SQLAlchemy 2 async ORM and asyncpg

### Define

SQLAlchemy is a Python SQL toolkit/ORM that maps classes to tables and expressions to SQL. `asyncpg` is the asynchronous Python driver for PostgreSQL.

### Problem

Writing every query as a raw SQL string would mean a lot of mapping, parameter handling and repeated database plumbing. A synchronous driver could block the async FastAPI routes.

### LedgerLite solution

The async engine manages the connection pool; the session factory creates a unit of work for each request; ORM models represent the tables.

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

The ORM is not a replacement for SQL knowledge. It is essential to understand the generated queries, indexes, eager loading and transaction boundaries.

### Interview questions

**Q1. What is the difference between an engine and a session?**  
The engine manages connections and the pool. The session manages request-level queries, object state and the transaction.

**Q2. What is `async_sessionmaker`?**  
A configured factory that creates a new `AsyncSession` on each call.

**Q3. Why `pool_pre_ping=True`?**  
Before handing out a connection from the pool, it checks that the connection is not stale or dead.

**Q4. What does `expire_on_commit=False` do?**  
It keeps already loaded attributes accessible after a commit. For database-generated values, `refresh()` is still useful.

**Q5. What are `select()`, `execute()` and `scalars()`?**  
`select()` builds the statement; `execute()` runs it on the DB; `scalars()` extracts ORM entities from the row wrappers.

---

## Skill 10 — Relational models, keys and ORM relationships

### Define

An ORM model maps a database table to a Python class. A primary key identifies a row; a foreign key enforces a valid row in the related table; `relationship()` gives Python object navigation/loading.

### Problem

An invoice had to stay attached to a valid customer/organization, and a line item to its invoice. Orphan or unrelated financial rows were unacceptable.

### LedgerLite solution

Tenant and resource IDs are foreign keys. There is a bidirectional relationship between the invoice and its line items, with a delete-orphan cascade.

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
- Convenient loading of the object graph.
- The lifecycle of invoice items is managed together with the invoice.

### Note

`ForeignKey` is a database rule; `relationship()` is an ORM convenience. They are not the same thing.

### Interview questions

**Q1. What does a primary key solve?**  
It gives every row a unique, stable identity and makes exact lookup/reference possible.

**Q2. What does a foreign key solve?**  
It prevents an invalid related ID from being inserted and maintains referential integrity.

**Q3. Why `RESTRICT` on customer delete?**  
The accounting history of existing invoices must not break because a customer was deleted.

**Q4. What is the difference between `CASCADE` and `delete-orphan`?**  
The database `ondelete` is a row-level FK action; the ORM cascade manages the lifecycle of child objects in the Python session.

---

## Skill 11 — Constraints and indexes

### Define

A constraint is a database validity rule. An index is an auxiliary data structure that makes selected lookups/joins fast.

### Problem

Concurrent requests could get past API validation and store a duplicate invoice/email or invalid money. Large tenant tables would be slow without indexes.

### LedgerLite solution

Composite unique constraints, check constraints, non-null rules and tenant/lookup indexes were used.

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

- The database becomes the final integrity boundary.
- Duplicates are rejected even with concurrent writes.
- Tenant filters and joins can be faster.

### Note

Not every column should be indexed. An index takes disk space and increases insert/update cost. Composite uniqueness expresses a tenant-specific business rule.

### Interview questions

**Q1. Why a DB constraint despite API validation?**  
Two concurrent requests can both pass the pre-check; the database constraint gives atomic final protection.

**Q2. What is a composite unique constraint?**  
The combination must be unique. The same email is allowed in different organizations, but not duplicated within the same organization.

**Q3. What does a check constraint do?**  
The database rejects invalid domain values, such as a negative payment or tax above 100.

**Q4. What is the trade-off of an index?**  
Reads can become faster, but storage and write-maintenance costs increase.

---

## Skill 12 — Alembic migrations

### Define

Alembic is a schema migration tool for SQLAlchemy databases. A migration keeps schema changes in versioned `upgrade()` and `downgrade()` operations.

### Problem

Editing a model class does not automatically and safely update the existing database table. Team/production databases need a repeatable schema history.

### LedgerLite solution

Migrations were created and applied for the core tables, refresh tokens, role constraints, invoices/payments, reversal audit and the invoice sequence.

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
- A new environment can be built reproducibly.
- Production changes are reviewable.
- The rollback path is documented.

### Note

Autogenerate produces a candidate migration; human review is essential. A rename can be detected as a drop/add and cause data loss. An applied migration must not be edited; create a new revision instead.

### Interview questions

**Q1. What is the difference between a model and a migration?**  
A model is the desired application mapping; a migration changes the existing database from one schema version to the next.

**Q2. How does Alembic know about the models?**  
Imported models get registered in `Base.metadata`; `target_metadata` is used for the autogenerate comparison.

**Q3. What does `upgrade head` do?**  
It applies pending revisions in order up to the latest head.

**Q4. Is it necessary to understand auto-generated migration code?**  
You do not need to memorize all the boilerplate, but you must review the columns, constraints, data-loss risk, upgrade/downgrade and revision chain.

---

## Skill 13 — Transactions, rollback and row-level locking

### Define

A transaction makes database operations an atomic unit: if everything succeeds, commit; on any failure, rollback. `SELECT FOR UPDATE` write-locks the selected rows until the end of the transaction.

### Problem

Two simultaneous payments could read the same old balance and overpay an invoice. In signup, if the organization was created and the user failed, a half-created account could be left behind.

### LedgerLite solution

Related writes happen in a single session transaction. Payment/reversal, refresh rotation and invoice number generation lock the critical rows with `with_for_update()`.

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

- Financial updates are atomic.
- Lost-update and overpayment races are reduced.
- A failed transaction does not leave partial data behind.

### Note

A row lock is only meaningful inside a transaction. Locks should be kept short; long transactions increase the risk of contention/deadlock.

### Interview questions

**Q1. What is atomicity?**  
Related operations are either all applied or none of them are.

**Q2. What is the difference between `flush()` and `commit()`?**  
`flush()` sends pending SQL to the database transaction and can provide a generated ID, but nothing is permanent. `commit()` saves the transaction permanently.

**Q3. Why rollback after a failed commit?**  
The session is in a failed-transaction state. Rollback cancels the pending changes and brings the session back to a usable state.

**Q4. How does `SELECT FOR UPDATE` solve the payment problem?**  
The first transaction locks the invoice row. The second waits until it gets the latest committed balance and does not apply its payment against a stale balance.

**Q5. Are isolation and an application lock the same?**  
No. Database isolation provides general transaction visibility rules; an explicit row lock serializes a specific business-critical row.

---

## Skill 14 — Decimal accounting and business services

### Define

Python `Decimal` provides exact base-10 decimal arithmetic. A service function separates a reusable domain rule from HTTP and persistence details.

### Problem

With binary floating-point, `0.1 + 0.2` is not exactly `0.3`. Trusting financial totals from the client could lead to manipulation or rounding inconsistency.

### LedgerLite solution

Money is kept exact end-to-end using Pydantic `Decimal`, SQLAlchemy `Numeric`, JSON decimal strings and backend `ROUND_HALF_UP` calculation. The frontend total is only an estimate.

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
- A single authoritative calculation.
- The logic is testable separately.
- Client tampering cannot change the totals.

### Note

The frontend preview is helpful UX, not accounting authority. The backend recalculates the totals from the supplied line items.

### Interview questions

**Q1. Why is float unsafe for money?**  
Binary floating representation cannot store decimal fractions exactly; repeated operations can produce rounding errors.

**Q2. What does `Numeric(14, 2)` mean?**  
14 decimal digits in total, of which 2 are after the decimal point.

**Q3. Why were totals calculated on the backend?**  
The client is untrusted. The backend is the authoritative boundary for validation, rounding and business rules.

**Q4. What is the benefit of a service layer?**  
Routes and tests reuse the same calculation, and it can be tested independently of HTTP/database code.

---

## Skill 15 — Search and pagination

### Define

Pagination returns a large result set in fixed-size pages. Search filters the matching rows on the server.

### Problem

Sending all customers/invoices in one response would make memory, network and rendering cost grow with the data. Client-side search could only see the page that was already loaded.

### LedgerLite solution

A reusable pagination dependency validates `page`/`size`. The query applies the tenant filter, optional search, count, stable order, offset and limit.

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
- Search runs over all tenant data, not just the current page.
- Shared validation.

### Note

Offset pagination is suitable for the current dataset. For very large or fast-changing feeds, cursor pagination may be better.

### Interview questions

**Q1. What is the offset formula?**  
`offset = (page - 1) * size`.

**Q2. Why a stable `order_by`?**  
If the order is undefined, records can jump or duplicate between pages.

**Q3. Why `COUNT(*)`?**  
So the frontend can calculate/display the total items and total pages.

**Q4. Why is the tenant filter necessary with search?**  
The search query must also stay within the organization boundary; otherwise cross-tenant data could leak.

**Q5. Is `GROUP BY` duplicate removal?**  
Not a direct replacement. `GROUP BY` creates aggregation groups; `DISTINCT` can be used for unique values.

---

# Part C — Security and tenancy

## Skill 16 — Multi-tenant data isolation

### Define

Multi-tenant SaaS serves multiple organizations from one application/database, but each organization's data stays logically isolated.

### Problem

If you query only by `customer_id` or `invoice_id`, an authenticated user could change the ID in the URL and see another company's record.

### LedgerLite solution

A trusted `organization_id` comes from the authenticated user. Every resource query adds an organization condition alongside the `id`; a client-supplied tenant ID is never trusted.

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

- Prevents company data mixing/leaks.
- The same API/database safely serves multiple businesses.
- Authorization is enforced consistently at the query level.

### Note

Including/clearing the organization in the frontend cache key is defense-in-depth for UX. The actual security is the backend tenant filter; the browser cache is not a security boundary.

### Interview questions

**Q1. Why don't we take the tenant ID from the request body?**  
The client is untrusted and can send another organization's ID. The tenant context comes from the verified JWT/user record.

**Q2. Why return `404` for both missing and foreign-tenant records?**  
It does not reveal the existence of another tenant's resource.

**Q3. Why clear the cache on login?**  
So that the previous account's cached UI data is not briefly visible to the next account.

**Q4. Is an organization foreign key enough for tenant isolation?**  
No. The FK ensures a valid organization; scoping the authorization query to the current organization is a separate requirement.

---

## Skill 17 — Argon2 password hashing

### Define

Password hashing is a one-way transformation. Argon2 is a memory-hard password hashing algorithm; a salt makes the hashes of identical passwords different.

### Problem

Plaintext or reversibly encrypted passwords would be exposed immediately in a database leak. A fast general-purpose hash can be cheap to brute-force.

### LedgerLite solution

`pwdlib.PasswordHash.recommended()` creates and verifies Argon2 hashes. The plain password is never saved in the database.

### Code

```python
password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)
```

### Benefits

- The original password cannot be recovered directly from the hash.
- A unique salt weakens rainbow tables and reused-hash comparison.
- Memory cost makes parallel guessing by attackers expensive.

### Note

Hashing is not encryption. At login the password is not decrypted; the candidate password is verified against the parameters of the stored encoded hash.

### Interview questions

**Q1. What is the difference between hashing and encryption?**  
Encryption is reversible with a key. A password hash is deliberately one-way, for verification.

**Q2. What is the role of the salt?**  
Because of a random salt, the same password produces different hashes, and precomputed attack tables become ineffective.

**Q3. How is login verified if the hash can come out different?**  
The stored encoded Argon2 hash contains the salt/parameters; the verify function checks the candidate using those same settings.

**Q4. Is the JWT secret used in password hashing?**  
No. The password hasher uses its own salt/algorithm; the JWT secret is for the token signature.

---

## Skill 18 — JWT access and refresh tokens

### Define

A JWT is a signed token containing claims and an expiry. The access token is short-lived and used for API authorization; the refresh token is a longer-lived credential used to obtain a new access token.

### Problem

Sending email/password on every request was unsafe. If a long-lived access token were stolen, the attacker would get long-lasting access.

### LedgerLite solution

The access token contains `sub`, organization, role, token version, type, issue/expiry times and a unique `jti`. The refresh token has a separate type and expiry.

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

- The password is not repeated.
- A short access-token lifetime reduces the window for a stolen token.
- Claims provide quick authentication context.
- The refresh token renews the user session.

### Note

A JWT is signed, not encrypted. The payload can be readable, so secret/sensitive data must not be put in claims. The backend verifies the signature, required claims, type, expiry, DB user, active status and token version.

### Interview questions

**Q1. What are the three parts of a JWT?**  
Header, payload and signature.

**Q2. What does the signature prove?**  
That the token was signed with the expected secret and the payload was not modified. It does not provide confidentiality.

**Q3. What are `exp`, `iat`, `sub`, `jti`?**  
Expiry, issued-at time, subject/user identity and a unique token ID.

**Q4. Why is the access token expiry short?**  
The usable damage window of a stolen access token stays limited.

**Q5. Why reload the DB user even though the token has the role?**  
The user may be deactivated, have their role changed or have the token version updated. The DB verifies the current truth.

---

## Skill 19 — Refresh rotation, reuse detection and logout-all

### Define

Refresh rotation revokes the old token and issues a new one on every successful refresh. Reuse detection treats the token family/session chain as compromised when a revoked token is used again.

### Problem

If a static refresh token is stolen, both the attacker and the real user can use it. A JWT access token naturally cannot be deleted server-side.

### LedgerLite solution

The raw refresh token value is not stored; its SHA-256 hash, JTI, expiry, revocation and replacement chain are in the DB. Rotation happens inside a row lock. Logout revokes the current refresh token and blacklists the access JTI in Redis. Logout-all increments `token_version`, invalidating all old access tokens.

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

- Reuse of a stolen refresh token is detectable.
- The raw token is not immediately usable if the DB leaks.
- Logout can block an access token before its expiry.
- Logout-all invalidates all devices/sessions.

### Note

Hashing a bearer token does not need to be as expensive as password hashing; the refresh token is a high-entropy random JWT, so a SHA-256 lookup/compare is suitable.

### Interview questions

**Q1. Why is the refresh token hashed in the database?**  
So that, in a DB leak, an attacker cannot use the stored value directly as a bearer credential.

**Q2. How does rotation improve security?**  
Every token is single-use; reuse of an old token becomes a theft signal.

**Q3. Why a row lock in refresh?**  
So that two concurrent requests with the same refresh token cannot both rotate successfully.

**Q4. What is the `token_version` pattern for logout-all?**  
The DB version is incremented; on the next protected request, an old JWT is rejected because its claim does not match.

**Q5. Why a TTL on the access blacklist?**  
The entry is needed only for the token's remaining lifetime; after expiry, Redis memory is released automatically.

---

## Skill 20 — Redis rate limiting and revocation

### Define

Redis is an in-memory key/value store suitable for counters, TTLs and short-lived security state.

### Problem

Unlimited wrong login attempts allow brute-force. A signed access JWT would otherwise stay valid until expiry even after logout.

### LedgerLite solution

Login failures are recorded in Redis counters per email-hash and client IP. At the limit, it returns `429` + `Retry-After`. A revoked access JTI is stored in Redis until its expiry TTL.

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
- Multiple API instances can use shared security state.
- JWT revocation without storing every active access token.

### Note

When Redis is down, LedgerLite security checks fail closed with `503`. This slightly reduces availability but security is not silently bypassed.

### Interview questions

**Q1. Why is rate limiting in Redis instead of PostgreSQL?**  
Counters are short-lived and frequently updated; Redis provides fast atomic increments/TTL.

**Q2. Why hash the email in the key?**  
So that the raw personal email is not exposed in Redis keys/log tooling.

**Q3. What are `429` and `Retry-After`?**  
They tell the client there are too many requests and how long to wait before retrying.

**Q4. Fail-open vs fail-closed?**  
Fail-open allows the request when Redis fails; fail-closed rejects it. For auth security, LedgerLite is fail-closed.

---

## Skill 21 — Role-Based Access Control and member management

### Define

RBAC maps user permissions to roles. In LedgerLite, an `owner` can do management/destructive work; a `member` does daily accounting work.

### Problem

Letting every authenticated user delete customers, void invoices, reverse payments and manage the team would be excessive privilege.

### LedgerLite solution

An owner dependency protects privileged routes. The first signup creates the organization + owner; the owner creates/updates members. A self-demotion/deactivation guard protects the company from becoming ownerless. The frontend `/team` route provides owner controls, `/settings` provides role-aware editing, BFF routes forward requests, and TanStack Query refreshes cached data.

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
- Authorization is reusable and consistent.
- Owner/member behavior is clear in both UI and API.

### Note

Hiding a frontend button is not security. A backend guard is mandatory on every privileged request. The owner-only `/team` member manager and role-aware `/settings` organization screen are implemented through BFF routes.

### Interview questions

**Q1. What is the difference between authentication and authorization?**  
Authentication tells who the user is; authorization tells what they can do.

**Q2. If the role is in the token, why an owner dependency?**  
A central guard gives consistent `403` behavior; verifying the current user in the DB reduces the risk of a stale token role.

**Q3. Why can't an owner deactivate themselves?**  
To prevent accidentally leaving the organization without an active owner.

**Q4. Is a platform admin implemented?**  
No. The current roles are tenant-level owner/member. A cross-organization super admin would be a separate future system.

**Q5. Is hiding the Team link from a member enough security?**  
No. Hiding the link is UX. The `/team` server section checks the role, the BFF forwards the token, and FastAPI's `get_current_owner` enforces the final `403` authorization.

**Q6. What is the owner/member behavior in organization settings?**  
Both can read the current organization. An owner can `PATCH` its name/slug; a member gets disabled view-only fields, and the backend update endpoint is also protected by the owner dependency.

**Q7. Why invalidate the query after creating or updating a member?**  
The cached member list becomes stale after a successful mutation. Invalidating `workspaceKeys.members` makes the active paginated list refetch authoritative backend data.

**Q8. Why is demoting/deactivating your own owner account disabled?**  
The frontend prevents an accidental click, and the backend `409` guard prevents the organization from being left without an active owner. The backend guard is the actual business/security rule.

**Q9. What is the current limitation of the member password flow?**  
The owner sets a temporary password while creating the member. Email invitation and self-service password setup are not implemented yet, and this limitation should be stated honestly in an interview.

---

# Part D — Reliability, observability and backend testing

## Skill 22 — Health checks and application lifespan

### Define

Liveness tells whether the process is running. Readiness tells whether the application is ready to serve real traffic with its required dependencies. Lifespan manages startup/shutdown resources.

### Problem

The API process can be alive while PostgreSQL or Redis is unavailable; a simple `200` health response would be misleading. On shutdown, connection pools also had to be closed cleanly.

### LedgerLite solution

`/health` is the process check. `/health/ready` checks PostgreSQL `SELECT 1` and Redis `PING`. On shutdown, the lifespan closes the Redis client and disposes the DB engine.

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

- A load balancer/container does not send traffic to an unhealthy instance.
- Dependency failures are visible.
- Clean resource shutdown.

### Note

Docker Compose service health checks and API readiness are related but not the same: the container check verifies the service process, while API readiness verifies the whole application dependency chain.

### Interview questions

**Q1. Liveness vs readiness?**  
Liveness: is the process alive? Readiness: can it serve requests with its dependencies?

**Q2. What status is returned on readiness failure?**  
LedgerLite returns `503 Service Unavailable`.

**Q3. Why dispose the engine?**  
It releases pool connections and makes process shutdown clean.

---

## Skill 23 — CORS, SameSite cookies and BFF boundary

### Define

CORS tells the browser which origins may read a cross-origin response. CSRF is an unwanted state-changing request made using the victim browser's cookies. A BFF is a frontend-specific server layer that forms a boundary between the browser and the backend.

### Problem

Giving the FastAPI token directly to the browser could expose it in client JavaScript storage. A direct cross-origin frontend/backend setup would add CORS and credential complexity.

### LedgerLite solution

The browser calls same-origin Next.js `/api/*` Route Handlers. The Route Handler reads the HttpOnly cookie and sends a Bearer token to FastAPI. Cookies are `SameSite=Lax`, `Secure` in production, and `HttpOnly`. FastAPI takes CORS origins from restricted config.

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

- The token is inaccessible to normal browser JavaScript.
- Backend URL/credentials stay at the server boundary.
- Same-origin UI API calls are simpler.
- FastAPI remains independently protected.

### Note

`SameSite=Lax` is a useful CSRF mitigation, not a complete dedicated CSRF-token implementation. Production hardening should add Origin/CSRF checks to state-changing BFF routes. CORS is not a replacement for CSRF protection.

### Interview questions

**Q1. Is CORS authentication?**  
No. It is a browser response-reading policy. The API must enforce auth/authorization separately.

**Q2. What does HttpOnly protect?**  
Client JavaScript cannot read the token via `document.cookie`, which reduces the risk of token theft through XSS.

**Q3. Why was a BFF used?**  
To keep tokens in secure server-side cookies, centralize backend calls and decouple the browser from FastAPI details.

**Q4. Is CSRF fully complete in LedgerLite?**  
SameSite protection is present; explicit CSRF token/origin enforcement is future hardening. Do not overclaim in an interview.

---

## Skill 24 — Structured logging and Request ID

### Define

Structured logging produces machine-readable events with fixed fields. A Request ID correlates one request across services/log lines.

### Problem

With plain messages, locating the method, path, status, latency and related request was difficult. A user-reported error could not be connected to the exact server event.

### LedgerLite solution

HTTP middleware accepts an incoming `X-Request-ID` or generates a UUID, measures duration, logs a structured event and returns the ID in the response header.

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

- Logs are friendly to search/filter/aggregation.
- Slow/failing requests can be traced.
- A client report can be correlated with backend logs.

### Note

This is a Python logging implementation, **not Pino**. Pino is a Node.js logger and is not used in the LedgerLite FastAPI backend.

### Interview questions

**Q1. Why are structured logs better than plain logs?**  
Fields are machine-parsed; status, path, request ID and duration enable reliable queries/alerts.

**Q2. What is the benefit of accepting a client-provided Request ID?**  
The same correlation chain can continue from upstream/the frontend.

**Q3. Should the sensitive request body be logged?**  
Passwords, tokens and personal/financial data should not be kept in default logs.

---

## Skill 25 — Pytest, HTTPX and integration tests

### Define

A unit test verifies an isolated function. An integration test verifies multiple real layers together: route, dependency, auth, database and business rule.

### Problem

Auth rotation, tenant isolation, invoice totals and payment locking could regress with manual Swagger testing.

### LedgerLite solution

`pytest` + `pytest-asyncio` run async tests. The HTTPX `AsyncClient` sends real HTTP-style requests to the ASGI app. The Redis dependency is overridden with a fake implementation; PostgreSQL verifies real integration behavior.

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

- Business flows are automatically repeatable.
- Status, JSON, persistence and security rules are verified together.
- Confidence when refactoring.

### Note

The current automated suite is focused on backend integration. Frontend Vitest/React Testing Library and Playwright E2E are still pending.

### Interview questions

**Q1. Why HTTPX ASGITransport?**  
The test sends requests to the ASGI app in the same process; no network server needs to start, yet the routing/middleware stack executes.

**Q2. Why a dependency override?**  
Replacing external Redis with a deterministic fake lets us control edge states and isolate the test.

**Q3. Is an integration test a replacement for a unit test?**  
No. An integration test verifies the wiring of the flow; a unit test isolates small logic failures faster. Both are useful.

**Q4. What is essential in an accounting test?**  
Totals, rounding, overpayment rejection, transaction rollback, reversal audit and the tenant boundary.

---

## Skill 26 — Docker Compose, volumes and service health

### Define

A Docker image is a runtime template; a container is a running isolated instance of that image. Compose runs multiple services/configuration from one file.

### Problem

Each developer could have different local PostgreSQL/Redis versions and ports. The setup was not repeatable.

### LedgerLite solution

Compose defines PostgreSQL 16 and Redis 7 exact images, port mappings, a persistent volume and health checks.

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

The current Compose containerizes **only PostgreSQL and Redis**. FastAPI/frontend Dockerfiles and a full production Compose are still pending.

### Interview questions

**Q1. Image vs container?**  
An image is an immutable template; a container is a running instance of that template.

**Q2. What is `5434:5432`?**  
It maps host port 5434 to the container's port 5432.

**Q3. What is the trade-off of an Alpine image?**  
A smaller download/runtime footprint, but debugging tools/libraries may be limited.

**Q4. What does a health check solve?**  
It detects the difference between a process having started and the service being ready to accept connections.

---

# Part E — Frontend language and architecture

## Skill 27 — TypeScript and frontend API contracts

### Define

TypeScript is a static type system on top of JavaScript. Types validate props, payloads, responses and state shapes at compile time.

### Problem

Typos in API fields, a nullable email, decimal strings, or wrongly assuming the shape of a paginated response could cause runtime UI errors.

### LedgerLite solution

A feature-wise `types.ts` models the backend JSON contracts. Values are inferred from the form schema, and API functions return typed responses.

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
- Wrong property/type detected at compile time.
- Frontend API assumptions are explicit.

### Note

TypeScript does not do runtime validation. At external form/API boundaries, Zod and backend Pydantic are still needed.

### Interview questions

**Q1. What is the use of type vs interface?**  
The project uses types for API unions/generics; both can model object shapes. Consistency matters more.

**Q2. Why is a decimal response typed as `string`?**  
A JSON/JavaScript number does not guarantee exact financial decimals; the backend's decimal string preserves precision.

**Q3. What is the benefit of a generic `Page<T>`?**  
Customers, invoices and payments reuse the same pagination envelope with a specific item type.

**Q4. Why is the compile-time type not enough?**  
Runtime user/network data bypasses the type system; a validation schema checks the actual values.

---

## Skill 28 — Next.js 16 App Router

### Define

App Router provides filesystem-based routing, layouts, Server Components, Route Handlers and special loading/error/not-found files.

### Problem

Auth pages and dashboard pages needed different layouts, protected navigation and nested resource routes without manual router configuration.

### LedgerLite solution

The `(auth)` and `(dashboard)` route groups organize layouts without changing the URL. The `page.tsx`, `layout.tsx`, `[id]`, `loading.tsx`, `error.tsx` and `not-found.tsx` conventions are used.

### Code

```text
src/app/(auth)/login/page.tsx                    -> /login
src/app/(dashboard)/customers/page.tsx           -> /customers
src/app/(dashboard)/customers/[id]/page.tsx      -> /customers/45
src/app/(dashboard)/invoices/[id]/edit/page.tsx  -> /invoices/8/edit
```

### Benefits

- URL structure is clear from the filesystem.
- Shared nested layouts.
- Built-in loading/error/not-found boundaries.
- Server and client rendering in the same framework.

### Note

Route group parentheses are not part of the URL. `[id]` is a dynamic segment whose value comes from the runtime URL; the records do not have to be created automatically at build time.

### Interview questions

**Q1. `layout.tsx` vs `page.tsx`?**  
A layout provides the shared wrapper/navigation/provider; a page provides the content for a specific URL.

**Q2. What does the `(dashboard)` route group do?**  
It organizes files and applies a common layout; the group name does not appear in the URL.

**Q3. How does a `[id]` dynamic route work?**  
The URL segment is obtained from `params`; the page validates the ID and fetches/renders the matching backend resource.

**Q4. What does `notFound()` do?**  
It renders the nearest `not-found.tsx` and triggers 404 behavior.

**Q5. What about `params` in Next.js 16?**  
In the current implementation, params is a Promise, so the async page `await`s it.

---

## Skill 29 — Server Components, Client Components and Suspense

### Define

A Server Component renders on the server and can reduce the browser JavaScript bundle. A Client Component uses state, effects, browser APIs and event handlers. Suspense streams a fallback while waiting for an async child.

### Problem

Making the whole app client-side would mean unnecessary JavaScript and loading boilerplate. Interactive forms also needed browser state.

### LedgerLite solution

Pages/layouts are Server Components by default. Forms, Query hooks and interactive navigation files use `"use client"`. Async status/detail boundaries sit inside Suspense fallbacks.

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

- Server-first, smaller client bundle.
- Interactive code only where required.
- Progressive rendering of async content.
- Clear loading experience.

### Note

Hydration attaches the client React tree/event handlers to the server HTML. If the server render and the first client render differ, a hydration mismatch occurs. Unstable values like `Date.now()` must be handled carefully in prerendered content.

### Interview questions

**Q1. When is `"use client"` required?**  
On the boundary of a component that uses state, an effect, a context consumer, a browser API or an event handler.

**Q2. Does every child need `"use client"`?**  
No. Children imported by a client boundary can become part of the client bundle; the directive does not need to be repeated in every file.

**Q3. What does Suspense solve?**  
It shows a meaningful fallback until the async subtree is ready and provides a streaming boundary.

**Q4. `loading.tsx` vs manual Suspense?**  
`loading.tsx` is the automatic boundary for a route segment; manual Suspense streams a selected subtree of the page independently.

**Q5. What about Cache Components/PPR?**  
The project enables `cacheComponents: true` and partial prefetching. A static shell can be prerendered, and runtime URL/data portions stream in within Suspense boundaries.

---

## Skill 30 — Next.js Route Handlers as BFF

### Define

A Route Handler is a server-side HTTP endpoint in `app/api/.../route.ts`. A BFF adapts backend calls to the browser's needs.

### Problem

Making the browser manage the FastAPI URL and Bearer token directly would create token exposure, CORS issues and duplicated forwarding logic.

### LedgerLite solution

The UI calls same-origin Next routes. The Route Handler reads the cookie token, forwards the query/body, preserves the backend status/body and attaches a Request ID trace.

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
- Same-origin API for the browser.
- Backend errors/status preserved.
- One place for refresh/tracing/security policy.

### Note

A BFF is not a place for duplicated business logic. Accounting, tenancy and authorization stay authoritative in FastAPI.

### Interview questions

**Q1. What is the difference between a BFF proxy and the business backend?**  
The BFF handles client-specific transport/session adaptation; FastAPI owns the domain rules and database operations.

**Q2. Does a Route Handler run on the server?**  
Yes, which is why it can read the HttpOnly cookie and use the private backend URL.

**Q3. Why preserve the backend status?**  
TanStack/UI get accurate meanings for `401`, `403`, `409` and `422`.

**Q4. When is a direct FastAPI call useful?**  
For Swagger, mobile/external clients or trusted server integrations; the browser app uses the BFF path.

---

## Skill 31 — HttpOnly sessions, Next Proxy and idle guard

### Define

Next Proxy inspects a protected request before the page renders. If the access cookie is missing and a refresh token is available, it attempts to renew the token. The idle guard tracks browser activity and logs out an inactive user.

### Problem

Protected pages would fail on an expired access token; an unauthenticated user could open protected UI; and an inactive open session on a shared computer was a risk.

### LedgerLite solution

Proxy matches `/dashboard`, `/customers`, `/invoices` and `/journey`. If the access token is valid, the request passes; if a refresh token exists, it calls the FastAPI refresh and replaces the cookies; on failure it clears the cookies and redirects to login. The client guard logs out after 2 hours of inactivity following activity events.

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
- A failed refresh safely returns to login.
- An inactive shared-device session closes earlier.

### Note

JWT expiry is a fixed token lifetime; idle timeout is a policy based on user interaction. They solve different problems. The Proxy cookie check is a fast gate; FastAPI signature/DB/security checks are the final authority.

### Interview questions

**Q1. Does a present cookie mean authenticated?**  
No. The cookie may be malformed/expired/revoked. FastAPI does the final verification.

**Q2. `push`, `replace` and redirect?**  
`push` adds a browser history entry; `replace` swaps the current entry; a server/proxy redirect is an HTTP navigation decision.

**Q3. Can idle logout happen before expiry?**  
Yes. After no interaction for the configured duration, the client calls the logout route to revoke/clear the session.

**Q4. What about an already-typed unsaved form on idle logout?**  
The current guard counts input/keyboard events as activity; active typing resets the timer. On true inactivity, unsaved state is intentionally not retained.

---

# Part F — Frontend forms, state and user experience

## Skill 32 — React Hook Form and Zod

### Define

React Hook Form efficiently manages input registration, validation state, submission and dynamic fields. Zod provides runtime schema validation and TypeScript inference.

### Problem

Manual `useState` per field, duplicated validation, unclear error messages and managing the dynamic line items of an invoice would be complex.

### LedgerLite solution

The login, signup, customer, invoice, payment and reversal forms use `useForm` + `zodResolver`. Invoice line items use `useFieldArray`; the totals preview updates via `useWatch`.

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

- Clear field-level errors.
- Fewer rerenders and less boilerplate.
- Strongly typed form values.
- Dynamic arrays are manageable.

### Note

Frontend Zod is fast UX validation, not a security boundary. Backend Pydantic independently enforces the same critical limits.

### Interview questions

**Q1. What is `formState.errors`?**  
The current error information for each field, from resolver/field validation.

**Q2. What does `isSubmitting` solve?**  
A disabled/loading state for the button during async submit, and prevention of duplicate submission.

**Q3. What is the role of `zodResolver`?**  
It translates the Zod validation result into React Hook Form's values/errors contract.

**Q4. Why `useFieldArray`?**  
When adding/removing invoice items, it manages stable field IDs, registration and errors.

**Q5. How do Zod and TypeScript overlap?**  
TypeScript works at compile time; Zod works on runtime user/network values. They are complementary.

---

## Skill 33 — TanStack Query server-state management

### Define

TanStack Query fetches, caches, retries, invalidates and synchronizes remote/server state. `useQuery` reads; `useMutation` writes; `useInfiniteQuery` loads page by page.

### Problem

Manual `useEffect` fetching repeats loading/error/cache/race/refetch code. After create/edit/delete, multiple screens could stay stale.

### LedgerLite solution

One `QueryClientProvider` provides global rules. Feature hooks define stable query keys. Successful mutations invalidate the relevant list/detail/invoice/payment queries. The cache is cleared on login/logout.

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
- Consistent fresh data after mutations.

### Note

Payment/financial mutations do not use optimistic updates. It is safer to invalidate/refetch the cache after the backend row lock and authoritative balance.

### Interview questions

**Q1. `useQuery` vs `useMutation`?**  
A query reads cacheable data; a mutation performs a create/update/delete side effect.

**Q2. What is a query key?**  
The cache identity. The resource, tenant/session-relevant scope and parameters should be in a stable key.

**Q3. What does invalidate do?**  
It marks matching cached data as stale and can make active queries refetch.

**Q4. Why `queryClient.clear()` on login/logout?**  
So that the previous organization's cached sensitive UI data is not available to the next account.

**Q5. Where is `useInfiniteQuery` used?**  
In the invoice customer selector, loading server search results in a 100-per-page load-more flow.

**Q6. Is the client cache a database?**  
No. It is a temporary UX copy; the backend/database is the source of truth.

---

## Skill 34 — Dynamic routes and complete CRUD UI states

### Define

CRUD means Create, Read, Update, Delete operations. A robust UI handles loading, error, empty, forbidden, conflict and not-found states in addition to success.

### Problem

A static list does not demonstrate real backend behavior. A blank screen on a slow/error response and a crash on a wrong ID were poor UX.

### LedgerLite solution

Customer list/create/detail/edit/delete is complete. Invoice list/create/detail/edit/void and payment record/history/reverse are implemented. The dynamic `[id]` pages validate the route ID and map a backend `404` to a not-found experience.

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

- Every network state is visible.
- Direct URL navigation works.
- Backend status is translated into meaningful UI.
- Full-stack workflow portfolio proof.

### Note

IDs may be sequential primary keys; obscuring IDs is not security. Tenant authorization is required on the backend. UUIDs can be an optional product decision.

### Interview questions

**Q1. Is a dynamic route created at build time?**  
The route pattern is built; the ID of the current server/runtime request fetches the data, unless static params are explicitly generated.

**Q2. Why handle loading/error/empty separately?**  
These three states have different meanings/actions: wait, retry/fix, or create the first resource.

**Q3. What happens after delete?**  
The mutation succeeds, the list/detail cache is invalidated, and the user navigates to a suitable list route.

**Q4. `PATCH` vs `PUT`?**  
PATCH updates partial fields; PUT is conventionally a full resource replacement.

---

## Skill 35 — Tailwind CSS, responsive UX and accessibility

### Define

Tailwind is a utility-first CSS framework. Responsive design adapts the layout at breakpoints. Accessibility covers keyboard, semantics, labels, focus, contrast and assistive-tech needs.

### Problem

Desktop-only tables/forms would overflow and be unusable on small screens. Icon-only/unlabelled controls would be unclear to keyboard/screen-reader users.

### LedgerLite solution

Mobile-first Tailwind classes, responsive grids/cards, visible focus states, semantic forms/buttons, labels, status text and contrast-conscious colors are used.

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
- Usable on small and large screens.
- Keyboard feedback and readable form states.
- Faster component styling.

### Note

A responsive-looking UI is not an automatic accessibility guarantee. Automated checks plus keyboard/screen-reader/manual testing should be part of future production verification.

### Interview questions

**Q1. What does a mobile-first breakpoint mean?**  
Base classes apply on small screens; `md:`/`lg:` override/add progressively for larger screens.

**Q2. Is a disabled button enough loading UX?**  
It prevents duplicate submits, but visible text/spinner/status should also tell the user about progress.

**Q3. Why focus-visible?**  
It gives a clear focus indicator on keyboard navigation without an unnecessary ring on every mouse click.

**Q4. Semantic button vs clickable div?**  
A button has keyboard behavior, focus and accessibility semantics built in.

---

# Part G — LedgerLite domain workflows

## Skill 36 — Customer CRUD and organization-safe deletion

### Define

The customer workflow is tenant-scoped create/list/search/read/update/delete resource management.

### Problem

Duplicate emails, cross-company access and deletion of invoiced customers could corrupt accounting references.

### LedgerLite solution

Customer rows use an organization foreign key and a unique email rule. Every query is tenant-scoped. The invoice FK `RESTRICT` and route conflict handling block deletion of a linked customer.

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

Delete is currently a hard delete, but an invoiced customer is restricted. A mature accounting system may prefer customer archiving/soft-delete.

### Interview questions

**Q1. Is a duplicate email checked globally?**  
No. The `(organization_id, email)` combination is unique; different companies can use the same email.

**Q2. Why is deleting an invoiced customer blocked?**  
To preserve the customer reference and audit meaning of historical invoices.

**Q3. Why search on the backend?**  
It searches all tenant rows, not just the currently loaded page.

---

## Skill 37 — Invoice lifecycle, line items and automatic numbering

### Define

The invoice aggregate combines a header, multiple line items, calculated totals, a status and an organization-scoped number.

### Problem

Client-supplied totals/numbers could be duplicated or manipulated. Simultaneous invoice creation could generate the same number. Editing a paid invoice could change financial history.

### LedgerLite solution

The backend verifies the tenant's customer, locks the organization row, generates the next sequence, calculates totals with Decimal, and saves the header and items in one transaction. Only issued/unpaid invoices can be edited; void is owner-only and respects the paid/reversed rules.

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

- Unique, human-readable invoice numbers per tenant.
- Server-authoritative exact totals.
- Consistent lifecycle/status rules.
- Atomic invoice + items save.

### Note

The current sequence increments organization-wide; an automatic annual reset when the year label changes is not implemented. Invoice PDF/download is also still pending.

### Interview questions

**Q1. Why was the invoice number removed from the frontend?**  
The server owns uniqueness/concurrency control; the user does not send an accidental duplicate number.

**Q2. Why lock the organization row during number generation?**  
So that concurrent creates cannot consume the same `next_invoice_sequence`.

**Q3. Why `selectinload(line_items)`?**  
The related items of an invoice list/detail are eagerly loaded with one efficient additional IN query; this reduces async lazy-load surprises and N+1 queries.

**Q4. Why is editing a paid invoice blocked?**  
The payment amount/status are tied to the historical totals; editing would create audit inconsistency.

**Q5. Why is void better than delete?**  
Accounting history is preserved; the record's status shows the cancelled meaning.

---

## Skill 38 — Payments, overpayment protection and reversal audit

### Define

A payment reduces the invoice balance. A reversal restores the balance by marking the original payment as cancelled/audited, without deleting it.

### Problem

Concurrent payments could overpay. Deleting a payment would lose the history of who reversed it, when and why. A client-side balance calculation could be stale.

### LedgerLite solution

The payment route locks the invoice row, validates a positive amount and the available balance, and commits the payment insert and the invoice totals/status in the same transaction. An owner reversal locks the payment/invoice, saves the reversal actor/time/reason, and recalculates the balance/status.

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
- UI refetches the backend-authoritative balance.

### Note

This is payment recording, not external card processing. Stripe webhook integration is not implemented.

### Interview questions

**Q1. Why are the payment and invoice update in one transaction?**  
If the payment row is saved but the balance update fails, or vice versa, the financial state becomes inconsistent.

**Q2. Why is a payment reversal not a delete?**  
Preserving the audit trail is an accounting requirement.

**Q3. Why is reversal owner-only?**  
A financial correction is a high-impact privileged action.

**Q4. Why avoid optimistic UI for payments?**  
The backend decides the balance after concurrent transactions/locks; a guessed optimistic amount can be stale/wrong.

**Q5. How do invoice statuses change?**  
Zero paid = issued, partial balance = partially_paid, zero balance = paid; void is a separate terminal business state.

---

## Skill 39 — Learning-mode request visualization

### Define

Learning mode gives a real async request a minimum demo duration along with visual steps. An environment flag keeps the teaching delay separate from the production UX.

### Problem

With a fast request, the learner cannot observe the browser → BFF → auth → database journey. Giving a production user an artificial 5-second delay would be unacceptable.

### LedgerLite solution

With `NEXT_PUBLIC_LEARNING_MODE=true`, the request and a 5000ms timer run in parallel; the result is not returned before the timer. The production/default example is false.

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

- Request architecture is visible.
- The real request and the animation remain linked.
- Production can remain fast.

### Note

The timer runs in parallel with the request: if the real request takes 7 seconds, the total is 7, not an additional 5. The `NEXT_PUBLIC_` flag is bundled at build/start time; after changing it the dev server needs a restart.

### Interview questions

**Q1. Why `Promise.allSettled`?**  
Even if the request rejects, we can safely observe the timer/animation reaching its completed state and then rethrow the original error.

**Q2. Why is the production default false?**  
Artificial latency harms the real user experience and performance metrics.

**Q3. Does the animation prove backend security?**  
No. It is a teaching visualization; the actual status/tests/logs/backend guards are the proof.

---

# Part H — Build quality and honest boundaries

## Skill 40 — Typecheck, ESLint, Turbopack and production build

### Define

Typecheck validates TypeScript contracts. ESLint checks code-quality rules. Turbopack is the Next.js dev/build bundler. The production build verifies routes and server/client compilation.

### Problem

The app may work in the browser on one path, yet unused variables, a wrong union property, a server/client boundary issue or a production prerender error can stay hidden.

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
- Production-only failures caught before deployment.
- Automated regression proof.

### Note

Passing checks are not complete proof of correctness. User workflows, security and accessibility testing are also needed. GitHub Actions CI is currently pending.

### Interview questions

**Q1. Why are typecheck and build separate?**  
Typecheck is a focused/faster contract check; build verifies bundling, route analysis, prerender and production integration.

**Q2. What does lint catch?**  
Unused variables, hooks/rules and configured code-quality problems that the type system does not necessarily catch.

**Q3. Is a successful dev server enough?**  
No. Dev mode compiles lazily/hot reloads; the production build uses different optimization and route analysis.

---

## Skill 41 — Metadata and basic SEO

### Define

Next.js metadata generates the page title/description and search/social discovery information.

### Problem

An app with a generic or missing title looks unclear in browser tabs, search previews and sharing.

### LedgerLite solution

The root layout exports a basic title and description.

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

An authenticated dashboard has limited SEO value. For a public marketing page, Open Graph images, canonical URLs, a sitemap, robots and structured data are still pending.

### Interview questions

**Q1. Why does the dashboard need less SEO?**  
Private authenticated content should not be indexed by search engines; SEO focus belongs on public landing/docs pages.

**Q2. Why metadata on the server?**  
Crawlers get the title/description in the initial HTML/head.

---

## Skill 42 — React 19, JSX, components, props, state and hooks

### Define

React is a declarative, component-based UI library. JSX is a JavaScript syntax extension that describes the UI tree. Props are input from the parent, state is a component's changing memory, and hooks give access to React features.

### Problem

With vanilla DOM updates, the developer has to create/update elements manually and synchronize UI state. In LedgerLite, forms, modals, pagination, the language toggle, loading states and the request animation change continuously.

### LedgerLite solution

The UI is divided into reusable function components. Props pass data/actions, `useState` handles local interaction, `useEffect` handles activity/keyboard listeners, `useMemo` handles derived notebook pages, `useCallback` provides a stable navigation function, and array methods render/filter lists.

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
- Declarative rerender on state change.
- Clear component contracts through props/types.
- Hooks keep effects and derived values organized.

### Note

State must not be mutated; use the setter. For an update that depends on the previous state, the functional form is used: `setCount((previous) => previous + 1)`. A stable unique `key` helps React reconcile list items correctly.

### Interview questions

**Q1. What is JSX?**  
HTML-like syntax inside JavaScript/TypeScript that is transformed into React element calls at build time. `<h1>` and `<p>` are JSX elements.

**Q2. What is a component?**  
A reusable function that takes props and returns React UI.

**Q3. Props vs state?**  
Props are read-only input provided by the parent; state is changing data owned by the component.

**Q4. Why a functional state update?**  
When the new value depends on the previous state, you safely get the latest previous value even with queued/batched updates.

**Q5. When to use `useEffect`?**  
To synchronize with an external system outside React, such as an event listener/timer; normally not for calculating a derived render value.

**Q6. Why effect cleanup?**  
So listeners/timers are not duplicated or leaked when the component rerenders/unmounts.

**Q7. `map`, `filter`, `reduce`?**  
`map` transforms/renders each item; `filter` gives the subset matching a condition; `reduce` combines a collection into one accumulated result, such as a total.

**Q8. Why avoid the index as a list `key`?**  
On insert/reorder the index changes identity and wrong DOM/state can be reused. A database ID is a stable key.

**Q9. `useMemo` and `useCallback`?**  
`useMemo` caches a calculated value; `useCallback` caches a function reference. Use them only for a real identity/performance need, not everywhere.

**Q10. Controlled vs uncontrolled forms?**  
A controlled input's value is driven by React state. React Hook Form mostly uses a refs/uncontrolled approach, which gives fewer rerenders, while the form library manages the state.

---

## Skill 43 — Installed vs actually implemented skills

### Define

A dependency being installed is not proof of implementation. An interview claim is strong when the project has real imports, behavior, tests and problem evidence.

### Problem

Looking at `package.json` or `requirements.txt` and calling every dependency project experience would be an overclaim. On transitive and unused packages, an interviewer can follow up by asking for code.

### LedgerLite solution

Implemented, partially implemented, installed-but-unused and pending skills have been explicitly separated. The truth table below is the honest boundary for CV answers.

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
| Axios | Implemented in `http-client.ts`: typed calls, interceptors, error normalization and one-time 401 refresh/retry |
| WebSockets | Uvicorn dependency available, the app has no WebSocket feature |
| OpenTelemetry | Dependency present, no tracing instrumentation |
| Node.js | Indirect in the Next.js runtime/tooling; no Express backend |
| Express.js | Not used |
| Prisma ORM | Not used; SQLAlchemy is the ORM |
| MongoDB/Mongoose | Not used; PostgreSQL is the database |
| Socket.io | Not used |
| BullMQ | Not used |
| Pino | Not used; Python structured logging is used |
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

- Interview answers stay credible.
- Relevant follow-up code is explained confidently.
- Future learning gaps become a clear roadmap.

### Note

"Exposure" and "implemented in a production-style project" are not the same claim. Evidence for a skill used in a separate project should be given from that project.

### Interview questions

**Q1. Where and why is Axios used in LedgerLite?**  
The browser data layer uses a shared Axios client to call the `/api` BFF. Its interceptors trace requests, normalize FastAPI errors, and refresh then retry the original request once after the first `401`. Server Components and Route Handlers use native `fetch()` for server-side work.

**Q2. Why not both Prisma and SQLAlchemy?**  
These are alternative ORMs/ecosystems. SQLAlchemy is the natural choice for a FastAPI/Python project; it is cleaner to demonstrate Prisma in a separate Node/TypeScript project.

**Q3. What is the equivalent of Jest/Supertest in LedgerLite?**  
In the FastAPI stack, pytest + HTTPX AsyncClient integration testing fulfill the equivalent responsibility.

**Q4. Is the project production-ready?**  
“It is production-minded and demonstrates strong security/accounting patterns, but frontend tests, CI/CD, full containerization, deployment, explicit CSRF hardening and monitoring integration are remaining production steps.”

---

## Skill 44 — Axios typed client, interceptors and refresh retry

### Define

Axios is a promise-based HTTP client. An instance stores shared base configuration; interceptors run centralized logic before a request is sent and after a response or error is received.

### Problem

Repeating the base URL, JSON handling, FastAPI error parsing and expired access-token refresh in every feature would create duplication and inconsistent behavior. Calling FastAPI directly from the browser would also complicate the token boundary and CORS.

### LedgerLite solution

Browser features use a shared `httpClient` to call the same-origin `/api` BFF. Typed generics describe response contracts. Request/response interceptors record the learning trace. The error interceptor converts FastAPI `detail` into `ApiError`. On the first `401`, raw Axios calls `/api/auth/refresh`, then repeats the original request only once using the `_retry` flag.

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

- Consistent typed HTTP calls across features.
- FastAPI errors normalized into user-friendly messages.
- Centralized one-time recovery from an expired access token.
- HttpOnly tokens are not exposed to browser JavaScript.
- Timeout and request tracing are configured in one place.

### Note

Axios is used for the browser data layer. Next.js Server Components and Route Handlers use native server-side `fetch()`. The refresh request uses raw `axios.post()` so the same `httpClient` interceptor does not recursively trigger itself. `_retry` prevents an infinite refresh loop.

### Interview questions

**Q1. Why create an Axios instance?**  
It provides one consistent client for the base URL, JSON header, timeout and interceptors instead of repeating them in every feature.

**Q2. Request interceptor vs response interceptor?**  
A request interceptor inspects or changes config before dispatch. A response interceptor centrally transforms or recovers from a successful response or error.

**Q3. Why retry the original request only once after `401`?**  
If refresh also fails, an unlimited loop or network storm must not start. `_retry` blocks a second automatic attempt.

**Q4. Why not use the shared `httpClient` for refresh?**  
If the refresh request returned `401`, the same interceptor could trigger itself recursively; raw Axios avoids that cycle.

**Q5. Why does Axios not attach the token header itself?**  
The access token is in an HttpOnly cookie and client JavaScript cannot read it. The browser calls the `/api` BFF; the Route Handler reads the cookie and sends the Bearer header to FastAPI.

**Q6. Is the generic `<MemberPage>` runtime validation?**  
No. It is a compile-time TypeScript contract. Runtime response correctness relies on the backend Pydantic contract/tests; runtime parsing should be added for untrusted third-party data.

**Q7. Why normalize FastAPI `detail`?**  
Axios's generic “Request failed” message does not explain a business conflict. `toApiError()` carries meaningful `409`, `403` and backend detail into the UI.

**Q8. What is the role difference between Axios and TanStack Query?**  
Axios performs the network request. TanStack Query manages server-state caching, loading/error state, retries and invalidation.

---

## Skill 45 — Reporting aggregates, invoice filters and Chart.js

### Define

A reporting endpoint uses database aggregates such as `COUNT` and `SUM` to return a dashboard-ready summary instead of raw rows. Server-side filters reduce the result set in the database according to query parameters. Chart.js renders structured counts as a responsive visual chart.

### Problem

The dashboard only showed totals from the first customer page. Calculating invoice totals in the frontend would require downloading every paginated invoice, which would be slow and incomplete. Adding different currencies together would be an accounting error. The invoice register also lacked status and customer filters.

### LedgerLite solution

`GET /reports/summary` aggregates customers and invoices for the authenticated organization. Every query is scoped by `organization_id`. Invoice status counts are global for that tenant, while financial totals are grouped by currency. Void invoices are excluded from the invoiced money total. `GET /invoices` applies optional `status` and `customer_id` filters to both the count and row queries. The Next.js BFF forwards the token from the cookie, TanStack Query caches the summary, and Chart.js renders the status doughnut.

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

- The frontend receives one predictable dashboard contract.
- Totals remain complete despite pagination.
- Tenant A's data cannot enter Tenant B's aggregates.
- PKR and USD are not added together incorrectly.
- Filters run in the database, not against an incomplete browser page.
- Chart.js provides a responsive status distribution.
- Customer, invoice and payment mutations invalidate the summary cache.

### Note

The endpoint internally executes multiple focused aggregate queries; “one request” does not necessarily mean “one SQL query.” The current report contains lifetime totals. Date ranges and a monthly revenue series are future enhancements. The chart is paired with labels for accessibility and is not the only source of information.

### Interview questions

**Q1. Why not calculate dashboard totals with frontend `reduce()`?**
The invoice list is paginated, so the frontend only has the current page. A backend aggregate calculates the complete tenant dataset accurately.

**Q2. Why does every report query contain `organization_id`?**
Authentication identifies the user; the tenant filter determines which company's data that user may access. Without it, cross-company data could leak.

**Q3. Why group by currency?**
Adding PKR 100 and USD 100 into 200 is meaningless. Invoiced, paid and outstanding totals must remain separate per currency.

**Q4. Why exclude void invoices from invoiced revenue?**
A void invoice remains as historical evidence but is no longer an active financial claim. It may appear in status counts but not in the invoiced money total.

**Q5. What happens for an invalid status filter?**
FastAPI `Literal` validation rejects an unsupported value with `422` before a database query runs.

**Q6. Why must the count and list queries use the same filters?**
Pagination metadata and visible rows must stay consistent. An unfiltered count would produce incorrect totals and page counts.

**Q7. Why are filters included in the TanStack query key?**
Paid, issued and customer-specific results are different server states. Omitting the filters could display the wrong cached list.

**Q8. When is the dashboard cache refreshed?**
Customer create/delete, invoice create/update/void and payment create/reverse invalidate `dashboard-summary`, then authoritative totals are refetched.

**Q9. What is the actual Chart.js use in the project?**
The dashboard doughnut chart displays issued, partially paid, paid and void invoice counts as a responsive visual.

**Q10. Are one request and one SQL query the same?**
No. The browser calls one summary endpoint; the backend may execute multiple efficient aggregates for clarity and currency correctness.

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
  -> Server Component reads the current authenticated user
  -> role-aware navigation hides the owner-only Team link from members
  -> React Hook Form + Zod validates create/update values
  -> Axios calls the same-origin Next.js BFF
  -> Route Handler reads the HttpOnly access cookie
  -> FastAPI authenticates the current user
  -> get_current_owner protects member changes/organization PATCH
  -> organization_id scopes the member query
  -> PostgreSQL commit or 409 rollback
  -> TanStack invalidates the member/organization cache
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

Answer any skill in this pattern:

> **[Definition]** SQLAlchemy is a Python ORM and SQL toolkit.  
> **[Problem]** LedgerLite needed persistent relational data without repeating raw connection and mapping code.  
> **[Solution]** I used SQLAlchemy 2 with asyncpg, an async engine, per-request AsyncSession and tenant-scoped typed queries.  
> **[Code evidence]** The engine/session live in `app/db/session.py`, models in `app/models`, and routes execute `select()` statements through the injected session.  
> **[Benefit]** This gave connection pooling, transactions, typed table mapping and reusable queries.  
> **[Note]** I still understand the generated SQL; ORM does not remove the need for indexes, transaction design and query analysis.

Follow this same sequence in every answer. If a feature is pending, say so directly; overclaiming gets exposed fastest on an interview follow-up question.




