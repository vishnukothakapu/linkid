"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCsrfToken } from "@/lib/csrfClient";
type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "EDITOR";
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
};
type Team = {
  role: string;
  userId: string;
  members: Member[];
  invitations: { id: string; email: string; expiresAt: string }[];
};
export default function TeamPanel({
  workspaces,
  workspaceId,
}: {
  workspaces: { id: string; name: string }[];
  workspaceId: string;
}) {
  const router = useRouter(),
    [team, setTeam] = useState<Team | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) setTeam(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [workspaceId, refresh]);
  async function action(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": await getCsrfToken(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage("Team updated.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return false;
    } finally {
      setBusy(false);
      setRefresh((v) => v + 1);
    }
  }
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <Link href="/dashboard">← Dashboard</Link>
      <h1 className="text-3xl font-bold">Workspace team</h1>
      <label className="block">
        Workspace
        <select
          className="block border rounded p-2"
          value={workspaceId}
          onChange={(e) =>
            router.push(
              `/dashboard/team?workspaceId=${encodeURIComponent(e.target.value)}`,
            )
          }
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={busy}
        className="border rounded p-2"
        onClick={async () => {
          if (await action("/api/workspaces/active", "POST", { workspaceId })) {
            router.push("/dashboard");
            router.refresh();
          }
        }}
      >
        Open this workspace
      </button>
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRefresh((v) => v + 1)}>Retry</button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!team && <p role="status">Loading members…</p>}
      {team && (
        <>
          <h2 className="text-xl font-semibold">Members</h2>
          <ul className="space-y-4">
            {team.members.map((m) => (
              <li key={m.id} className="border rounded p-4">
                <p>
                  {m.user.name ?? m.user.email} · {m.user.email}
                </p>
                <p>
                  {m.role} · Joined {new Date(m.createdAt).toLocaleDateString()}
                </p>
                {team.role === "OWNER" ? (
                  <div className="flex gap-3">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          `/api/workspaces/${workspaceId}/members/${m.id}`,
                          "PATCH",
                          { role: m.role === "OWNER" ? "EDITOR" : "OWNER" },
                        )
                      }
                    >
                      Make {m.role === "OWNER" ? "editor" : "owner"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          `/api/workspaces/${workspaceId}/members/${m.id}`,
                          "DELETE",
                        )
                      }
                    >
                      Remove member
                    </button>
                  </div>
                ) : (
                  m.userId === team.userId && (
                    <button
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await action(
                            `/api/workspaces/${workspaceId}/members/${m.id}`,
                            "DELETE",
                          )
                        ) {
                          router.push("/dashboard");
                          router.refresh();
                        }
                      }}
                    >
                      Leave workspace
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
          {team.role === "OWNER" && (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await action(
                      `/api/workspaces/${workspaceId}/invitations`,
                      "POST",
                      { email },
                    )
                  )
                    setEmail("");
                }}
                className="space-y-3 border rounded p-4"
              >
                <h2 className="text-xl font-semibold">Invite an editor</h2>
                <p>
                  Editors manage links and profile content. Owners manage
                  membership, usernames and webhook secrets.
                </p>
                <label className="block">
                  Email
                  <input
                    className="block border rounded p-2"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button className="border rounded p-2" disabled={busy}>
                  Send seven-day invitation
                </button>
              </form>
              <h2 className="text-xl font-semibold">Pending invitations</h2>
              <ul>
                {team.invitations.map((i) => (
                  <li key={i.id} className="border rounded p-4">
                    {i.email} · Expires {new Date(i.expiresAt).toLocaleString()}{" "}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          `/api/workspaces/${workspaceId}/invitations`,
                          "POST",
                          { email: i.email },
                        )
                      }
                    >
                      Resend
                    </button>{" "}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          `/api/workspaces/${workspaceId}/invitations/${i.id}`,
                          "DELETE",
                        )
                      }
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
