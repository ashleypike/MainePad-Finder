# Transaction Management and ACID Compliance (Yunlong)

## Example: Add Property Transaction

Endpoint: `POST /api/properties/add` (requires login)

### Description

Adds a new rental property for the currently logged-in landlord.  
The operation inserts data into both `ADDRESS` and `PROPERTY` tables **in a single database transaction**.

### Transaction Behavior

1. The backend starts a transaction using `db.start_transaction()`.
2. Insert a row into `ADDRESS` with street, city, state, and ZIP code.
3. Insert a row into `PROPERTY` that references the new `ADDRESS_ID` and the
   current landlord's `USER_ID`.
4. If any of these steps fail (e.g., constraint violation, invalid data),
   the backend runs `db.rollback()` so **neither the address nor the property
   is stored**.
5. If all steps succeed, the backend runs `db.commit()` and returns the new
   `propertyId` and `addressId`.

Because ADDRESS and PROPERTY are both stored in InnoDB with foreign keys, this
operation satisfies:

- **Atomicity** – both ADDRESS and PROPERTY inserts succeed or both are undone.
- **Consistency** – no PROPERTY row exists without a valid ADDRESS and LANDLORD.
- **Isolation** – concurrent Add Property operations from different users do
  not see each other's uncommitted changes.
- **Durability** – once committed, the new property remains even if the server
  restarts.