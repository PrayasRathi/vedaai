const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getAssignments() {
  try {
    const res = await fetch(`${API_URL}/assignments`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getAssignment(id: string) {
  try {
    const res = await fetch(`${API_URL}/assignments/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function createAssignment(data: FormData) {
  const res = await fetch(`${API_URL}/assignments`, { method: 'POST', body: data });
  if (!res.ok) throw new Error('Failed to create assignment');
  return res.json();
}

export async function regenerateAssignment(id: string) {
  const res = await fetch(`${API_URL}/assignments/${id}/regenerate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to regenerate');
  return res.json();
}

export async function deleteAssignment(id: string) {
  const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}