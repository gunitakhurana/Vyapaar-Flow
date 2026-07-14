<div align="center">

# VyapaarFlow

### Bringing wholesalers and retailers onto one connected platform

A role-based B2B commerce platform for managing products, inventory, orders, payments, and business disputes.

</div>

---

## About VyapaarFlow

I built **VyapaarFlow** to simplify the everyday relationship between wholesalers and retailers.

A large part of wholesale and retail trade still happens through phone calls, handwritten records, spreadsheets, and messaging applications. A retailer may call multiple wholesalers to ask whether a product is available. The wholesaler may write the order down somewhere, manually update stock later, and separately follow up about payment.

This creates a fragmented process where:

- Retailers cannot easily see which products are available.
- Wholesalers have to manage products, orders, and payments separately.
- Inventory records may not reflect actual sales.
- Order updates depend on repeated calls or messages.
- Offline orders are often disconnected from digital records.
- Disputes do not have a clear history or resolution process.

VyapaarFlow brings these activities together.

It gives wholesalers a place to manage their products and incoming orders, gives retailers a structured way to discover and purchase products, and provides an administrative process for resolving issues between both parties.

The aim is not simply to build an online catalogue. The aim is to represent the **complete business journey**:

```text
Product Listing
      ↓
Product Discovery
      ↓
Cart and Checkout
      ↓
Order Processing
      ↓
Inventory Management
      ↓
Payment Tracking
      ↓
Dispute Resolution
```

---

# Who Uses VyapaarFlow?

VyapaarFlow provides different experiences for three types of users.

## Wholesalers

Wholesalers use the platform to:

- Add products to their catalogue
- Enter prices, GST, and available quantities
- Manage inventory
- Update existing product information
- Receive orders from retailers
- Accept, reject, ship, and complete orders
- Record orders received outside the application
- Track pending payments
- Raise disputes related to previous orders

## Retailers

Retailers use the platform to:

- Browse products from wholesalers
- Search for products or sellers
- Check prices and available quantities
- Add products to a cart
- Purchase products from multiple wholesalers
- Track their orders
- View order and payment status
- Raise order-related disputes

## Administrators

Administrators use the platform to:

- Review disputes raised by wholesalers and retailers
- View the order connected to a complaint
- Investigate the history of both parties
- Add investigation notes
- Resolve, reject, or close tickets
- Maintain a structured record of the resolution

---

# The Wholesaler Experience

## A Business Overview From One Place

After signing in, the wholesaler is taken to a dedicated landing page that provides an overview of their business activity.

Instead of moving between several disconnected records, the wholesaler can quickly understand what requires attention.

The dashboard acts as the starting point for managing:

- Products
- Inventory
- Incoming orders
- Order progress
- Pending payments
- Business support requests

<p align="center">
  <img
    src="./screenshots/Wholesaler%20Landing%20Page.jpeg"
    alt="VyapaarFlow wholesaler landing page"
    width="900"
  />
</p>

<p align="center">
  <em>Wholesaler landing page showing the main business-management options.</em>
</p>

---

## Adding Products to the Catalogue

A wholesaler can add products by entering the information a retailer needs before placing an order.

This includes:

- Product name
- Selling price
- Available stock
- GST percentage

Once a product is added, it becomes part of the wholesaler's catalogue and can be shown to retailers.

The product-creation flow is intentionally simple so that a wholesaler can add and maintain products without working with a complicated inventory system.

<p align="center">
  <img
    src="./screenshots/Wholesaler%20Add%20Product.jpeg"
    alt="VyapaarFlow add product page"
    width="900"
  />
</p>

<p align="center">
  <em>Wholesalers can add a product along with its pricing, taxation, and stock information.</em>
</p>

---

## Managing Existing Products

Product information is not permanent.

Prices may change, stock may be replenished, GST details may need correction, or a product may no longer be available. VyapaarFlow therefore allows wholesalers to manage their existing catalogue instead of treating product creation as a one-time action.

From the product-management section, a wholesaler can:

- View all listed products
- Edit product details
- Update prices
- Change available stock
- Correct GST information
- Keep the catalogue aligned with the actual business

<p align="center">
  <img
    src="./screenshots/Wholesaler%20Manage%20Products.jpeg"
    alt="VyapaarFlow manage products page"
    width="900"
  />
