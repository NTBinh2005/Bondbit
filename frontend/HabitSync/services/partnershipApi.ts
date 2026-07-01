import api from './api'

export const partnershipApi = {
    invite: (receiverId: number, habitId: number) =>
        api.post('/api/partnerships/invite', { receiverId, habitId}),

    accept: (id: number) =>
        api.put(`/api/partnerships/${id}/accept`),

    reject: (id: number) =>
        api.put(`/api/partnerships/${id}/reject`),

    getMine: () =>
        api.get('/api/partnerships/mine'),

    searchUsers: (keyword: string) =>
        api.get('api/users/search', {
            params: {keyword}
        }),
}