import assert from 'node:assert/strict';
import {mock,test,before} from 'node:test';
const memberships=[{workspaceId:'personal',role:'OWNER',workspace:{id:'personal'}},{workspaceId:'delegated',role:'EDITOR',workspace:{id:'delegated'}}];
mock.module('server-only',{defaultExport:{}});
mock.module('@/lib/prisma',{defaultExport:{workspaceMember:{findMany:async()=>memberships}}});
let resolveActiveWorkspace: typeof import('./workspace').resolveActiveWorkspace;
before(async()=>{resolveActiveWorkspace=(await import('./workspace')).resolveActiveWorkspace;});
test('explicit delegated workspace is respected and foreign IDs never fall back',async()=>{
  assert.equal((await resolveActiveWorkspace('user','delegated'))?.id,'delegated');
  assert.equal(await resolveActiveWorkspace('user','foreign'),null);
  assert.equal((await resolveActiveWorkspace('user'))?.id,'personal');
});
