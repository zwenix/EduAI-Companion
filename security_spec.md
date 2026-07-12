# Security Specification: Firestore Attribute-Based Access Control

This specification establishes the zero-trust data invariants, describes the twelve malicious payloads designed to test potential vulnerabilities ("The Dirty Dozen"), and defines the security requirements for the application collections.

---

## 🛡️ 1. Data Invariants

1. **User Profiling**: A user profile document (`/users/{userId}`) can only be created or modified by the authenticated user whose `uid` matches the document path ID. Self-assignment of the `role` is prohibited unless verified.
2. **Student Identity**: A student record (`/students/{studentId}`) belongs either to the teacher who created it (`teacherId`) or is linked to a learner's email.
3. **Private Messages**: A communicator message (`/communicator_messages/{messageId}`) must be created with `senderId` exactly matching the authenticated user's `uid`. Only the sender or recipient can list or read messages.
4. **AI Tutor Sessions**: AI tutor sessions (`/ai_tutor_sessions/{userId}`) and floating sessions (`/ai_floating_sessions/{userId}`) are strictly private to the authenticated user owning the `uid` path.

---

## 🚫 2. The "Dirty Dozen" Payloads (Malicious Actions)

Here are twelve payloads designed to bypass identity, integrity, and state limits, all of which must return `PERMISSION_DENIED`.

1. **Identity Spoofing - Users**: Update someone else's user profile.
   ```json
   { "path": "users/victim_id", "data": { "name": "Attacker" } }
   ```
2. **Role Escalation - Users**: Set own role to `admin` during registration.
   ```json
   { "path": "users/attacker_id", "data": { "name": "Attacker", "email": "att@example.com", "role": "admin", "createdAt": "SERVER_TIMESTAMP" } }
   ```
3. **Immutability Breach - Users**: Attempt to modify `createdAt` in an existing user profile.
   ```json
   { "path": "users/attacker_id", "data": { "createdAt": "NEW_TIMESTAMP" } }
   ```
4. **Identity Spoofing - Messages**: Write a message masquerading as another user.
   ```json
   { "path": "communicator_messages/msg_123", "data": { "senderId": "victim_id", "senderName": "Victim", "text": "Fraud", "createdAt": "SERVER_TIMESTAMP" } }
   ```
5. **PII Data Harvest - Messages**: Query the entire `communicator_messages` collection without filters.
   ```json
   { "op": "list", "path": "communicator_messages" }
   ```
6. **State Poisoning - Messages**: Inject unauthorized keys or massive strings into the message entity.
   ```json
   { "path": "communicator_messages/msg_123", "data": { "senderId": "attacker_id", "senderName": "Attacker", "text": "Hi", "createdAt": "SERVER_TIMESTAMP", "unauthorized_key": "junk" } }
   ```
7. **Cross-Tenant Snooping - AI Tutor**: Get another user's AI tutor history.
   ```json
   { "op": "get", "path": "ai_tutor_sessions/victim_id" }
   ```
8. **Malicious ID Injection**: Inject a path traversal or 1MB string as a document ID.
   ```json
   { "path": "users/../../etc/passwd", "data": {} }
   ```
9. **Unverified Auth Bypass**: Perform writes with an unverified email address (if verification is strictly required).
   ```json
   { "auth": { "uid": "attacker_id", "token": { "email_verified": false } } }
   ```
10. **State Shortcutting - Students**: Update the `teacherId` of a student belonging to another teacher.
    ```json
    { "path": "students/student_123", "data": { "teacherId": "attacker_id" } }
    ```
11. **Anonymity Privilege Escalation**: Write to system-generated files or lessons as an anonymous (unauthenticated) client.
    ```json
    { "path": "lessons/lesson_123", "data": { "title": "Maths", "userEmail": "victim@example.com" } }
    ```
12. **Immortal Field Corruption**: Try to change `userEmail` of a lesson after creation.
    ```json
    { "path": "lessons/lesson_123", "data": { "userEmail": "attacker@example.com" } }
    ```

---

## 🧪 3. Test Runner Definition (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Rules Security Audit', () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'caps-portal-test',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('rejects identity spoofing on other user profiles', async () => {
    const victimDb = testEnv.authenticatedContext('victim_id').firestore();
    const attackerDb = testEnv.authenticatedContext('attacker_id').firestore();
    
    await assertFails(attackerDb.doc('users/victim_id').set({ name: 'Hacker' }));
  });

  it('rejects role escalation to admin during profile creation', async () => {
    const db = testEnv.authenticatedContext('attacker_id').firestore();
    await assertFails(db.doc('users/attacker_id').set({
      name: 'Attacker',
      email: 'attacker@example.com',
      role: 'admin',
      createdAt: new Date()
    }));
  });

  it('blocks listing communicator_messages without owner constraints', async () => {
    const db = testEnv.authenticatedContext('attacker_id').firestore();
    await assertFails(db.collection('communicator_messages').get());
  });
});
```