</p>

<p align="center">
  <em>The product-management page gives wholesalers control over their current catalogue.</em>
</p>

---

## Keeping Track of Inventory

Inventory is directly connected to the ordering workflow.

The wholesaler can see how much stock is currently available and identify products that may need to be replenished.

This helps avoid common problems such as:

- Accepting orders for unavailable products
- Forgetting to update stock after a sale
- Showing incorrect quantities to retailers
- Losing track of products that are running low
- Managing inventory separately from actual orders

The inventory view allows the wholesaler to understand not only what products exist, but also how much of each product can currently be sold.

<p align="center">
  <img
    src="./screenshots/Wholesaler%20Inventory.jpeg"
    alt="VyapaarFlow wholesaler inventory page"
    width="900"
  />
</p>

<p align="center">
  <em>Inventory information helps wholesalers monitor available stock and products requiring attention.</em>
</p>

---

## Receiving and Processing Retailer Orders

When a retailer places an order, it becomes available to the relevant wholesaler.

The wholesaler can review:

- Which retailer placed the order
- Which products were requested
- The quantity of each product
- The total order value
- Payment information
- The current order status

The order can then move through a clear lifecycle:

```text
Pending → Shipped → Delivered
```

An order can also be rejected when it cannot be fulfilled.

### Pending

The retailer has placed the order and it is waiting for the wholesaler to review it.

### Shipped

The wholesaler has accepted and dispatched the order.

### Delivered

The products have reached the retailer and the order has been completed.

### Rejected

The wholesaler is unable to fulfil the order.

This gives the retailer visibility into what is happening without repeatedly calling the wholesaler for updates.

---

## Recording Orders Received Outside VyapaarFlow

Not every order will begin through the retailer portal.

Wholesalers may continue to receive orders through:

- Phone calls
- In-person conversations
- Messaging applications
- Existing business relationships

VyapaarFlow allows these sales to be recorded manually.

This ensures that the platform represents the wholesaler's complete business activity rather than only the orders placed online.

An offline order can include information such as:

- Retailer details
- Products purchased
- Quantities
- Order value
- Payment method
- Payment status

Once entered, the offline order becomes part of the same order and inventory workflow as other sales.

---

# The Retailer Experience

## A Clear Starting Point for Purchasing

Retailers have a separate landing page focused on their purchasing activity.

From here, they can move between product discovery and order tracking without seeing wholesaler-specific management controls.

The retailer experience is designed around two main questions:

1. What products can I purchase?
2. What is happening with the orders I have already placed?

<p align="center">
  <img
    src="./screenshots/Retailer%20Landing%20Page.jpeg"
    alt="VyapaarFlow retailer landing page"
    width="900"
  />
</p>

<p align="center">
  <em>The retailer landing page provides quick access to product discovery and order tracking.</em>
</p>

---

## Browsing Products From Wholesalers

Instead of contacting wholesalers individually to ask about products, retailers can browse the available catalogue directly.

Each product listing provides the information required to make a purchasing decision, including:

- Product name
- Wholesaler
- Price
- Available quantity
- Applicable GST

Retailers can:

- Browse products from different wholesalers
- Search using a product name
- Search using a wholesaler's name
- Sort products according to price
- Select the required quantity
- Add products to their cart

The requested quantity is checked against the available stock so that the retailer cannot knowingly order more units than the wholesaler currently has.

<p align="center">
  <img
    src="./screenshots/Retailer%20Browse%20Products.jpeg"
    alt="VyapaarFlow retailer product catalogue"
    width="900"
  />
</p>

<p align="center">
  <em>Retailers can search, compare, and select products from the available catalogue.</em>
</p>

---

## Ordering From Multiple Wholesalers

A retailer may need products supplied by different wholesalers.

VyapaarFlow allows all of these products to be added to the same cart. At checkout, the platform separates the products according to the wholesaler responsible for fulfilling them.

For example, a retailer may add:

- Cooking oil from Wholesaler A
- Rice from Wholesaler A
- Packaged beverages from Wholesaler B

The retailer sees one combined cart, but VyapaarFlow creates:

- One order containing the products from Wholesaler A
- Another order containing the products from Wholesaler B

