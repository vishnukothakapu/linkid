import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Prisma, type PrismaClient } from '@prisma/client';
import { deleteAccountWorkspaces } from './accountDeletion';
const member=(id:string,userId:string,role:'OWNER'|'EDITOR')=>({id,userId,role,createdAt:new Date(0)});
function fixture(workspaces: {id:string;username:string;aliases:{username:string}[];members:ReturnType<typeof member>[]}[], failures=0) {
 const calls:string[]=[];
 const tx={
  $queryRaw:async()=>{calls.push('lock');},
  workspaceMember:{findMany:async()=>workspaces.map(w=>({workspaceId:w.id})),update:async({where}:{where:{id:string}})=>{calls.push(`promote:${where.id}`);}},
  workspace:{findMany:async()=>workspaces,delete:async({where}:{where:{id:string}})=>{calls.push(`workspace:${where.id}`);}},
  invalidatedSession:{upsert:async()=>{calls.push('sessions');}},deleteOtp:{deleteMany:async()=>{calls.push('otp');}},user:{delete:async()=>{calls.push('user');}},
 };
 const client={$transaction:async(fn:(tx:unknown)=>unknown,options:unknown)=>{
  assert.deepEqual(options,{isolationLevel:'Serializable'});
  if(failures-->0)throw new Prisma.PrismaClientKnownRequestError('retry',{code:'P2034',clientVersion:'7'});
  return fn(tx);
 }} as unknown as PrismaClient;
 return {calls,client};
}
test('sole-member workspace is deleted and aliases captured before cascade',async()=>{
 const {client,calls}=fixture([{id:'personal',username:'name',aliases:[{username:'old'}],members:[member('m','owner','OWNER')]}]);
 assert.deepEqual(await deleteAccountWorkspaces(client,'owner'),[{id:'personal',usernames:['name','old']}]);
 assert.deepEqual(calls,['lock','lock','workspace:personal','sessions','otp','user']);
});
test('shared sole-owner workspace promotes earliest remaining member',async()=>{
 const {client,calls}=fixture([{id:'shared',username:'team',aliases:[],members:[member('a','owner','OWNER'),member('b','editor','EDITOR'),member('c','other','EDITOR')]}]);
 await deleteAccountWorkspaces(client,'owner'); assert.ok(calls.includes('promote:b')); assert.ok(!calls.includes('workspace:shared'));
});
test('leaving an editor or another owner preserves the existing owner',async()=>{
 for(const role of ['EDITOR','OWNER'] as const){const {client,calls}=fixture([{id:'shared',username:'team',aliases:[],members:[member('a','owner',role),member('b','other','OWNER')]}]);
 await deleteAccountWorkspaces(client,'owner');assert.ok(!calls.some(c=>c.startsWith('promote:')||c.startsWith('workspace:')));}
});
test('serialization conflicts retry at most three times',async()=>{
 const success=fixture([],2);await deleteAccountWorkspaces(success.client,'owner');assert.ok(success.calls.includes('user'));
 const exhausted=fixture([],3);await assert.rejects(deleteAccountWorkspaces(exhausted.client,'owner'));assert.deepEqual(exhausted.calls,[]);
});
