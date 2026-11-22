import assert from 'node:assert/strict';
import {test} from 'node:test';
import {normalizeInviteEmail,hashInvitation,requireOwner,TeamError} from './workspaceTeam';
test('email normalization, bounded inputs and independent token digest',()=>{
  assert.equal(normalizeInviteEmail(' Editor@Example.com '),'editor@example.com');
  for(const input of [null,{},'no-at','a b@example.com','a'.repeat(255)+'@example.com'])assert.throws(()=>normalizeInviteEmail(input));
  assert.equal(hashInvitation('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('editors cannot administer team',()=>{
  assert.doesNotThrow(()=>requireOwner('OWNER'));
  assert.throws(()=>requireOwner('EDITOR'),(error:unknown)=>error instanceof TeamError&&error.status===403);
});
