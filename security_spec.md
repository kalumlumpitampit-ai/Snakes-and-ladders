# Security Specification: Snakes & Ladders (Tree of Knowledge)

## 1. Data Invariants
- **Games**: Must have a valid hostId matching the creator. Only 12 players max.
- **Admins**: Only specific emails or users in the `admins` collection can have admin privileges.
- **Broadcasts**: Only Super Admins can create/system can generate. Admins can read.
- **Admin Requests**: Users can only create their own requests.
- **Room Requests**: Publicly reachable for registration, but ideally tied to a user session.

## 2. The "Dirty Dozen" Payloads
1. **Ghost Admin**: Try to create an admin doc for yourself without the secret. -> DENIED
2. **Game Hijack**: Update someone else's game hostId. -> DENIED
3. **Empty Game**: Create a game without required fields (hostId, players, etc). -> DENIED
4. **Infinite Players**: Set players list to size 100. -> DENIED
5. **Sneaky Broadcast**: Regular user trying to read broadcasts. -> DENIED
6. **Self-Promotion**: Non-super-admin trying to approve their own admin request. -> DENIED
7. **Room Request Spoof**: Creating a room request for another UID. -> DENIED
8. **Game History Wipe**: Regular user deleting game history. -> DENIED
9. **Admin List Scraping**: Non-admin trying to list all admins. -> DENIED
10. **Broadcast Creation**: Non-super-admin trying to send a broadcast. -> DENIED
11. **Impersonation Update**: Updating an admin record you don't own. -> DENIED
12. **Status Skipping**: Manually setting a game to 'finished' without owner auth. -> DENIED

## 3. Implementation Plan
- Robust `isAdmin()` helper that includes email verification.
- Explicit schema validation helpers for all entities.
- Action-based update patterns for Games.
- Secure List queries for all sensitive collections.
