/**
 * Simple Schema Validation for Supabase data
 */

export const validateRoom = (data) => {
    const errors = [];
    if (!data.name || data.name.length < 3) errors.push("Room name must be at least 3 characters");
    if (!data.topic) errors.push("Topic is required");
    if (!data.task) errors.push("Task is required");
    if (data.privacy && !['Public', 'Private'].includes(data.privacy)) errors.push("Invalid privacy setting");

    if (errors.length > 0) throw new Error(errors.join(", "));
    return true;
};

export const validateMessage = (data) => {
    if (!data.content && !data.fileData && data.type !== 'sticker') {
        throw new Error("Message content cannot be empty");
    }
    return true;
};

export const validateProfile = (data) => {
    if (data.username && data.username.length < 3) throw new Error("Username too short");
    if (data.full_name && data.full_name.length < 2) throw new Error("Name too short");
    return true;
};
