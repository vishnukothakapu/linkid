'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCsrfToken } from '@/lib/csrfClient';
export default function AcceptWorkspaceInvitation() {
  const [token,setToken]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),router=useRouter();
  useEffect(()=>{const value=location.hash.slice(1);const timer=setTimeout(()=>setToken(value),0);return()=>clearTimeout(timer);},[]);
  return <main className="mx-auto max-w-xl p-8 space-y-4"><h1 className="text-3xl font-bold">Join a workspace</h1><p>Sign in using the verified email address that received this invitation, then return to this link.</p><Link href="/login">Sign in</Link><form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{const response=await fetch('/api/workspaces/invitations/accept',{method:'POST',headers:{'Content-Type':'application/json','x-csrf-token':await getCsrfToken()},body:JSON.stringify({token})});const data=await response.json();if(!response.ok)throw new Error(data.error);history.replaceState(null,'',location.pathname);router.push(`/dashboard/team?workspaceId=${encodeURIComponent(data.workspaceId)}`);}catch(error){setMessage(error instanceof Error?error.message:'Invitation could not be accepted');}finally{setBusy(false);}}}><label className="block">Invitation token<input className="block border rounded p-2 w-full" required autoComplete="off" value={token} onChange={e=>setToken(e.target.value)}/></label><button disabled={busy} className="border rounded p-2 mt-4">Accept invitation</button></form>{message&&<p role="alert">{message}</p>}</main>;
}
