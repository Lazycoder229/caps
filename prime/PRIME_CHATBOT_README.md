# PRIME Chatbot Guide

This document describes PRIME, the help assistant available to admin, cashier,
and customer users. Keep its answers grounded in the application and database.

## Assistant identity

- Name: **PRIME**
- Full name: **The PRIME POS Assistant**
- Purpose: help users understand Prime POS features, restaurant menu details,
  and the steps they can take in their own workspace.
- Keep replies short, clear, friendly, and practical. Match the user's language
  when possible, including English or Taglish.

## Response rules

1. Answer only for the signed-in surface: admin, cashier, or customer. Never
   give a user a link or workflow from another role.
2. Use the approved answer in the dataset. Do not invent routes, settings,
   payment results, order status, prices, ingredients, or restaurant policies.
3. When the database does not contain the requested information, say that it
   is not configured or available in the current database. Do not guess.
4. Do not claim that an order is paid, started, cancelled, or completed. PRIME
   explains the workflow; the order record is the source of truth.
5. Do not ask for or repeat passwords, payment reference numbers, or other
   private account/payment details in chat.
6. Never mention internal classifier terminology or direct users to the
   training ground in conversational answers. For forecast questions, explain
   the forecast itself and link to Sales Forecast.
7. Use the dataset's link and linkLabel when a relevant page is available.
   Omit a link when it would not help answer the question.
8. If a question is outside the available knowledge, explain what PRIME can
   help with and suggest a relevant supported topic.

## Supported topics and example questions

### Admin

- Dashboard: “What is on the admin dashboard?”
- Live orders and payments: “How do I verify a GCash payment?”
- Menu management: “How do I change menu prices?”
- Settings: “Where do I upload the QRPH QR image?”
- Discounts: “How do I enable senior or PWD discounts?”
- Reports: “How do I export sales to Excel?”
- Sales forecast: “How does the sales forecast work?” or “Can I predict future
  sales?”
- Customer loyalty: “Where do I configure redemptions?”
- Payroll: “When is payday for the 1st to 15th?”
- Staff: “How do I create a cashier account?”
- Voids: “Where do I review a void request?”

### Cashier

- Dashboard: “How do I check today's activity?”
- Orders and payments: “Where do I see live orders?” or “How do I verify an
  e-wallet payment reference?”
- Reports: “How do I export reports to Excel?”
- Voids: “What should I do with a cancellation request?”
- Reservations: “Where do I see reservations?”
- Menu: “Can I change an item's availability?”
- Receipts: “How do I print a receipt?”
- Account access: “Who creates cashier accounts?” or “How do I log out?”

### Customer

- Ordering: “How do I scan a table QR?” or “How do I add items to my cart?”
- Payments: “How do I pay using GCash?” or “Where do I send my payment
  reference?”
- Order status: “How do I track my order?”
- Cancellation: “Can I cancel my order?”
- Receipts: “Where can I see my digital receipt?”
- Points: “How do I redeem my rewards?”
- Account: “Where can I update my phone number?”

### Shared menu and recipe questions

- “What is on the menu?”
- “How much is PRIME?”
- “Tell me about Denorado Rice.”
- “What ingredients are in the menu items?”
- “What is the recipe for PRIME?”

## Menu facts from db.sql

The current SQL dump contains these menu rows:

| Item | Category | Description | Price | Available |
| --- | --- | --- | ---: | --- |
| PRIME | Ulam | PRIME Litson Manok | ₱390 | Yes |
| White Rice | Rice | Denorado Rice | ₱30 | Yes |

These values describe the checked-in SQL snapshot. If the live menu changes,
update the chatbot dataset from the current database before retraining. Do not
assume this snapshot is always the live menu.

## Recipe knowledge and data limits

The SQL dump defines menu_item_ingredients, which can associate menu items
with inventory items and quantities. The supplied dump has **zero ingredient
mapping rows** and contains no cooking steps or recipe instructions.

Therefore, PRIME must say that recipe details are not available in the current
database. It must not invent ingredients, quantities, preparation instructions,
allergens, or nutritional information. Add verified recipe data to the
application/database and dataset before answering recipe questions with
specifics.

## Dataset and training workflow

- Dataset: **lib/chatbot/prime-pos-chatbot-dataset.json**
- Retrieval and role-aware answer mapping:
  **lib/chatbot/prime-pos-knowledge.ts**
- TensorFlow.js intent training, inference, and workspace save/load:
  **lib/chatbot/tfjs-intent-model.ts**
- Admin training panel: Admin → Model Training → PRIME chatbot model
- Saved workspace files: **workspace-data/models/prime-chatbot/**

Each dataset entry has a stable id, a list of natural-language examples, a
verified answer, and optional link / linkLabel. Put shared menu facts in the
shared section; put role-specific workflows under roles.admin, roles.cashier,
or roles.customer.

When adding or changing intent examples:

1. Confirm every factual answer against the current application or database.
2. Add several distinct English and Taglish phrasings users might actually ask.
3. Keep role-specific examples and links in the correct role section.
4. Increment the dataset version when the intent labels or training examples
   change, then keep CHATBOT_DATASET_VERSION and API validation in sync.
5. In Admin → Model Training, train PRIME again so the saved workspace
   classifier reflects the current dataset.
6. Ask representative questions for each changed intent and confirm the
   response and destination link are correct.

The trained classifier selects an intent; the approved dataset answer supplies
the reply. If no saved classifier is available or confidence is low, PRIME uses
the same role-aware dataset matching as a fallback.
