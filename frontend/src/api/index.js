import { authApi } from './auth';
import { usersApi } from './users';
import { roomsApi } from './rooms';
import { todosApi } from './todos';
import { recordsApi } from './records';
import { studyApi } from './study';
import { activityApi } from './activity';
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
    activityApi,
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
    activity: activityApi,
    friends: friendsApi,
    messages: messagesApi,
    sessions: sessionsApi,
    client,
};
