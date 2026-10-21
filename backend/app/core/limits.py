from decimal import Decimal


# Primary keys are Postgres INTEGER columns. A larger number can never match a
# row, and passing it to the driver overflows (500), so reject it up front.
DB_ID_MAX = 2_147_483_647

# Money columns are Numeric(14, 2): at most 12 digits before the point.
MONEY_MAX = Decimal("999999999999.99")
