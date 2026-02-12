/**
 * Simple wrapper for catching errors in async express routes.
 * Ensures any rejected promise is forwarded to Express error handling.
 */
const asyncHandler = (fn) => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};

export default asyncHandler;
