# Taminak Marketplace

Taminak / تأمینک — Master Prompt for MVP

Build the first production-oriented MVP of Taminak / تأمینک, a Persian-first B2B marketplace for restaurants and cafés to discover suppliers, compare products and prices, build a multi-supplier cart, submit supplier-specific orders, and communicate directly with suppliers for final payment and delivery arrangements.

The MVP goal is not to build a complete commerce infrastructure.

The goal is to validate this real-world workflow:

Discover → Compare → Trust → Add to Cart → Submit Orders → Supplier Contact → Fulfill

1. PRODUCT IDENTITY

Brand:

تأمینک

Technical / English name:

Taminak

Taminak is a B2B procurement marketplace.

It is NOT:

a restaurant

a food delivery service

a supermarket

a food manufacturer

a generic consumer marketplace

The primary audience is:

cafés

restaurants

food-service businesses

suppliers of ingredients and restaurant supplies

The main customer value proposition is:

پیدا کردن محصول، مقایسه تأمین‌کننده‌ها و قیمت‌ها، و ثبت سفارش در یک مکان.

2. CURRENT BUSINESS STRATEGY

Taminak is being built as an independent Marketplace first.

A previous product called MoteKitchen exists separately and currently handles restaurant-side operational/procurement workflows.

MoteKitchen is NOT part of this MVP.

Do NOT build these MoteKitchen features now:

departments

internal staff tasks

internal purchase requests

approval workflows

internal inventory management

restaurant operations

staff coordination

procurement task management

In the future, the MoteKitchen functionality may become the Restaurant Operations side of Taminak.

Future conceptual architecture:

                         Taminak
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       B2B Marketplace              Restaurant Operations
             │                             │
             └──────────────┬──────────────┘
                            ▼
                     Shared Identity
                            ▼
                       Shared Supabase

Do NOT build this future system now.

3. EXISTING SUPABASE BACKEND — CRITICAL

This Lovable project MUST use the existing Supabase project:

Project ID:
enkfqibbetabpweysema

The backend is already created and the database migrations have already been executed.

Do NOT:

create a new Supabase project

create a new database

use Lovable Cloud as a replacement backend

create a second authentication system

create duplicate database tables

The existing Supabase database is the single source of truth.

4. DATABASE RULE — VERY IMPORTANT

The existing database schema has already been designed and migrated.

The current authoritative tables are:

Identity

profiles
organizations
memberships

Marketplace

products
supplier_products
carts
cart_items
orders
order_items

Marketplace extensions

platform_admins
supplier_applications
product_submissions
reviews

The database also contains server-side functions such as:

is_member_of_org
has_role_in_org
is_any_staff_member_of_org
is_platform_admin
create_organization_with_owner
approve_supplier_application
approve_product_submission

Treat all of these as existing backend infrastructure.

5. DO NOT MODIFY THE DATABASE AUTOMATICALLY

For this project:

DO NOT:

create a duplicate table

rename a table

delete a table

alter an existing column

add a new role

modify RLS

modify an existing function

create an alternative organization model

create a second product model

create a second order model

create a second supplier model

unless the user explicitly asks for a database change.

If you believe a feature requires a database modification:

Stop.

Explain exactly why.

Identify the smallest required migration.

Ask for approval.

Only implement the change after approval.

Never silently change the database.

Never assume a missing feature should be solved by creating a new table.

6. TECHNOLOGY STACK

Use:

React 19

TanStack Start

TanStack Router

TanStack Query / React Query

TypeScript

Supabase

PostgreSQL through Supabase

Supabase Auth

Supabase Storage

Supabase Realtime where useful

Use the existing project's conventions where available.

Do not introduce:

Next.js

NestJS

microservices

another backend framework

another database

another authentication provider

7. IDENTITY MODEL

The identity architecture is:

Supabase Auth
↓
profiles
↓
memberships
↓
organizations

Meaning:

User = human person

Profile = personal information

Organization = business entity

Membership = relationship between person and business

A person can belong to multiple organizations.

A person can have different roles in different organizations.

Example:

Ali
├── owner → Restaurant A
├── purchasing_manager → Restaurant B
└── supplier_admin → Supplier C

The frontend must NOT assume:

one user = one organization

Do NOT store organization ownership or global roles on profiles.

8. ORGANIZATION TYPES

For the MVP:

restaurant
supplier

A café is represented as:

organization.type = "restaurant"

Do NOT introduce a separate cafe organization type.

This distinction is intentional.

9. BUYER-FIRST USER EXPERIENCE

The default registration path is for a buyer.

A normal visitor should be able to:

Register as a person.

Choose their location.

