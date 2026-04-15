import Todo from '../models/Todo.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all user todos
 * @route   GET /api/v1/todos
 * @access  Private
 */
export const getTodos = asyncHandler(async (req, res) => {
    const todos = await Todo.find({ user_id: req.user._id });
    return res.sendSuccess(todos, 200, todos.length === 0 ? "You haven't added any tasks yet. Stay productive and add your first one!" : undefined);
});

/**
 * @desc    Create new todo
 * @route   POST /api/v1/todos
 * @access  Private
 */
export const createTodo = asyncHandler(async (req, res) => {
    const { text } = req.body;
    // Enforce per-user limit to prevent resource abuse
    const count = await Todo.countDocuments({ user_id: req.user._id });
    if (count >= 500) {
        return res.sendError('Todo limit reached (500 max). Please remove some existing todos.', 400, 'RESOURCE_LIMIT');
    }
    const todo = await Todo.create({
        user_id: req.user._id,
        text,
        completed: false
    });
    return res.sendSuccess(todo, 201);
});

/**
 * @desc    Toggle todo completion
 * @route   PUT /api/v1/todos/:id
 * @access  Private
 */
export const toggleTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({ _id: req.params.id, user_id: req.user._id });
    if (todo) {
        todo.completed = !todo.completed;
        const updatedTodo = await todo.save();
        return res.sendSuccess(updatedTodo);
    } else {
        return res.sendError('Todo not found', 404, 'RES_NOT_FOUND');
    }
});

/**
 * @desc    Delete todo
 * @route   DELETE /api/v1/todos/:id
 * @access  Private
 */
export const deleteTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({ _id: req.params.id, user_id: req.user._id });
    if (todo) {
        await todo.deleteOne();
        return res.sendSuccess({ message: 'Todo removed' });
    } else {
        return res.sendError('Todo not found', 404, 'RES_NOT_FOUND');
    }
});