This is important because every wholesaler should only receive and manage the items that belong to their own catalogue.

The retailer does not need to manually place separate orders for each wholesaler.

---

## Reviewing the Cart and Placing an Order

Before confirming an order, the retailer can review:

- Selected products
- Requested quantities
- Individual prices
- Wholesalers supplying the products
- Applicable GST
- Total amount

Once the order is confirmed, it becomes visible to both the retailer and the relevant wholesaler.

This creates a shared digital order record instead of depending on a phone call or informal message that could later be misunderstood.

---

## Tracking Orders

After placing an order, the retailer can follow its progress from the order section.

The retailer can view:

- The wholesaler fulfilling the order
- Products included in the order
- Ordered quantities
- Total amount
- Order status
- Payment status

Orders from different wholesalers can be tracked independently.

One wholesaler may have already shipped an order while another wholesaler's order remains pending. Keeping these orders separate gives the retailer a more accurate view of every purchase.

<p align="center">
  <img
    src="./screenshots/Retailer%20Orders.jpeg"
    alt="VyapaarFlow retailer orders page"
    width="900"
  />
</p>

<p align="center">
  <em>Retailers can view their previous orders and follow the status of each purchase.</em>
</p>

---

# Payment Tracking

Payment is treated as part of the order workflow rather than as a completely separate record.

Wholesalers can use the platform to identify:

- Orders for which payment has been received
- Orders for which payment is still pending
- Completed sales requiring financial follow-up
- Retailers associated with outstanding payments

Retailers can also view the payment information connected to their orders.

This makes it easier for both sides to understand whether an order has only been delivered or whether the entire transaction, including payment, has been completed.

> VyapaarFlow currently records payment methods and payment status. It does not process real financial transactions through an online payment gateway.

---

# Dispute Resolution

Business transactions do not always go as expected.

An issue may arise because of:

- Incorrect products
- Incorrect quantities
- Damaged goods
- Delivery problems
- Payment disagreements
- Order-status confusion
- Other transaction-related concerns

VyapaarFlow provides a structured process through which wholesalers and retailers can report these problems.

A user can raise:

- A general support request
- A dispute connected to a particular order

Connecting a dispute to an order gives the administrator the context needed to investigate the complaint properly.

---

## The Administrator's Role

Administrators have a dedicated dispute-management interface.

For each ticket, the administrator can inspect:

- Who raised the complaint
- The order connected to the dispute
- The wholesaler involved
- The retailer involved
- The products and quantities ordered
- The current order status
- Previous dispute information
- Investigation notes

A dispute can move through stages such as:

```text
Open → Investigating → Resolved
```

Depending on the outcome, a ticket may also be rejected or closed.

The administrator can add internal notes during the investigation and record a final resolution. This creates a traceable history of how each complaint was handled.

---

# How the Complete Workflow Connects

The central idea behind VyapaarFlow is that its features should not work in isolation.

A product is connected to its available inventory.

Inventory is affected by orders.

Orders connect retailers with wholesalers.

Payment status belongs to an order.

Disputes are connected to the transaction that caused them.

```text
Wholesaler Adds Product
          ↓
Retailer Discovers Product
          ↓
Retailer Selects Quantity
          ↓
Retailer Places Order
          ↓
Wholesaler Reviews Order
          ↓
Order Is Shipped and Delivered
          ↓
Payment Status Is Recorded
          ↓
Either Party Can Raise a Dispute
          ↓
Administrator Investigates and Resolves It
```

This connected workflow is what makes VyapaarFlow more than a simple product-listing website.

---

# A Typical VyapaarFlow Scenario

Suppose a retailer wants to purchase ten units of cooking oil and twenty units of packaged juice.

The cooking oil is supplied by one wholesaler, while the packaged juice is supplied by another.

Using VyapaarFlow:

1. The retailer signs in and opens the product catalogue.
2. The retailer searches for both products.
3. The required quantities are selected.
4. The platform checks the available stock.
5. Both products are added to the same cart.
6. At checkout, VyapaarFlow creates two separate orders.
7. Each wholesaler receives only the order assigned to them.
8. The first wholesaler may mark the cooking-oil order as shipped.
9. The second wholesaler may keep the juice order pending.
10. The retailer can follow both orders independently.
11. The orders are marked delivered after completion.
12. Their payment status is recorded.
13. If the delivered quantity is incorrect, the retailer can raise a dispute linked to the relevant order.
14. An administrator can review the order and record a resolution.

