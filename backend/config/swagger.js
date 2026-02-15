import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Crammerly API Documentation',
            version: '1.0.0',
            description: 'The core API for Crammerly - Productivity & Collaboration Platform',
            contact: {
                name: 'Antigravity AI',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server',
            },
            {
                url: '{protocol}://{domain}/api/v1',
                description: 'Production server',
                variables: {
                    protocol: {
                        default: 'https'
                    },
                    domain: {
                        default: 'api.crammerly.io'
                    }
                }
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                path: { type: 'string' },
                                version: { type: 'string', example: 'v1' }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string' },
                                message: { type: 'string' },
                                details: { type: 'array', items: { type: 'object' } }
                            }
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                path: { type: 'string' }
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        isActive: { type: 'boolean' },
                        role: { type: 'string', enum: ['user', 'admin'] }
                    }
                },
                Record: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        userId: { type: 'string' },
                        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
                        tags: { type: 'array', items: { type: 'string' } }
                    }
                },
                Todo: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        text: { type: 'string' },
                        completed: { type: 'boolean' },
                        user_id: { type: 'string' }
                    }
                },
                Session: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        deviceName: { type: 'string' },
                        ipAddress: { type: 'string' },
                        lastUsedAt: { type: 'string', format: 'date-time' },
                        isValid: { type: 'boolean' }
                    }
                }
            }
        },
    },
    apis: ['./routes/*.js', './controllers/*.js', './app.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
