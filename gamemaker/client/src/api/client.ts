const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Classes
  getClasses: () =>
    request<any>('/classes/public'),

  // Students
  getStudentsByClass: (classId: number) =>
    request<any>(`/students/class/${classId}`),

  getStudent: (id: number) =>
    request<any>(`/students/${id}`),

  updateAvatar: (id: number, avatar_config: object) =>
    request<any>(`/students/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar_config }),
    }),

  // Regions
  getRegions: () =>
    request<any>('/regions'),

  getRegionDetail: (id: number) =>
    request<any>(`/regions/${id}`),

  // Progress
  getProgress: (studentId: number) =>
    request<any>(`/progress/student/${studentId}`),

  getRegionProgress: (studentId: number, regionId: number) =>
    request<any>(`/progress/student/${studentId}/region/${regionId}`),

  // Quiz
  submitQuiz: (student_id: number, question_id: number, answer: string) =>
    request<any>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ student_id, question_id, answer }),
    }),

  // Shop
  getShopItems: () =>
    request<any>('/shop/items'),

  buyItem: (student_id: number, item_id: number) =>
    request<any>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ student_id, item_id }),
    }),

  equipItem: (student_id: number, item_id: number, is_equipped: boolean) =>
    request<any>('/shop/equip', {
      method: 'PATCH',
      body: JSON.stringify({ student_id, item_id, is_equipped }),
    }),

  getInventory: (studentId: number) =>
    request<any>(`/shop/inventory/${studentId}`),
};