Browse suppliers.

Browse products.

Compare prices.

Compare supplier ratings.

Read reviews.

Add products from different suppliers to a cart.

Submit supplier-specific orders.

A buyer should NOT be forced to become a restaurant organization at the moment of account creation.

However, before creating an organization-owned cart/order, guide the user through creating or selecting the restaurant/café organization.

Use the existing:

create_organization_with_owner

function rather than manually inserting the first owner membership from the browser.

10. BUYER REGISTRATION

Primary registration:

ثبت‌نام

Collect only basic personal account information.

Do not ask:

supplier information

business verification

tax information

complex restaurant information

unless needed for placing an order.

The initial experience should be:

ثبت‌نام
↓
حساب شخصی
↓
انتخاب استان و شهر
↓
Marketplace

11. LOCATION EXPERIENCE

The initial target market is Iran.

Currency is:

تومان

The buyer should be able to select:

province

city

The marketplace should allow:

Local discovery

Show suppliers in the selected city.

Province discovery

Allow the buyer to browse suppliers across all cities in the selected province.

Broader discovery

Allow the buyer to browse suppliers across Iran.

Do NOT implement:

GPS

live geolocation

route optimization

map-based delivery

Location is currently for marketplace discovery/filtering.

Use the existing organization fields:

province
city
address

12. BUYER HOME PAGE

The homepage should immediately communicate the value.

Primary brand:

تأمینک

Primary headline:

تأمین و خرید مواد اولیه برای کافه و رستوران

Supporting text:

محصولات موردنیاز کسب‌وکارتان را پیدا کنید، تأمین‌کننده‌ها و قیمت‌ها را مقایسه کنید و سفارش دهید.

Primary search:

چه محصولی نیاز دارید؟

Primary CTA:

مشاهده محصولات

Secondary CTA:

فروشنده هستید؟ درخواست فروشندگی

The homepage should emphasize:

product discovery

supplier discovery

price comparison

trust through ratings/reviews

Do not make the homepage look like a consumer supermarket.

13. MARKETPLACE DISCOVERY

Buyers should be able to discover suppliers by:

province

city

product

price

availability

rating

The simplest useful filtering UI is preferred.

Do not build a complex filtering system before real users need it.

14. PRODUCT MODEL

There are two different concepts:

Product

and:

Supplier Product

The relationship is:

Product
│
├── Supplier A offer
├── Supplier B offer
└── Supplier C offer

Example:

قهوه عربیکا ۱ کیلو

Supplier A → 1,200,000 تومان
Supplier B → 1,150,000 تومان
Supplier C → 1,350,000 تومان

A canonical Product must NOT be created separately for every supplier.

Supplier-specific pricing and availability belong to supplier_products.

15. SUPPLIER PRODUCT CREATION

Suppliers should NOT directly create canonical marketplace products.

Instead:

Supplier
↓
Product submission
↓
Admin review
↓
Approval
↓
Canonical Product + Supplier Product

Use the existing:

product_submissions

table.

Use the existing:

approve_product_submission

function.

Submission statuses:

pending
approved
rejected

The supplier can see the status of their submissions.

Do not build an advanced product moderation system.

16. SUPPLIER REGISTRATION

The normal account flow is buyer-first.

Supplier onboarding must be a separate secondary path:

فروشنده هستید؟
[ درخواست فروشندگی ]

Recommended route:

/become-supplier

Flow:

Personal account
↓
Supplier Application
↓
Business information
↓
Submit application
↓
Pending review
↓
Admin approval/rejection

Use:

supplier_applications

and:

approve_supplier_application

The supplier application should collect:

business name

owner/contact name

phone

email

province

city

address

optional business description

17. SUPPLIER VERIFICATION

For MVP, supplier verification is manual.

Do NOT implement:

government KYC

tax verification

banking verification

automated company registry verification

payment verification

automated legal verification

The workflow is simply:

Application
↓
Admin Review
↓
Approve / Reject

After approval:

Supplier Organization
↓
supplier_admin Membership
↓
Supplier Dashboard

18. SUPPLIER DASHBOARD

Approved suppliers should have:

/supplier
/supplier/products
/supplier/products/new
/supplier/submissions
/supplier/orders
/supplier/orders/:id
/supplier/profile

Keep it simple.

Main areas:

dashboard

products

product submissions

orders

profile

Do not build advanced analytics.

19. SUPPLIER PROFILE

Approved suppliers have a public-facing profile.

Show:

supplier name

province

city

description

average rating

review count

available products

Do not expose sensitive/private business information.

20. REVIEWS AND RATINGS

Implement a simple review system.

