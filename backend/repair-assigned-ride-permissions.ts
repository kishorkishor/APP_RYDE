import { Permission, Query, Role } from 'node-appwrite';
import { databases, databaseId, COLLECTIONS } from './appwrite';

const mergePermissions = (existing: string[] = [], additions: string[]) => {
  const merged = new Set(existing);
  for (const permission of additions) merged.add(permission);
  return Array.from(merged);
};

async function main() {
  let offset = 0;
  let repaired = 0;
  let inspected = 0;
  const limit = 100;

  while (true) {
    const page = await databases.listDocuments(databaseId, COLLECTIONS.RIDES, [
      Query.isNotNull('driverId'),
      Query.limit(limit),
      Query.offset(offset),
    ]);

    for (const ride of page.documents) {
      inspected += 1;
      const driverId = typeof ride.driverId === 'string' ? ride.driverId.trim() : '';
      if (!driverId) continue;

      const required = [
        Permission.read(Role.user(driverId)),
        Permission.update(Role.user(driverId)),
      ];
      const permissions = mergePermissions(ride.$permissions || [], required);

      if (permissions.length === (ride.$permissions || []).length) continue;

      await databases.updateDocument(
        databaseId,
        COLLECTIONS.RIDES,
        ride.$id,
        {},
        permissions
      );
      repaired += 1;
      console.log(`Repaired ride ${ride.$id} for driver ${driverId}`);
    }

    if (page.documents.length < limit) break;
    offset += limit;
  }

  console.log(`Done. Inspected ${inspected} assigned rides, repaired ${repaired}.`);
}

main().catch((error) => {
  console.error('Failed to repair assigned ride permissions:', error);
  process.exit(1);
});
