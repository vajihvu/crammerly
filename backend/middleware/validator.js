export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validates request parameters against a schema
 */
export const validateParams = (schema) => (req, res, next) => {
    try {
        schema.parse(req.params);
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validates request query against a schema
 */
export const validateQuery = (schema) => (req, res, next) => {
    try {
        schema.parse(req.query);
        next();
    } catch (error) {
        next(error);
    }
};
