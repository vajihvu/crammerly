import { logger } from '../utils/logger.js';

/**
 * Mongoose Performance Plugin
 * Measures and logs the duration of all database queries
 */
export const performancePlugin = (schema) => {
    schema.pre(['find', 'findOne', 'countDocuments', 'aggregate', 'save', 'updateOne', 'deleteOne'], function (next) {
        this._startTime = process.hrtime();
        next();
    });

    schema.post(['find', 'findOne', 'countDocuments', 'aggregate', 'save', 'updateOne', 'deleteOne'], function (_res) {
        if (this._startTime) {
            const diff = process.hrtime(this._startTime);
            const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

            const modelName = this.model ? this.model.modelName : (this.constructor.modelName || 'Unknown');
            const op = this.op || 'save';

            logger.debug(`DB Query: ${modelName}.${op}`, {
                durationMs: parseFloat(durationMs),
                operation: op,
                model: modelName
            });
        }
    });
};
