---
name: api-security
description: >-
  Zero-trust security checklist and standards for building or reviewing API endpoints
  on this platform: Django/DRF views, serializers, multi-tenant PostgreSQL isolation,
  authentication/RBAC, rate limiting, payment webhooks (IntaSend, Safaricom Daraja),
  and concurrency-sensitive flows like seat holds. Use this any time you write, edit,
  or review an endpoint, serializer, view, permission class, webhook handler, or
  settings related to authentication or HTTP headers — even if the user just says
  "add an endpoint" or "review this view" without mentioning security explicitly.
  Also use it before telling the user any endpoint or PR is ready.
compatibility: Django + Django REST Framework, PostgreSQL (schema-per-tenant), Redis
---

# API & Endpoint Security Skill

This platform handles multi-tenant data and real money (via IntaSend and Safaricom
Daraja), so endpoint bugs here are not cosmetic — they can leak another tenant's data,
double-credit a payment, or oversell seats. Treat every new or modified endpoint as
guilty until it passes the checklist below.

Consult this skill proactively, not just when the user asks for a "security review."
Writing a new view, serializer, or webhook handler *is* a security task on this
platform.

---

## 1. Verification Checklist

Before marking any endpoint work complete, walk through each item and be able to point
to the line of code that satisfies it. Don't just assert compliance — check.

- [ ] **BOLA / tenant isolation** — query is scoped to `request.tenant` / the correct schema
- [ ] **Broken property auth** — serializer declares fields explicitly, no secrets leak
- [ ] **AuthN & RBAC** — `AllowAny` only on genuine public bootstrap endpoints
- [ ] **Rate limiting** — endpoint has an appropriate throttle scope
- [ ] **Concurrency** — writes to contended resources (seats, balances) are locked
- [ ] **Webhook integrity** — signature verified, idempotency key checked, atomic write
- [ ] **Input validation** — strict serializer/validator, no raw string interpolation into queries
- [ ] **HTTP hardening** — production settings unchanged/still enforced

If you can't check a box, either fix it or flag it explicitly to the user — don't
silently skip it.

---

## 2. Core Standards by Layer

### A. Serializers & Data Sanitization

**Why:** DRF serializers are the actual trust boundary — a queryset can be correctly
scoped and still leak everything if the serializer exposes the wrong fields.

1. Never use `fields = '__all__'`. Declare exposed fields explicitly, every time.
2. Never expose, even accidentally through a nested serializer or `source=`:
   - `daraja_consumer_key`, `daraja_consumer_secret`, `daraja_passkey`
   - `intasend_secret_key`, `publishable_key`
   - settlement bank account numbers, personal phone numbers
   - password hashes or any auth token field
3. Privilege/financial fields (`is_staff`, `is_superuser`, `status`, `balance`,
   `platform_fee_percent`) must be `read_only=True` on any serializer a non-admin user
   can reach — read-only on the serializer, not just "the view doesn't send it."

```python
# Bad — leaks whatever the model gains next migration
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'

# Good — explicit allowlist, privileged fields locked read-only
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'seat', 'showtime', 'status', 'created_at']
        read_only_fields = ['status']
```

### B. Multi-Tenancy & Authorization (BOLA / IDOR Defense)

**Why:** A correct-looking `Model.objects.get(id=...)` is an IDOR waiting to happen if
it isn't also scoped to the requesting tenant/user — the URL alone shouldn't be enough
to reach another tenant's row.

1. Confirm `TenantMainMiddleware` has called `connection.set_schema(tenant.schema_name)`
   before any query in the view runs.
2. Clear tenant `ContextVar`s in a `finally` block — threads get reused across requests,
   so a leaked context var silently leaks into the next tenant's request.
3. Scope every queryset to the requester: `Booking.objects.filter(customer=request.user)`,
   not `Booking.objects.get(pk=pk)` followed by an ownership check after the fact.
4. Use UUIDv4 for public URL identifiers, not sequential integers — sequential IDs make
   enumeration trivial even with correct auth checks.

### C. Rate Limiting & DoS Defense

Set tiered throttles in `DEFAULT_THROTTLE_RATES` and apply the right scope per endpoint
— a login or payment endpoint under the generic `user` rate is functionally unthrottled
for brute-force/abuse purposes:

| Scope             | Rate       |
|--------------------|-----------|
| `anon`             | 60/minute |
| `user`             | 300/minute|
| `auth_login`       | 5/minute  |
| `payment_initiate` | 5/minute  |
| `bootstrap`        | 120/minute|

### D. Payment Webhooks (IntaSend & Safaricom Daraja)

**Why:** Webhooks are attacker-reachable by definition — no session, no CSRF
protection, and gateways retry on timeout, so a handler that isn't idempotent will
double-credit or double-book on a retry alone, no attacker required.

1. Verify `X-IntaSend-Signature` (HMAC-SHA256) or the Daraja bearer token on *every*
   callback before touching the database.
2. Idempotency lock before processing:
   ```python
   lock_acquired = cache.add(f"webhook:lock:{transaction_id}", "processing", timeout=86400)
   if not lock_acquired:
       return HttpResponse(status=200)  # already handled or in flight — ack and exit
   ```
3. Don't trust the webhook payload's status field alone — query the gateway API
   directly to confirm transaction status before committing a payment confirmation.
4. Wrap revenue splitting + ticket issuance in a single `transaction.atomic()` block so
   a mid-flight failure can't credit money without issuing the ticket, or vice versa.

### E. Concurrency & Seat Hold Defense

**Why:** Seat availability is a classic race condition — two requests can both read
"available" before either writes "held," overselling the seat.

1. Lock availability reads with `Seat.objects.select_for_update().filter(...)` inside
   the same transaction as the write.
2. Hold seats via Redis with a TTL: `cache.set(f"hold:seat:{seat_id}", user_id, timeout=420)`
   (7 minutes) so an abandoned checkout releases the seat automatically.
3. Cap order size (reject requests holding more than 8 seats) to blunt scalping.

### F. HTTP Security Headers & Production Hardening

Confirm production settings still hold these — a debugging session or a new
environment file is the usual way these regress:

```python
DEBUG = False
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 63072000  # 2 years
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## 3. Required Test Coverage

Every new or modified endpoint needs automated tests proving the following — these are
what the checklist in Section 1 looks like as assertions, so if you can't write one of
these tests, that's a signal the endpoint isn't actually compliant yet:

1. **Happy path** — 200 OK with the expected schema.
2. **Unauthenticated path** — 401/403 when the token is missing or invalid.
3. **Cross-tenant path** — 404/403 when the requester tries to reach another tenant's
   object (not just "another user's" — actually another schema).
4. **Sanitization** — explicit assertion that the response body contains none of the
   secret/credential field names listed in Section 2A, not just that the test "passes."
5. **Idempotency** — submitting the same webhook payload twice does not double-charge
   or double-book.

---

## Before you say it's done

Re-read the checklist in Section 1 against the actual diff, not from memory of what you
intended to write. If anything is unchecked, say so to the user explicitly rather than
reporting the endpoint as secure.
