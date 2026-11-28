const homePage = (req, res) => {
    res.render('home', { title: 'Kizuna Rail' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error so you can see what it looks like.');
    err.status = 500;
    next(err);
};

const registerPage = (req, res) => {
    res.render('register', { title: 'Create Account', error: null });
};

const loginPage = (req, res) => {
    res.render('login', { title: 'Log In', error: null });
};

export { homePage, aboutPage, testErrorPage, registerPage, loginPage };