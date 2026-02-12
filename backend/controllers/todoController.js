import Todo from '../models/Todo.js';

/**
 * @desc    Get all user todos
 * @route   GET /api/v1/todos
 * @access  Private
 */
export const getTodos = async (req, res, next) => {
    try {
        const todos = await Todo.find({ user_id: req.user._id });
        res.json({
            success: true,
            data: todos,
            message: todos.length === 0 ? "You haven't added any tasks yet. Stay productive and add your first one!" : undefined
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new todo
 * @route   POST /api/v1/todos
 * @access  Private
 */
export const createTodo = async (req, res, next) => {
    const { text } = req.body;
    try {
        const todo = await Todo.create({
            user_id: req.user._id,
            text,
            completed: false
        });
        res.status(201).json({
            success: true,
            data: todo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle todo completion
 * @route   PUT /api/v1/todos/:id
 * @access  Private
 */
export const toggleTodo = async (req, res, next) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, user_id: req.user._id });
        if (todo) {
            todo.completed = !todo.completed;
            const updatedTodo = await todo.save();
            res.json({
                success: true,
                data: updatedTodo
            });
        } else {
            const error = new Error('Todo not found');
            error.statusCode = 404;
            error.code = 'RES_NOT_FOUND';
            return next(error);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete todo
 * @route   DELETE /api/v1/todos/:id
 * @access  Private
 */
export const deleteTodo = async (req, res, next) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, user_id: req.user._id });
        if (todo) {
            await todo.deleteOne();
            res.json({
                success: true,
                message: 'Todo removed'
            });
        } else {
            const error = new Error('Todo not found');
            error.statusCode = 404;
            error.code = 'RES_NOT_FOUND';
            return next(error);
        }
    } catch (error) {
        next(error);
    }
};
