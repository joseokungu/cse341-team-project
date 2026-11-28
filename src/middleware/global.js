/**
 * Helper function to set all expected res.locals values
 */
const setLocalVariables = (req, res, next) => {
    // Make NODE_ENV available to all templates
    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

    // Make any query parameters available to all templates
    res.locals.query = req.query;

    // Expose only the public session identity fields to EJS templates.
    res.locals.currentUser = req.session?.username
        ? { username: req.session.username, role: req.session.role }
        : null;

    next();
};

export default setLocalVariables;