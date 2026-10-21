from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.middleware.request_logging import request_logging_middleware
from app.api.routes.customers import router as customers_router
from app.api.routes.health import router as health_router
from app.api.routes.invoices import router as invoices_router
from app.api.routes.members import router as members_router
from app.api.routes.payments import (
    reversal_router as payment_reversal_router,
    router as payments_router,
)
from app.api.routes.auth import router as auth_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.reports import router as reports_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.redis import redis_client
from app.db.session import engine


configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await redis_client.aclose()
    await engine.dispose()


openapi_tags = [
    {
        "name": "System",
        "description": "Check whether the API is running.",
    },
    {
        "name": "Authentication",
        "description": "Create an account, log in and manage access tokens.",
    },
    {
        "name": "Members",
        "description": "Owner-only organization member and role management.",
    },
    {
        "name": "Organizations",
        "description": "View and update the authenticated organization.",
    },
    {
        "name": "Customers",
        "description": "Create, read, update and delete customers.",
    },
    {
        "name": "Invoices",
        "description": (
            "Create, read, update and void invoices with "
            "server-calculated totals."
        ),
    },
    {
        "name": "Payments",
        "description": (
            "Record, view and reverse tenant-scoped invoice payments."
        ),
    },
    {
        "name": "Reports",
        "description": "Tenant-scoped dashboard counts and currency-safe totals.",
    },
]


app = FastAPI(
    title=settings.app_name,
    description=(
        "LedgerLite is a learning-focused, multi-tenant accounting API. "
        "Open an endpoint, select **Try it out**, use the prepared example, "
        "and select **Execute**."
    ),
    version=settings.app_version,
    openapi_tags=openapi_tags,
    swagger_ui_parameters={
        "displayRequestDuration": True,
        "docExpansion": "none",
        "tagsSorter": "alpha",
        "operationsSorter": "method",
        "persistAuthorization": True,
    },
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(request_logging_middleware)

app.include_router(health_router)
app.include_router(customers_router)
app.include_router(organizations_router)
app.include_router(auth_router)
app.include_router(members_router)
app.include_router(invoices_router)
app.include_router(payments_router)
app.include_router(payment_reversal_router)
app.include_router(reports_router)
