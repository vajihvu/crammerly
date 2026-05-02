import { authApi } from './auth';
import { usersApi } from './users';
import { roomsApi } from './rooms';
import { todosApi } from './todos';
import { recordsApi } from './records';
import { studyApi } from './study';
import { friendsApi } from './friends';
import { notificationsApi } from './notifications';
import { messagesApi } from './messages';
import { sessionsApi } from './sessions';
import { bugsApi } from './bugs';
import aiApi from './ai';
import { adminApi } from './admin';
import { statsApi } from './stats';
import { tasksApi } from './tasks';
import { resourcesApi } from './resources';
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
    notificationsApi,
    messagesApi,
    sessionsApi,
    bugsApi,
    aiApi,
    adminApi,
    statsApi,
    tasksApi,
    resourcesApi,
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
    notifications: notificationsApi,
    messages: messagesApi,
    sessions: sessionsApi,
    bugs: bugsApi,
    ai: aiApi,
    admin: adminApi,
    stats: statsApi,
    tasks: tasksApi,
    resources: resourcesApi,
    client,
};

