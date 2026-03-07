import { authApi } from './auth';
import { usersApi } from './users';
import { roomsApi } from './rooms';
import { todosApi } from './todos';
import { recordsApi } from './records';
import { studyApi } from './study';
import { friendsApi } from './friends';
import { messagesApi } from './messages';
import { sessionsApi } from './sessions';
import client from './client';

export {
    client as apiClient,
    authApi,
    usersApi,
    roomsApi,
    todosApi,
    recordsApi,
    studyApi,
    friendsApi,
    messagesApi,
    sessionsApi,
};

// Default export as a unified object if preferred
export default {
    auth: authApi,
    users: usersApi,
    rooms: roomsApi,
    todos: todosApi,
    records: recordsApi,
    study: studyApi,
    friends: friendsApi,
    messages: messagesApi,
    sessions: sessionsApi,
    client,
};