This represents the complete business journey that VyapaarFlow is designed to support.

---

# Features at a Glance

## For Wholesalers

- Role-based wholesaler account
- Business overview dashboard
- Product creation
- Product editing
- Price and GST management
- Inventory management
- Low-stock visibility
- Incoming retailer orders
- Order-status updates
- Manual offline-order recording
- Payment-status tracking
- Order-related dispute creation

## For Retailers

- Role-based retailer account
- Retailer activity dashboard
- Multi-wholesaler product catalogue
- Product and wholesaler search
- Price-based sorting
- Quantity selection
- Stock validation
- Shopping cart
- Multi-wholesaler checkout
- Individual order tracking
- Payment-status visibility
- Support and dispute creation

## For Administrators

- Central dispute queue
- Order-linked complaint investigation
- Wholesaler and retailer context
- Investigation notes
- Ticket-status management
- Resolution records
- Ticket rejection and closure

---

# Current Project Scope

VyapaarFlow is currently a functional full-stack prototype focused on demonstrating the complete wholesale–retail business workflow.

The current version includes:

- Role-based registration and login
- Separate wholesaler and retailer experiences
- Product and catalogue management
- Inventory management
- Product search and sorting
- Quantity and stock validation
- Shopping-cart management
- Multi-wholesaler order separation
- Retailer order placement
- Manual offline-order recording
- Order-status management
- Payment-status tracking
- Dispute-ticket creation
- Administrator-led dispute investigation
- Investigation notes and final resolutions

---

# Technology Used

The project is built using:

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
- **PostgreSQL**

The main focus of the project is the business workflow and the experience of the different users rather than an unnecessarily complex technical architecture.

---

# Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/gunitakhurana/Vyapaar-Flow.git
cd Vyapaar-Flow
```

## 2. Install the dependencies

```bash
npm install
```

## 3. Add the environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Do not commit the `.env.local` file or expose the service-role key publicly.

## 4. Start the development server

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3001
```

---

# Authentication Note

The current version uses a demonstration OTP flow.

The OTP is displayed inside the application so that the complete registration, login, and role-based experience can be tested without connecting an external SMS provider.

In a production version, this can be replaced with a secure authentication provider such as:

- Supabase Phone Authentication
- Twilio Verify
- MSG91
- Firebase Authentication
- Another trusted OTP service

A production implementation should also include OTP expiry, rate limiting, attempt restrictions, and abuse prevention.

---

# Future Improvements

VyapaarFlow can be extended with:

- Real SMS-based OTP authentication
- Product images and categories
- GST-compliant invoice generation
- Online payment integration
- Payment reminders
- Delivery notifications
- Sales and revenue analytics
- Retailer ledgers
- Complete inventory history
- Automated low-stock alerts
- Business reports
- Multiple staff accounts for one business
- Stronger role and permission controls
- Mobile application support
- Automated testing
- Production-ready database migrations

---

# What I Learned

Building VyapaarFlow required me to think beyond creating separate pages.

The main challenge was understanding how different users interact with the same business transaction.

For example:

- A wholesaler creates a product.
- A retailer discovers and orders that product.
- The order must reach the correct wholesaler.
- The wholesaler changes its status.
- The retailer must see that updated status.
- The order must remain connected to inventory and payment information.
- Either party may later raise a dispute.
- An administrator needs enough context to investigate it.

Because of these relationships, every feature affects another part of the platform.

Through this project, I developed a better understanding of:

- Role-based product design
- Multi-user workflows
- Inventory and order relationships
- Cart and checkout logic
- Multi-wholesaler order separation
- Business-focused dashboard design
- Authentication and user profiles
- Database-backed application development
- Support and dispute workflows
- Designing for both online and offline business activity

---

# Author

**Gunita Khurana**

GitHub: [@gunitakhurana](https://github.com/gunitakhurana)

---

<div align="center">

### VyapaarFlow

Making wholesale–retail business operations more connected, visible, and manageable.

</div>
