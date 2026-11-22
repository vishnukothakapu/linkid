import { teamRoute } from '@/lib/teamRoute';
import prisma from '@/lib/prisma';
import { changeMember, TeamError } from '@/lib/workspaceTeam';
import { invalidateProfileCache } from '@/lib/profileCache';
type Context={params:Promise<{id:string;memberId:string}>};
export async function PATCH(req:Request,context:Context) {
  const {id,memberId}=await context.params;
  return teamRoute(req,async userId=>{const {role}=await req.json();if(role!=='OWNER'&&role!=='EDITOR')throw new TeamError('Role must be OWNER or EDITOR');await changeMember(prisma,id,userId,memberId,role);await invalidateProfileCache(id);return {success:true};});
}
export async function DELETE(req:Request,context:Context) {
  const {id,memberId}=await context.params;
  return teamRoute(req,async userId=>{await changeMember(prisma,id,userId,memberId,null);await invalidateProfileCache(id);return {success:true};});
}