A review belongs to a real completed order.

A review contains:

rating: 1 to 5
comment: optional

Display supplier rating like:

★★★★★ 4.7
۱۲۳ نظر

Basic review list:

★★★★★
خرید خوبی بود و کیفیت محصول مطابق توضیحات بود.

Do NOT implement:

likes

replies

review photos

helpfulness votes

complex moderation

reputation levels

review badges

A user cannot review a supplier without a completed order.

Use the existing reviews table.

21. PRODUCT DETAIL PAGE

Show:

product name

image

description

brand

unit

category

Then show supplier offers.

Example:

قهوه عربیکا ۱kg

فروشنده A
★★★★★ 4.7
1,200,000 تومان
موجود
[افزودن به سبد]

فروشنده B
★★★★☆ 4.4
1,150,000 تومان
موجود
[افزودن به سبد]

The buyer must choose the specific supplier offer.

22. CART MODEL

The cart belongs to the buyer's restaurant/café organization.

A single cart MAY contain products from multiple suppliers.

Example:

Cart
├── Coffee → Supplier A
├── Milk → Supplier B
├── Syrup → Supplier A
└── Chocolate → Supplier C

This is an intentional marketplace behavior.

23. MULTI-SUPPLIER CHECKOUT

At checkout, group cart items by supplier.

Example:

Cart
├── Supplier A
│ ├── Coffee
│ └── Syrup
│
├── Supplier B
│ └── Milk
│
└── Supplier C
└── Chocolate

When the buyer submits the checkout:

Cart
↓
Group by supplier
↓
Create supplier-specific orders

Order A → Supplier A
Order B → Supplier B
Order C → Supplier C

The existing orders.supplier_organization_id remains the source of truth.

Do NOT convert one orders row into a multi-supplier order.

Do NOT add a parent checkout entity unless it is actually necessary.

This design should keep future extensions possible without over-engineering the MVP.

24. CHECKOUT

Checkout is intentionally simple.

Collect:

buyer organization

delivery address

contact phone

note

Then:

ثبت سفارش

No online payment in MVP.

No delivery fee calculation.

No courier selection.

No logistics engine.

25. POST-ORDER PROCESS

After submitting an order:

Buyer
↓
Order created
↓
Supplier sees the order
↓
Supplier contacts buyer
↓
They agree on:

- payment method
- delivery method
- delivery cost
- final fulfillment details
  ↓
  Purchase is completed

This is intentional MVP behavior.

Do not build payment or logistics infrastructure now.

26. ORDER STATUS

Use the existing statuses:

pending
confirmed
rejected
completed
cancelled

Typical flow:

pending
↓
confirmed
↓
completed

Alternative outcomes:

pending → rejected
pending → cancelled

Do not introduce shipment-specific statuses.

27. HISTORICAL PRICES

Historical order prices are stored in:

order_items.unit_price

Never recalculate old orders using the current supplier product price.

Example:

Purchase time:
Coffee = 1,200,000

Later current supplier price:
Coffee = 1,350,000

The old order must remain:

1,200,000

Also use:

order_items.product_name

as the historical product-name snapshot.

28. PLATFORM ADMIN

Use the existing:

platform_admins

table.

Admin capabilities:

supplier applications

supplier approval/rejection

product submission approval/rejection

view orders

basic product/category management

Admin routes:

/admin
/admin/suppliers
/admin/products
/admin/product-submissions
/admin/orders

Admin access must be protected.

Do not expose admin functionality to normal users.

29. AUTHORIZATION

Use the existing database/RLS authorization.

Frontend permissions are for UX only.

Database RLS is the actual security boundary.

Examples:

A buyer can:

browse public products

view supplier offers

manage their organization's cart

view their organization's orders

A supplier can:

manage its own supplier offers

view orders assigned to its organization

update its own orders according to the existing authorization rules

A user cannot access another organization's private orders simply by changing an ID in the URL or request.

Do not bypass RLS.

30. TANSTACK QUERY

Use TanStack Query for server state:

products

supplier offers

suppliers

carts

orders

reviews

supplier applications

product submissions

Use:

queries

mutations

query invalidation

caching

loading state

error state

optimistic updates where appropriate

Do not duplicate server state unnecessarily in global React state.

31. REALTIME

Use Supabase Realtime selectively.

Useful MVP use cases:

Supplier

New order notification.

Buyer

Order status update.

Do not make every table realtime.

32. SEARCH

Use the existing PostgreSQL data.

MVP search should cover:

product name

description

brand

category

Do NOT add:

Elasticsearch

Meilisearch

Typesense

OpenSearch

another search backend

Search can be improved later.

