import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyDriveFileToProductionStorage } from '../src/lib/ingestion/driveStorageAdapter';
test('no false storage success', async () => {
  await assert.rejects(copyDriveFileToProductionStorage('example', undefined, 'lesson', 'pdf', 'paid'), /Content registry ID is required/);
});
