import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { deleteAccountWorkspaces } from './accountDeletion';

// Run only in a disposable database initialized from this checkout's schema.
test('real PostgreSQL cascade, username release, rollback and concurrent owners', { skip: !process.env.ACCOUNT_DELETION_TEST_URL }, async () => {
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.ACCOUNT_DELETION_TEST_URL }) });
  const prefix = `delete-${crypto.randomUUID()}`;
  const user = async (name: string) => client.user.create({ data: { id: `${prefix}-${name}`, email: `${prefix}-${name}@example.test` } });
  try {
    const a = await user('a'), b = await user('b'), editor = await user('editor');
    const personal = await client.workspace.create({data:{username:`${prefix}-personal`,aliases:{create:{username:`${prefix}-alias`}},members:{create:{userId:a.id,role:'OWNER'}},links:{create:{platform:'Website',label:'Site',url:'https://example.test',position:0}}}});
    const shared = await client.workspace.create({data:{members:{create:[{userId:a.id,role:'OWNER'},{userId:editor.id,role:'EDITOR'}]}}});
    const identities = await deleteAccountWorkspaces(client,a.id);
    assert.equal(await client.workspace.findUnique({where:{id:personal.id}}),null);
    assert.equal(await client.link.count({where:{workspaceId:personal.id}}),0);
    assert.equal(await client.workspaceAlias.count({where:{workspaceId:personal.id}}),0);
    assert.equal((await client.workspaceMember.findFirst({where:{workspaceId:shared.id,userId:editor.id}}))?.role,'OWNER');
    assert.ok(identities.some(i=>i.usernames.includes(`${prefix}-alias`)));
    await client.workspace.create({data:{username:`${prefix}-personal`}}); // unique username was released
    const rollback = await user('rollback');
    const rollbackWorkspace=await client.workspace.create({data:{members:{create:{userId:rollback.id,role:'OWNER'}}}});
    await client.$executeRawUnsafe(`CREATE FUNCTION test_fail_user_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.id LIKE '%-rollback' THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN OLD; END $$`);
    await client.$executeRawUnsafe('CREATE TRIGGER test_fail_user_delete BEFORE DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION test_fail_user_delete()');
    await assert.rejects(deleteAccountWorkspaces(client,rollback.id));
    assert.ok(await client.workspace.findUnique({where:{id:rollbackWorkspace.id}}));
    assert.equal(await client.invalidatedSession.findUnique({where:{userId:rollback.id}}),null);
    await client.$executeRawUnsafe('DROP TRIGGER test_fail_user_delete ON "User"');
    await client.$executeRawUnsafe('DROP FUNCTION test_fail_user_delete()');
    const other = await user('other');
    const racing = await client.workspace.create({data:{members:{create:[{userId:b.id,role:'OWNER'},{userId:other.id,role:'OWNER'}]}}});
    await Promise.all([deleteAccountWorkspaces(client,b.id),deleteAccountWorkspaces(client,other.id)]);
    assert.equal(await client.workspace.findUnique({where:{id:racing.id}}),null);
  } finally { await client.$disconnect(); }
});