33. MONEY AND CURRENCY

The initial market is:

Iran

The initial currency is:

تومان

Store prices as numeric values.

Do NOT store formatted strings such as:

"1,250,000 تومان"

Store:

1250000

Display formatting in the UI.

Do not build multi-currency UI in MVP.

The architecture may be extended later with an explicit currency field.

34. MOBILE AND RTL

The application must be:

RTL

Persian-first

mobile-first

responsive

accessible

Prioritize mobile usability for:

search

product comparison

cart

checkout

order status

supplier order management

35. VISUAL DESIGN

Brand:

تأمینک

Style:

minimal

modern

professional

trustworthy

practical

B2B

clean

Avoid:

generic supermarket design

food delivery visual language

cartoon illustrations

excessive animations

excessive gradients

consumer e-commerce clutter

Use a restrained warm/deep-green visual direction if consistent with the existing Taminak branding.

36. MAIN ROUTES

Public

/
/login
/signup
/products
/products/:id
/suppliers
/suppliers/:id
/become-supplier

Buyer

/cart
/checkout
/orders
/orders/:id

Supplier

/supplier
/supplier/products
/supplier/products/new
/supplier/products/:id
/supplier/submissions
/supplier/orders
/supplier/orders/:id
/supplier/profile

Admin

/admin
/admin/suppliers
/admin/products
/admin/product-submissions
/admin/orders

Use protected routes according to auth and authorization.

37. INITIAL MVP PHASES

Do not build the entire application in one giant step.

Phase 1 — Foundation

Build:

Supabase connection

Auth

session handling

routing

route protection

RTL design foundation

global application shell

TanStack Query

buyer registration

location selection

Phase 2 — Buyer Marketplace

Build:

supplier discovery

city/province filtering

product listing

product search

product details

supplier comparison

supplier profiles

ratings/reviews

Phase 3 — Cart & Orders

Build:

cart

multiple supplier cart items

supplier grouping

checkout

creation of separate supplier-specific orders

buyer order history

order details

order status

Phase 4 — Supplier

Build:

become supplier

supplier application

supplier dashboard

supplier profile

product submissions

supplier offer management

order management

Phase 5 — Admin

Build:

supplier application review

supplier approval

product submission review

product approval

basic marketplace administration

38. WHAT NOT TO BUILD

Do NOT implement:

online payments

payment gateways

wallets

delivery engine

courier app

GPS tracking

automated logistics

inventory management

departments

internal purchase requests

approvals for restaurant staff

tasks

MoteKitchen functionality

accounting

ERP integration

subscriptions

loyalty

AI recommendations

advanced search backend

microservices

NestJS

native mobile app

complex analytics

complex review moderation

review replies

social features

39. FUTURE MOTEKITCHEN COMPATIBILITY

Taminak must remain compatible with future integration of the existing MoteKitchen application.

Future shared identity:

auth.users
↓
profiles
↓
memberships
↓
organizations

The future Restaurant Operations domain may introduce:

departments
purchase_requests
purchase_request_items
approvals
inventory
tasks

Those features should reference organizations and users separately.

Future workflow:

Restaurant Staff
↓
Purchase Request
↓
Manager Approval
↓
Taminak Marketplace
↓
Supplier Comparison
↓
Supplier-Specific Order
↓
Supplier

Do not implement this workflow now.

40. DATABASE MIGRATION SAFETY

The current database was created through Supabase migrations.

The database is authoritative.

If any feature appears to require a schema change:

DO NOT modify the database automatically.

Instead:

Explain the need.

Specify the exact schema change.

Propose a new migration.

Ask for confirmation.

Never modify an already-applied migration.

41. FIRST ACTION AFTER RECEIVING THIS PROMPT

Do NOT immediately build the complete application.

First perform a compatibility check.

Inspect:

Supabase connection

current tables

current relationships

existing functions

existing RLS policies

Then report:

which required tables exist

which required functions exist

whether the current schema matches this specification

whether anything is missing or inconsistent

If the schema is compatible, proceed with Phase 1.

If anything is inconsistent, STOP and explain the mismatch.

Do not attempt to fix the database automatically.

42. DEVELOPMENT PRINCIPLE

Follow:

Simple now, extensible later.

The MVP must optimize for:

real buyer usage

real supplier usage

real product discovery

real supplier comparison

real orders

not feature count.

The core marketplace loop is:

Buyer
↓
Discover
↓
Compare
↓
Trust
↓
Cart
↓
Orders
↓
Supplier Contact
↓
Fulfillment

Build this loop well before expanding the product.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a0b439d4-56ec-4382-bc45-de555be49f5b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
